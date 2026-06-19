/**
 * Tool Handlers — ฟังก์ชันที่ AI เรียกผ่าน Function Calling
 * แต่ละ handler รับ input JSON และ return ผลลัพธ์เป็น string (Claude อ่านได้)
 */

import { calculatePrice, getProduct, evaluateNegotiation, formatThaiPrice } from "./pricing";
import { createQuotation } from "./flowaccount";
import { notifyEscalation, notifyNewQuotation } from "./notify-owner";
import { recordConversion } from "./conversion";
import {
  updateCustomer,
  createDeal,
  updateDeal,
  scheduleFollowup,
  createChatLead,
} from "./db-queries";
import type {
  AedCustomer,
  AedConversation,
  CalculatePriceInput,
  CreateQuotationInput,
  EscalateToHumanInput,
  ScheduleFollowupInput,
  UpdateCustomerInfoInput,
} from "./types";

// ─── Context passed in from orchestrator ─────────────────────────────────────

export interface ToolContext {
  customer: AedCustomer;
  conversation: AedConversation;
}

// ─── get_customer_info ────────────────────────────────────────────────────────

export async function handleGetCustomerInfo(ctx: ToolContext): Promise<string> {
  const c = ctx.customer;
  const fields: string[] = [];
  if (c.full_name) fields.push(`ชื่อ: ${c.full_name}`);
  if (c.phone) fields.push(`เบอร์: ${c.phone}`);
  if (c.email) fields.push(`อีเมล: ${c.email}`);
  if (c.company_name) fields.push(`บริษัท: ${c.company_name}`);
  if (c.tax_id) fields.push(`เลขผู้เสียภาษี: ${c.tax_id}`);
  if (c.customer_type !== "individual") fields.push(`ประเภท: ${c.customer_type}`);
  if (c.total_orders > 0) fields.push(`เคยสั่งซื้อ: ${c.total_orders} ครั้ง`);

  return fields.length > 0
    ? `ข้อมูลลูกค้า: ${fields.join(" | ")}`
    : "ยังไม่มีข้อมูลลูกค้า (ลูกค้าใหม่)";
}

// ─── update_customer_info ─────────────────────────────────────────────────────

export async function handleUpdateCustomerInfo(
  ctx: ToolContext,
  input: UpdateCustomerInfoInput,
): Promise<string> {
  await updateCustomer(ctx.customer.id, {
    ...(input.full_name && { full_name: input.full_name }),
    ...(input.phone && { phone: input.phone }),
    ...(input.email && { email: input.email }),
    ...(input.company_name && { company_name: input.company_name }),
    ...(input.tax_id && { tax_id: input.tax_id }),
    ...(input.address && { address: input.address }),
    ...(input.customer_type && { customer_type: input.customer_type, is_company: input.customer_type !== "individual" }),
  });

  // First time a contact is secured in this chat → log a real lead and report it
  // to Google Ads. LINE carries no gclid, so this relies on enhanced-conversion
  // matching of the hashed phone/email. recordConversion is a safe no-op (logged
  // to aed_conversion_log) until the GOOGLE_ADS_* offline-import env is set.
  const hadContact = Boolean(ctx.customer.phone || ctx.customer.email);
  const phone = input.phone ?? ctx.customer.phone ?? null;
  const email = input.email ?? ctx.customer.email ?? null;
  if (!hadContact && (phone || email)) {
    const leadId = await createChatLead({
      customerId: ctx.customer.id,
      conversationId: ctx.conversation.id,
      channel: ctx.conversation.channel,
      fullName: input.full_name ?? ctx.customer.full_name ?? null,
      phone,
      email,
      companyName: input.company_name ?? ctx.customer.company_name ?? null,
    });
    void recordConversion({ phone, email, orderId: leadId ?? undefined }).catch((e) =>
      console.error("[AED] chat conversion failed:", e),
    );
    // Reflect locally so repeated calls within the same turn don't double-fire.
    ctx.customer.phone = phone;
    ctx.customer.email = email;
  }

  return `บันทึกข้อมูลลูกค้าแล้ว: ${JSON.stringify(input)}`;
}

// ─── calculate_price ──────────────────────────────────────────────────────────

