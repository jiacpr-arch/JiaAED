/**
 * POST /api/checkout — start a Stripe Checkout session for one AED.
 *
 * Takes a plain HTML form post (productId) so the buy button works without
 * client JS, and answers with a 303 to the Stripe-hosted payment page.
 * Price comes from lib/aed/checkout.ts (the site price + 7% VAT) — the client
 * never sends an amount.
 */
import { NextResponse } from "next/server";
import { checkoutEnabled, findCheckoutItem } from "@/lib/aed/checkout";
import { createOrderSession } from "@/lib/aed/checkout-sessions";
import { receiptFromCookies } from "@/lib/aed/purchase-delivery.mjs";
import { purchaseOperation } from "@/lib/aed/purchase-receipt";
import { getStripe } from "@/lib/aed/stripe";

export const runtime = "nodejs";

async function readProductId(req: Request): Promise<unknown> {
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) return ((await req.json()) as { productId?: unknown }).productId;
    return (await req.formData()).get("productId");
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe || !checkoutEnabled()) {
    return NextResponse.json({ ok: false, error: "checkout_disabled" }, { status: 503 });
  }

  const item = findCheckoutItem(await readProductId(req));
  if (!item) return NextResponse.json({ ok: false, error: "unknown_product" }, { status: 400 });

  try {
    const liveHost = ["jiaaed.com","www.jiaaed.com"].includes(new URL(req.url).hostname);
    const managed = liveHost && process.env.OPENAI_ADS_WEBHOOK_ENABLED === "true";
    const receipt = managed ? receiptFromCookies(req.headers.get("cookie")) : null;
    if (receipt) {
      try { await purchaseOperation("register", {receipt: receipt.receipt}); }
      catch { console.warn("[AED] measurement consent unavailable"); }
    }
    const session = await createOrderSession(stripe, {item, metadata: {
      openai_storefront: "1", ...(managed ? {openai_delivery: "webhook_v1"} : {})
    }});
    if (receipt && session.livemode) {
      try { await purchaseOperation("bind", {session: session.id, ...receipt}); }
      catch { console.warn("[AED] measurement receipt unavailable"); }
    }
    if (!session.url) throw new Error("Stripe returned no checkout URL");
    return NextResponse.redirect(session.url, 303);
  } catch (e) {
    console.error("[AED] checkout session failed:", e);
    return NextResponse.json({ ok: false, error: "stripe_error" }, { status: 502 });
  }
}
