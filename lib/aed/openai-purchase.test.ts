import type Stripe from "stripe";
import { expect, it } from "vitest";
import { openAiPurchase } from "./openai-purchase";
import { findCheckoutItem } from "./checkout";

const now = 1794990000000;
const sessionId = "cs_live_Synthetic123";
const fixture = {
  id: sessionId, created: now / 1000, livemode: true, mode: "payment",
  payment_status: "paid", currency: "thb", amount_total: 100000,
  payment_intent: { status: "succeeded", amount_received: 100000, latest_charge: { created: now / 1000, amount_refunded: 0 } },
  metadata: { openai_storefront: "1", product_id: "primedic-y2" },
} as unknown as Stripe.Checkout.Session;

it("reports only verified storefront Stripe sales, with opaque attribution and a stable ID", () => {
  expect(findCheckoutItem(fixture.metadata?.product_id)).toBeTruthy();
  const event = openAiPurchase(fixture, sessionId, "__oppref=opaque%2F+token", now);
  expect(event).toMatchObject({ type: "order_created", oppref: "opaque%2F+token", data: { amount: 100000 } });
  expect(event?.id).toMatch(/^jiaaed_[a-f0-9]{64}$/);
  expect(openAiPurchase(fixture, sessionId, "__oppref=x; __oppref=y", now + 100)?.id).toBe(event?.id);
  expect(openAiPurchase(fixture, sessionId, "__oppref=x; __oppref=y", now)).not.toHaveProperty("oppref");
  expect(openAiPurchase(fixture, sessionId, null, now + 86400001)).toBeNull();
  for (const session of [
    { ...fixture, livemode: false },
    { ...fixture, payment_status: "unpaid" as const },
    { ...fixture, mode: "subscription" as const },
    { ...fixture, metadata: { product_id: "primedic-y2" } },
    { ...fixture, payment_intent: null },
  ]) expect(openAiPurchase(session, sessionId, null, now)).toBeNull();
});
