import { getDealWithCustomer, updateDeal } from "./db-queries";
import { getProduct, formatThaiPrice } from "./pricing";
import { issueReceipt } from "./flowaccount";
import { notifyPaymentReceived } from "./notify-owner";
import { pushLineMessage } from "./line-push";

export interface ConfirmResult {
  ok: boolean;
  alreadyPaid?: boolean;
  receiptNumber?: string;
  error?: string;
}

export async function confirmDealPaid(
  dealId: string,
  stripePaymentIntentId: string,
): Promise<ConfirmResult> {
  const found = await getDealWithCustomer(dealId);
  if (!found) return { ok: false, error: `deal not found: ${dealId}` };

  const { deal, customer } = found;

  if (deal.payment_status === "paid") {
    return { ok: true, alreadyPaid: true };
  }

  const product = getProduct(deal.product_id);
  if (!product) return { ok: false, error: `product not found: ${deal.product_id}` };
  if (deal.unit_price == null) return { ok: false, error: "deal.unit_price is null" };

  const today = new Date().toISOString().slice(0, 10);

  const receipt = await issueReceipt({
    productCode: product.faProductCode,
    productName: product.nameTh,
    quantity: deal.quantity,
    unitPriceExVat: deal.unit_price,
    contactName: customer.full_name ?? "ลูกค้า",
    contactPhone: customer.phone ?? undefined,
    contactEmail: customer.email ?? undefined,
    companyName: customer.company_name ?? undefined,
    contactTaxId: customer.tax_id ?? undefined,
    notes: `Deal ${deal.id.slice(0, 8)}`,
    stripePaymentIntentId,
    publishedOn: today,
  });

  await updateDeal(dealId, {
    stage: "won",
    payment_status: "paid",
    paid_at: new Date().toISOString(),
    ...(receipt.ok && receipt.documentId ? { flowaccount_receipt_id: receipt.documentId } : {}),
    notes: [deal.notes, `stripe_pi:${stripePaymentIntentId}`, receipt.ok ? `receipt:${receipt.documentNumber ?? receipt.documentId}` : `receipt_error:${receipt.error}`]
      .filter(Boolean)
      .join(" | "),
  });

  const grandTotal = deal.total_amount ?? 0;

  await notifyPaymentReceived({
    customerName: customer.full_name,
    productName: product.nameTh,
    quantity: deal.quantity,
    grandTotal,
    dealId: deal.id,
  }).catch((err) => console.error("[AED] notifyPaymentReceived failed:", err));

  if (customer.line_user_id) {
    const receiptLine = receipt.ok && receipt.documentNumber
      ? `📋 เลขใบเสร็จ: ${receipt.documentNumber}`
      : "📋 ใบเสร็จกำลังจัดทำ ทีมงานจะส่งให้เร็ว ๆ นี้ครับ";

    const customerMsg = [
      "✅ ได้รับการชำระเงินเรียบร้อยแล้วครับ ขอบคุณมากครับ! 🙏",
      "",
      `📦 ${product.nameTh} × ${deal.quantity} เครื่อง`,
      `💰 ยอดรวม: ${formatThaiPrice(grandTotal)}`,
      receiptLine,
      "",
      "ทีมงานจะจัดส่งสินค้าให้ตามที่อยู่ที่ลงทะเบียนไว้ และจะแจ้ง tracking ให้ทราบนะครับ",
    ].join("\n");

    await pushLineMessage(customer.line_user_id, customerMsg).catch((err) =>
      console.error("[AED] customer thank-you push failed:", err),
    );
  }

  return {
    ok: true,
    receiptNumber: receipt.documentNumber,
    error: receipt.ok ? undefined : receipt.error,
  };
}
