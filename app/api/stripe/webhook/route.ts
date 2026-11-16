/**
 * Stripe Webhook — POST /api/stripe/webhook
 *
 * Records online orders from Stripe Checkout (/api/checkout) in aed_orders
 * and pushes a LINE alert to the owner/admins when an order is paid. Also runs
 * monthly card billing for rental customers (lib/aed/rental-billing-webhook.ts).
 *
 * Events to enable on the Stripe Dashboard endpoint:
 *   checkout.session.completed
 *   checkout.session.async_payment_succeeded   (PromptPay paid later)
 *   checkout.session.async_payment_failed
 *   invoice.paid                               (rental monthly charge)
 *   invoice.payment_failed
 *   customer.subscription.deleted
 *   payment_intent.canceled                    (event-rental card hold expired)
 *
 * Until STRIPE_WEBHOOK_SECRET is set this keeps the old "tombstone" behaviour
 * (answer 200, do nothing) so the endpoint still registered in the Dashboard
 * from the earlier integration doesn't send failed-delivery emails.
 */
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/aed/stripe";
import { pushToOwner } from "@/lib/aed/notify-owner";
import { RENTAL_EVENTS, finalizeConversion, handleRentalCheckout, handleRentalEvent } from "@/lib/aed/rental-billing-webhook";
import { handleHoldCanceled, handleHoldCheckout } from "@/lib/aed/rental-holds-webhook";
import { isJiaAedOrderSession, orderAlertText, orderFromSession, type OrderStatus, type SessionLike } from "@/lib/aed/orders";

export const runtime = "nodejs";

const HANDLED: Record<string, (s: Stripe.Checkout.Session) => OrderStatus> = {
  "checkout.session.completed": (s) => (s.payment_status === "paid" ? "paid" : "pending"),
  "checkout.session.async_payment_succeeded": () => "paid",
  "checkout.session.async_payment_failed": () => "failed",
};

export async function POST(req: Request): Promise<NextResponse> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripe();
  if (!secret || !stripe) {
    return NextResponse.json({ received: true, note: "Stripe webhook not configured; event ignored." }, { status: 200 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, req.headers.get("stripe-signature") ?? "", secret);
  } catch (e) {
    console.warn("[AED] stripe webhook bad signature:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "bad_signature" }, { status: 400 });
  }

  // Rental card billing (subscriptions created from /admin/billing).
  try {
    if (RENTAL_EVENTS.has(event.type)) {
      const r = await handleRentalEvent(createAdminClient(), event);
      return NextResponse.json({ received: true, rental: r.handled, note: r.note });
    }
    if (event.type === "payment_intent.canceled") {
      const r = await handleHoldCanceled(createAdminClient(), event.data.object as Stripe.PaymentIntent);
      return NextResponse.json({ received: true, hold: r.handled });
    }
    const obj = event.data.object as Stripe.Checkout.Session;
    if (event.type === "checkout.session.completed" && obj.mode === "subscription") {
      const r = await handleRentalCheckout(stripe, createAdminClient(), obj);
      return NextResponse.json({ received: true, rental: r.handled, note: r.note });
    }
    // Event-rental card hold (manual capture → the session completes "unpaid").
    if (event.type === "checkout.session.completed" && obj.metadata?.kind === "rental_hold") {
      const r = await handleHoldCheckout(stripe, createAdminClient(), obj);
      return NextResponse.json({ received: true, hold: r.handled, note: r.note });
    }
  } catch (e) {
    console.error("[AED] rental billing webhook failed:", e);
    return NextResponse.json({ ok: false, error: "rental_billing_error" }, { status: 500 }); // Stripe retries
  }

  const toStatus = HANDLED[event.type];
  if (!toStatus) return NextResponse.json({ received: true, ignored: event.type });

  const evSession = event.data.object as Stripe.Checkout.Session;
  // Shared Stripe account: ignore other businesses' checkouts.
  if (!isJiaAedOrderSession(evSession.metadata)) {
    return NextResponse.json({ received: true, ignored: "not a JiaAED order" });
  }
  const status = toStatus(evSession);

  // Re-read the session so we get the payment method + full customer details.
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(evSession.id, { expand: ["payment_intent.payment_method"] });
  } catch (e) {
    console.error("[AED] stripe session retrieve failed:", e);
    return NextResponse.json({ ok: false, error: "retrieve_failed" }, { status: 500 }); // Stripe retries
  }

  const order = orderFromSession(session as unknown as SessionLike, status);
  const db = createAdminClient();

  // A FLEX renter bought the machine (admin "convert" link): stop the old rent.
  // Idempotent, so it also runs on retries before the duplicate check.
  const convertsFrom = session.metadata?.converts_from;
  if (status === "paid" && convertsFrom) {
    try {
      await finalizeConversion(stripe, db, convertsFrom, Number(session.metadata?.credit_thb) || 0);
    } catch (e) {
      console.error("[AED] conversion finalize failed:", e);
      return NextResponse.json({ ok: false, error: "conversion_error" }, { status: 500 }); // Stripe retries
    }
  }

  const { data: existing } = await db
    .from("aed_orders")
    .select("status")
    .eq("stripe_session_id", order.stripe_session_id)
    .maybeSingle();

  // Never downgrade a paid order (events can arrive out of order).
  if (existing?.status === "paid" || existing?.status === status) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const { error } = await db.from("aed_orders").upsert(order, { onConflict: "stripe_session_id" });
  if (error) {
    console.error("[AED] aed_orders upsert failed:", error);
    // Still tell the team — a paid order must not be lost because of the DB.
    // Answer 200 once the team has the alert, otherwise Stripe's retries would
    // repeat the alert for days; the order itself stays in the Stripe Dashboard.
    if (status === "paid" && (await pushToOwner(`${orderAlertText(order)}\n\n(⚠️ บันทึกลงฐานข้อมูลไม่สำเร็จ — เช็คใน Stripe Dashboard)`))) {
      return NextResponse.json({ received: true, stored: false });
    }
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }

  if (status !== "pending") await pushToOwner(orderAlertText(order));
  return NextResponse.json({ received: true, status });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: "ok", configured: !!process.env.STRIPE_WEBHOOK_SECRET }, { status: 200 });
}
