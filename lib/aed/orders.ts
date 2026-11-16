// Turn a Stripe Checkout session into an aed_orders row + the owner's LINE alert.
// Pure (no Stripe client, no DB) so it can be unit-tested with plain objects.
import { findCheckoutItem, thbExact } from "./checkout";

type Address = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
} | null;

/** The subset of Stripe.Checkout.Session we read (loose on purpose: field
 *  locations moved between API versions, e.g. shipping_details). */
export type SessionLike = {
  id: string;
  payment_status: string; // "paid" | "unpaid" | "no_payment_required"
  amount_total: number | null; // satang
  metadata?: Record<string, string> | null;
  payment_intent?: string | { id: string; payment_method?: string | { type?: string } | null } | null;
  customer_details?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: Address;
    business_name?: string | null;
    tax_ids?: { type: string; value: string | null }[] | null;
  } | null;
  shipping_details?: { name?: string | null; address?: Address } | null;
  collected_information?: { shipping_details?: { name?: string | null; address?: Address } | null } | null;
  custom_fields?: { key: string; text?: { value?: string | null } | null }[] | null;
  created?: number;
};

export type OrderStatus = "pending" | "paid" | "failed";

/**
 * The Stripe account is shared with other businesses (Morroo, Roodee, …) and
 * the webhook endpoint receives every checkout on it. Only sessions created by
 * this site's checkout carry a product_id from our catalog — everything else
 * must be ignored, not stored as an AED order.
 */
export function isJiaAedOrderSession(metadata: Record<string, string> | null | undefined): boolean {
  return findCheckoutItem(metadata?.product_id) != null;
}

export type OrderRow = {
  stripe_session_id: string;
  payment_intent_id: string | null;
  status: OrderStatus;
  product_id: string;
  units: number;
  credit_thb: number; // deposit / rent credited (admin "convert" links)
  converts_from: string | null; // FLEX subscription this purchase replaces
  net_thb: number;
  vat_thb: number;
  total_thb: number;
  payment_method: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  company_name: string | null;
  tax_id: string | null;
  tax_branch: string | null;
  shipping_address: { name: string | null; address: Address } | null;
  billing_address: Address;
  paid_at: string | null;
  updated_at: string;
};

export function orderFromSession(s: SessionLike, status: OrderStatus, now = new Date()): OrderRow {
  const pi = s.payment_intent;
  const pm = pi && typeof pi === "object" ? pi.payment_method : null;
  const cd = s.customer_details ?? {};
  const ship = s.collected_information?.shipping_details ?? s.shipping_details ?? null;
  const total = (s.amount_total ?? 0) / 100;
  const net = Number(s.metadata?.net_thb ?? NaN);
  const vat = Number(s.metadata?.vat_thb ?? NaN);
  return {
    stripe_session_id: s.id,
    payment_intent_id: pi ? (typeof pi === "string" ? pi : pi.id) : null,
    status,
    product_id: s.metadata?.product_id ?? "unknown",
    units: Number(s.metadata?.units) || 1,
    credit_thb: Number(s.metadata?.credit_thb) || 0,
    converts_from: s.metadata?.converts_from || null,
    net_thb: Number.isFinite(net) ? net : total,
    vat_thb: Number.isFinite(vat) ? vat : 0,
    total_thb: total,
    payment_method: pm && typeof pm === "object" ? (pm.type ?? null) : null,
    customer_name: cd.name ?? ship?.name ?? null,
    customer_email: cd.email ?? null,
    customer_phone: cd.phone ?? null,
    // API 2025-08-27.basil has no business_name: with tax ID collection the
    // business name the buyer types is stored as customer_details.name.
    company_name: cd.business_name ?? (cd.tax_ids?.some((t) => t.value) ? (cd.name ?? null) : null),
    tax_id: cd.tax_ids?.find((t) => t.value)?.value ?? null,
    tax_branch: s.custom_fields?.find((f) => f.key === "tax_branch")?.text?.value ?? null,
    shipping_address: ship ? { name: ship.name ?? null, address: ship.address ?? null } : null,
    billing_address: cd.address ?? null,
    paid_at: status === "paid" ? now.toISOString() : null,
    updated_at: now.toISOString(),
  };
}

export function formatAddress(a: Address): string {
  if (!a) return "";
  return [a.line1, a.line2, a.city, a.state, a.postal_code].filter(Boolean).join(" ");
}

const METHOD_TH: Record<string, string> = { card: "บัตร", promptpay: "PromptPay" };

/** LINE text for the owner when an order is paid (or a PromptPay payment fails). */
export function orderAlertText(o: OrderRow): string {
  const item = findCheckoutItem(o.product_id);
  const head =
    o.status === "paid"
      ? "💰 ออเดอร์ออนไลน์ — ชำระเงินแล้ว"
      : o.status === "failed"
        ? "⚠️ ออเดอร์ออนไลน์ — ชำระเงินไม่สำเร็จ"
        : "⏳ ออเดอร์ออนไลน์ — รอชำระเงิน";
  const lines: (string | null)[] = [
    head,
    `รุ่น: ${item?.name ?? o.product_id} × ${o.units}`,
    `ยอด: ${thbExact(o.total_thb)} (ก่อน VAT ${thbExact(o.net_thb)} + VAT ${thbExact(o.vat_thb)}${o.credit_thb > 0 ? ` − หักเงินประกัน/ค่าเช่า ${thbExact(o.credit_thb)}` : ""})`,
    o.converts_from ? "เปลี่ยนจากเช่า FLEX → ซื้อ (ใบกำกับภาษีออกเต็มราคา บันทึกเงินประกันเป็นรับชำระ)" : null,
    o.payment_method ? `ช่องทาง: ${METHOD_TH[o.payment_method] ?? o.payment_method}` : null,
    o.customer_name ? `ชื่อ: ${o.customer_name}` : null,
    o.customer_phone ? `โทร: ${o.customer_phone}` : null,
    o.customer_email ? `อีเมล: ${o.customer_email}` : null,
    o.company_name || o.tax_id
      ? `ใบกำกับภาษี: ${[o.company_name, o.tax_id && `เลข ${o.tax_id}`, o.tax_branch && `สาขา ${o.tax_branch}`].filter(Boolean).join(" · ")}`
      : null,
    o.shipping_address ? `ส่งที่: ${[o.shipping_address.name, formatAddress(o.shipping_address.address)].filter(Boolean).join(" — ")}` : null,
    o.status === "paid" ? "👉 โทรยืนยันกับลูกค้า นัดส่ง/ติดตั้ง และออกใบกำกับภาษี" : null,
    `Stripe: ${o.stripe_session_id}`,
  ];
  return lines.filter(Boolean).join("\n");
}
