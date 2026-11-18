import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { deliverPurchase } from "./purchase-delivery.mjs";
import { openAiPurchase } from "./openai-purchase";
import type Stripe from "stripe";

export async function purchaseOperation(op: string, payload: Record<string, unknown>) {
  const {data, error} = await createAdminClient().rpc("aed_ads_delivery_op", {op, payload});
  if (error) throw new Error("Purchase ledger unavailable");
  return data;
}

export async function reportVerifiedPurchase(session: Stripe.Checkout.Session) {
  const key = process.env.OPENAI_ADS_CAPI_KEY?.trim();
  if (!key || process.env.OPENAI_ADS_CAPI_ENABLED !== "true") return;
  await deliverPurchase(session.id, openAiPurchase(session, session.id, null), purchaseOperation,
    async (event: unknown) => {
      const response = await fetch("https://bzr.openai.com/v1/events?pid=8Qwm1bqunw9i9Ad4LXxZeX", {
        method: "POST", headers: {Authorization: "Bearer " + key, "Content-Type": "application/json"},
        body: JSON.stringify({events: [event]}), signal: AbortSignal.timeout(3000)
      });
      if (!response.ok) throw new Error("Conversion delivery failed");
    });
}
