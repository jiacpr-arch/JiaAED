/**
 * Stripe Webhook — payment confirmation
 * POST /api/stripe/webhook
 *
 * Stripe Dashboard → Developers → Webhooks → Add endpoint:
 *   https://jiaaed.vercel.app/api/stripe/webhook
 *   Events: checkout.session.completed, payment_intent.succeeded
 */

import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import Stripe from "stripe";
import { confirmDealPaid } from "@/lib/aed/payment-confirm";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!secret || !apiKey) {
    console.error("[AED] Stripe webhook env vars not set");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const body = await request.text();
  const stripe = new Stripe(apiKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("[AED] Stripe signature verification failed:", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  waitUntil(handleEvent(event, stripe).catch((err) => console.error("[AED] handleEvent error:", err)));

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event, stripe: Stripe): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== "paid") return;

      const dealId = session.metadata?.deal_id;
      if (!dealId) {
        console.warn("[AED] checkout.session.completed without deal_id metadata", session.id);
        return;
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? session.id;

      const result = await confirmDealPaid(dealId, paymentIntentId);
      console.log("[AED] confirmDealPaid (checkout):", { dealId, ...result });
      return;
    }

    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      let dealId: string | undefined = pi.metadata?.deal_id;

      // Payment Links propagate metadata to the Checkout Session, not always the PI.
      // If missing, look up the related session.
      if (!dealId) {
        const sessions = await stripe.checkout.sessions.list({ payment_intent: pi.id, limit: 1 });
        const sessionDealId = sessions.data[0]?.metadata?.deal_id;
        if (sessionDealId) dealId = sessionDealId;
      }

      if (!dealId) {
        console.warn("[AED] payment_intent.succeeded without deal_id", pi.id);
        return;
      }

      const result = await confirmDealPaid(dealId, pi.id);
      console.log("[AED] confirmDealPaid (pi):", { dealId, ...result });
      return;
    }

    default:
      return;
  }
}
