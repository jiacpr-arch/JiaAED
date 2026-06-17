/**
 * Stripe Webhook — JiaAED
 * POST /api/stripe/webhook
 *
 * Stripe Dashboard → Developers → Webhooks → Endpoint URL:
 *   https://<domain>/api/stripe/webhook
 *
 * Listens for `checkout.session.completed` (the event fired when a customer
 * finishes paying through a Payment Link created in handleCreatePaymentLink).
 * On a successful payment it:
 *   1. marks the deal as paid / won,
 *   2. issues a FlowAccount cash-invoice receipt, and
 *   3. notifies the owner over LINE.
 *
 * Required env vars (set in Vercel):
 *   STRIPE_SECRET_KEY      — same key used to create the Payment Links
 *   STRIPE_WEBHOOK_SECRET  — the signing secret for THIS endpoint (whsec_…),
 *                            copied from the webhook's "Signing secret" in the
 *                            Stripe Dashboard. Without it we cannot verify the
 *                            signature and every event is rejected.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDealById, getCustomerById, updateDeal } from "@/lib/aed/db-queries";
import { getProduct } from "@/lib/aed/pricing";
import { issueReceipt } from "@/lib/aed/flowaccount";
import { notifyPaymentReceived } from "@/lib/aed/notify-owner";

// Node runtime: the Stripe SDK needs `crypto` to verify the signature, and we
// rely on the raw request body (request.text()) being byte-for-byte unmodified.
export const runtime = "nodejs";

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    console.error("[Stripe] STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET not set");
    // 500 → Stripe will retry once the env vars are configured.
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  const stripe = new Stripe(stripeKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    // Bad/missing signature → 400 so Stripe stops retrying this delivery.
    console.error("[Stripe] signature verification failed:", String(err));
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // We only act on completed Checkout sessions; every other event type is
  // acknowledged with 200 so Stripe marks delivery successful.
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  try {
    await handleCheckoutCompleted(session);
  } catch (err) {
    // Fulfillment failed (e.g. FlowAccount transient error). Return 500 so
    // Stripe retries; the handler is idempotent so a retry is safe.
    console.error("[Stripe] fulfillment error:", err);
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─── Fulfillment ──────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const dealId = session.metadata?.deal_id;
  if (!dealId) {
    // Not a deal-linked payment (or metadata stripped) — nothing to fulfill.
    console.warn("[Stripe] checkout.session.completed without deal_id metadata:", session.id);
    return;
  }

  const deal = await getDealById(dealId);
  if (!deal) {
    console.warn(`[Stripe] deal not found for completed checkout: ${dealId}`);
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  // ── Step 1: mark the deal paid (idempotent — only on the paid transition) ──
  if (deal.payment_status !== "paid") {
    await updateDeal(dealId, {
      payment_status: "paid",
      stage: "won",
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntentId,
    });

    const product = getProduct(deal.product_id);
    await notifyPaymentReceived({
      customerName: deal.customer_id ? (await getCustomerById(deal.customer_id))?.full_name ?? null : null,
      productName: product?.nameTh ?? deal.product_id,
      quantity: deal.quantity,
      grandTotal: deal.total_amount ?? (session.amount_total ?? 0) / 100,
      dealId: deal.id,
    }).catch((err) => console.error("[Stripe] notifyPaymentReceived failed:", err));
  }

  // ── Step 2: issue the FlowAccount receipt (idempotent — skip if already done) ──
  if (!deal.flowaccount_receipt_id) {
    const product = getProduct(deal.product_id);
    const customer = deal.customer_id ? await getCustomerById(deal.customer_id) : null;

    // unit_price is stored ex-VAT; fall back to deriving it from the VAT-inclusive
    // total if it's ever missing, so the receipt total still matches what was paid.
    const quantity = deal.quantity || 1;
    const unitPriceExVat =
      deal.unit_price ?? Math.round(((deal.total_amount ?? 0) / 1.07 / quantity) * 100) / 100;

    const result = await issueReceipt({
      productCode: product?.faProductCode ?? deal.product_id,
      productName: product?.nameTh ?? deal.product_id,
      quantity,
      unitPriceExVat,
      contactName: customer?.full_name ?? "ลูกค้า",
      contactTaxId: customer?.tax_id ?? undefined,
      contactEmail: customer?.email ?? session.customer_details?.email ?? undefined,
      contactPhone: customer?.phone ?? undefined,
      companyName: customer?.company_name ?? undefined,
      notes: `deal_id: ${deal.id}`,
      stripePaymentIntentId: paymentIntentId ?? session.id,
      publishedOn: new Date().toISOString().slice(0, 10),
    });

    if (!result.ok) {
      // Throw so the POST handler returns 500 and Stripe retries the receipt.
      throw new Error(`FlowAccount receipt failed for deal ${deal.id}: ${result.error}`);
    }

    await updateDeal(dealId, { flowaccount_receipt_id: result.documentId ?? null });
  }
}
