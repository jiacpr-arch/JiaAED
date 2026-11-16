// Stripe + DB side of the admin refund buttons (see ./refunds.ts).
import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { pushToOwner } from "./notify-owner";
import { flexEndQuote, flexEndText, orderRefundAmount, orderRefundText, refundableLeft, type FlexEnd } from "./refunds";

type Fail = { ok: false; error: string; status?: number };

/** Refund all or part of a paid online order. */
export async function refundOrder(
  stripe: Stripe,
  db: SupabaseClient,
  orderId: number,
  requested: number,
): Promise<{ ok: true; refunded: number; left: number } | Fail> {
  const { data: order } = await db.from("aed_orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return { ok: false, error: "order_not_found", status: 404 };
  if (!order.payment_intent_id) return { ok: false, error: "no_payment" };
  const amount = orderRefundAmount(order, requested);
  if (typeof amount === "string") return { ok: false, error: amount };

  // Idempotency key: the same click (same order, same running total) can't refund twice.
  await stripe.refunds.create(
    { payment_intent: order.payment_intent_id, amount: Math.round(amount * 100), reason: "requested_by_customer", metadata: { source: "jiaaed_admin" } },
    { idempotencyKey: `order-${order.id}-${Number(order.refunded_thb ?? 0)}-${amount}` },
  );
  const refunded = Math.round((Number(order.refunded_thb ?? 0) + amount) * 100) / 100;
  await db.from("aed_orders").update({ refunded_thb: refunded, refunded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", order.id);
  const left = refundableLeft({ ...order, refunded_thb: refunded });
  await pushToOwner(orderRefundText(order, amount, left));
  return { ok: true, refunded: amount, left };
}

/** The PaymentIntent that paid a subscription's first invoice (deposit + first month). */
async function firstInvoicePaymentIntent(stripe: Stripe, subscriptionId: string): Promise<string | null> {
  const invoices = await stripe.invoices.list({ subscription: subscriptionId, limit: 100 });
  const first = invoices.data.find((i) => i.billing_reason === "subscription_create") ?? invoices.data.at(-1);
  if (!first?.id) return null;
  const payments = await stripe.invoicePayments.list({ invoice: first.id, limit: 10 });
  for (const p of payments.data) {
    const pi = p.payment?.payment_intent;
    if (pi && p.status === "paid") return typeof pi === "string" ? pi : pi.id;
  }
  return null;
}

/** FLEX machine returned: stop rent, refund deposit − damage. */
export async function endFlexRental(
  stripe: Stripe,
  db: SupabaseClient,
  subscriptionId: string,
  damage: number,
): Promise<{ ok: true; quote: FlexEnd; refunded: boolean } | Fail> {
  const { data: row } = await db.from("aed_rental_billing").select("*").eq("stripe_subscription_id", subscriptionId).maybeSingle();
  if (!row) return { ok: false, error: "rental_not_found", status: 404 };
  if (!["active", "past_due"].includes(row.status)) return { ok: false, error: "rental_not_active", status: 409 };
  const quote = flexEndQuote(row, damage);
  if (!quote) return { ok: false, error: "not_flex" };

  // Mark first so the customer.subscription.deleted webhook doesn't alert as a cancellation.
  const now = new Date().toISOString();
  await db
    .from("aed_rental_billing")
    .update({ status: "canceled", damage_thb: quote.damage, ended_at: now, updated_at: now })
    .eq("stripe_subscription_id", subscriptionId);
  try {
    await stripe.subscriptions.cancel(subscriptionId, { prorate: false, invoice_now: false });
  } catch (e) {
    if ((e as { code?: string }).code !== "resource_missing") {
      await db.from("aed_rental_billing").update({ status: row.status, ended_at: null, damage_thb: null, updated_at: now }).eq("stripe_subscription_id", subscriptionId);
      throw e;
    }
  }

  let refunded = false;
  if (quote.refund > 0) {
    try {
      const pi = await firstInvoicePaymentIntent(stripe, subscriptionId);
      if (pi) {
        await stripe.refunds.create(
          { payment_intent: pi, amount: Math.round(quote.refund * 100), reason: "requested_by_customer", metadata: { source: "jiaaed_admin", kind: "flex_deposit" } },
          { idempotencyKey: `flex-deposit-${subscriptionId}` },
        );
        refunded = true;
        await db.from("aed_rental_billing").update({ deposit_refunded_thb: quote.refund, updated_at: new Date().toISOString() }).eq("stripe_subscription_id", subscriptionId);
      }
    } catch (e) {
      console.error("[AED] flex deposit refund failed:", e);
    }
  }
  await pushToOwner(flexEndText(row, quote, refunded));
  return { ok: true, quote, refunded };
}
