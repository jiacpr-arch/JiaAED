/**
 * POST /api/checkout — start a Stripe Checkout session for one AED.
 *
 * Takes a plain HTML form post (productId) so the buy button works without
 * client JS, and answers with a 303 to the Stripe-hosted payment page.
 * Price comes from lib/aed/checkout.ts (the site price + 7% VAT) — the client
 * never sends an amount.
 */
import { NextResponse } from "next/server";
import { checkoutEnabled, findCheckoutItem, paymentMethods, satang } from "@/lib/aed/checkout";
import { getStripe } from "@/lib/aed/stripe";

export const runtime = "nodejs";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.jiaaed.com").replace(/\/$/, "");

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
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "th",
      currency: "thb",
      payment_method_types: paymentMethods(),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "thb",
            unit_amount: satang(item.net),
            product_data: { name: `AED ${item.name}`, description: "ราคาก่อน VAT · 1 เครื่อง" },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: "thb",
            unit_amount: satang(item.vat),
            product_data: { name: "ภาษีมูลค่าเพิ่ม 7%" },
          },
        },
      ],
      billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["TH"] },
      phone_number_collection: { enabled: true },
      // Buyers that need a ใบกำกับภาษี enter their 13-digit tax ID + company name.
      tax_id_collection: { enabled: true },
      custom_fields: [
        {
          key: "tax_branch",
          label: { type: "custom", custom: "สาขา (สำหรับใบกำกับภาษี)" },
          type: "text",
          optional: true,
        },
      ],
      metadata: { product_id: item.id, net_thb: String(item.net), vat_thb: String(item.vat) },
      payment_intent_data: { metadata: { product_id: item.id }, description: `JiaAED — ${item.name}` },
      success_url: `${SITE}/aed/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}${item.returnPath}?checkout=cancelled`,
    });
    if (!session.url) throw new Error("Stripe returned no checkout URL");
    return NextResponse.redirect(session.url, 303);
  } catch (e) {
    console.error("[AED] checkout session failed:", e);
    return NextResponse.json({ ok: false, error: "stripe_error" }, { status: 502 });
  }
}