export async function handleCalculatePrice(input: CalculatePriceInput): Promise<string> {
  const result = calculatePrice(input.product_id, input.quantity, input.customer_type ?? "individual");
  if (!result) return `ไม่พบสินค้า id: ${input.product_id}`;

  const product = getProduct(input.product_id)!;
  const lines = [
    `สินค้า: ${product.nameTh}`,
    `จำนวน: ${input.quantity} เครื่อง`,
    `ราคาต่อเครื่อง: ${formatThaiPrice(result.unitPrice)} (ยังไม่รวม VAT)`,
    `รวม: ${formatThaiPrice(result.subtotal)}`,
    `VAT 7%: ${formatThaiPrice(result.vatAmount)}`,
    `รวมทั้งสิ้น: ${formatThaiPrice(result.grandTotal)}`,
    `ระดับราคา: ${result.priceLevel}`,
    `ลดราคาเพิ่มได้: ${result.canDiscount ? "ได้ (ถึง bestPrice)" : "ไม่ได้ — ต้อง escalate"}`,
  ];

  // Check if qty triggers escalation
  if (input.quantity >= 5) {
    lines.push(`⚠️ จำนวน ≥5 เครื่อง → ต้อง escalate_to_human ก่อนเสนอราคา`);
  }

  return lines.join("\n");
}

// ─── create_quotation ─────────────────────────────────────────────────────────

export async function handleCreateQuotation(
  ctx: ToolContext,
  input: CreateQuotationInput,
): Promise<string> {
  const product = getProduct(input.product_id);
  if (!product) return `ไม่พบสินค้า: ${input.product_id}`;

  // Create deal in DB first
  const deal = await createDeal(
    ctx.customer.id,
    ctx.conversation.id,
    input.product_id,
    input.quantity,
    input.unit_price,
  );

  // Create quotation in FlowAccount
  const result = await createQuotation({
    productCode: product.faProductCode,
    productName: product.nameTh,
    quantity: input.quantity,
    unitPriceExVat: input.unit_price,
    contactName: input.customer_name,
    contactPhone: input.customer_phone,
    contactEmail: input.customer_email,
    companyName: input.company_name,
    contactTaxId: input.tax_id,
    notes: input.notes,
  });

  if (!result.ok) {
    return `สร้างใบเสนอราคาล้มเหลว: ${result.error}`;
  }

  // Save FA document IDs to deal
  await updateDeal(deal.id, {
    stage: "quoted",
    flowaccount_quotation_id: result.documentId,
    flowaccount_quotation_number: result.documentNumber,
  });

  const subtotal = input.unit_price * input.quantity;
  const vatAmount = Math.round(subtotal * 0.07 * 100) / 100;
  const grandTotal = subtotal + vatAmount;

  // Notify owner about the new quotation
  if (result.documentNumber) {
    void notifyNewQuotation({
      customerName: ctx.customer.full_name,
      productName: product.nameTh,
      quantity: input.quantity,
      grandTotal,
      quotationNumber: result.documentNumber,
    }).catch((e) => console.error("[AED] notifyNewQuotation failed:", e));
  }

  return [
    `สร้างใบเสนอราคาสำเร็จ`,
    `เลขที่: ${result.documentNumber ?? result.documentId}`,
    `deal_id: ${deal.id}`,
    `ยอดรวม: ${formatThaiPrice(grandTotal)}`,
    `ขั้นตอนต่อไป: แจ้งลูกค้าให้ติดต่อทีมผ่าน LINE @jiacpr เพื่อนัดชำระเงิน`,
  ].join("\n");
}

// ─── escalate_to_human ────────────────────────────────────────────────────────

export async function handleEscalateToHuman(
  ctx: ToolContext,
  input: EscalateToHumanInput,
): Promise<string> {
  await notifyEscalation({
    reason: input.reason,
    urgency: input.urgency,
    summary: input.summary,
    customerName: ctx.customer.full_name,
    lineUserId: ctx.customer.line_user_id ?? "unknown",
  });

  const urgencyMsg = {
    high: "ทีมงานจะติดต่อกลับโดยเร็วที่สุดครับ 🔴",
    medium: "ทีมงานจะติดต่อกลับภายในวันนี้ครับ 🟡",
    low: "ทีมงานจะติดต่อกลับภายใน 1-2 วันทำการครับ 🟢",
  }[input.urgency];

  return `escalated_to_human | ${urgencyMsg}`;
}

// ─── schedule_followup ────────────────────────────────────────────────────────

export async function handleScheduleFollowup(
  ctx: ToolContext,
  input: ScheduleFollowupInput,
  dealId?: string,
): Promise<string> {
  const followup = await scheduleFollowup(
    ctx.customer.id,
    ctx.conversation.id,
    input.days_later,
    input.message_template,
    dealId,
  );

  const scheduledDate = new Date(followup.scheduled_for).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" });
  return `ตั้ง follow-up สำเร็จ — จะส่งข้อความในวันที่ ${scheduledDate}`;
}
