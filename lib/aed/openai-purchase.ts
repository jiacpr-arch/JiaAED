import { createHash } from "node:crypto";
import type Stripe from "stripe";
import { isJiaAedOrderSession } from "./orders";

export function openAiPurchase(session: Stripe.Checkout.Session, sessionId: string, cookies: string | null, now = Date.now()) {
  const amount = session.amount_total;
  const intent = typeof session.payment_intent === "object" ? session.payment_intent : null;
  const charge = typeof intent?.latest_charge === "object" ? intent.latest_charge : null;
  if (session.id !== sessionId || !/^cs_live_[A-Za-z0-9]{1,200}$/.test(sessionId) ||
      !session.livemode || session.mode !== "payment" || session.payment_status !== "paid" ||
      session.currency !== "thb" || amount === null || !Number.isSafeInteger(amount) || amount <= 0 ||
      session.metadata?.openai_storefront !== "1" || !isJiaAedOrderSession(session.metadata) ||
      intent?.status !== "succeeded" || intent.amount_received !== amount ||
      !charge || charge.amount_refunded !== 0 || !Number.isSafeInteger(charge.created) ||
      charge.created * 1000 > now || now - charge.created * 1000 > 86400000) return null;
  const refs = (cookies || "").split(";").map(value => value.trimStart())
    .filter(value => value.startsWith("__oppref=")).map(value => value.slice(9));
  const oppref = refs.length === 1 && /^[\x21-\x7e]{1,2048}$/.test(refs[0]) ? refs[0] : undefined;
  return {
    id: "jiaaed_" + createHash("sha256").update(sessionId).digest("hex"),
    type: "order_created", timestamp_ms: charge.created * 1000, action_source: "web",
    source_url: "https://jiaaed.com/aed/checkout/success", opt_out: true,
    ...(oppref ? { oppref } : {}),
    data: { type: "contents", amount, currency: "THB" },
  };
}
