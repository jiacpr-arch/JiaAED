/**
 * /api/admin/rental-billing — monthly card billing for rental customers.
 *   GET  → list subscriptions recorded by the Stripe webhook
 *   POST → create a Stripe Checkout (subscription) link for one signed contract
 *
 * Admin-only (session cookie). The link is sent to the customer on LINE; it
 * expires after 24 h (Stripe's maximum) — create a new one if it lapses.
 */
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { isAuthorized } from "@/lib/aed/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, getVatTaxRateId } from "@/lib/aed/stripe";
import { satang } from "@/lib/aed/checkout";
import {
  MAX_RENTAL_UNITS,
  firstInstalmentAnchor,
  findRentalPlan,
  quoteRental,
  quoteSummary,
} from "@/lib/aed/rental-billing";

export const runtime = "nodejs";
export const maxDuration = 30;

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.jiaaed.com").replace(/\/$/, "");

const unauthorized = () => NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

const text = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function GET(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const { data, error } = await createAdminClient()
    .from("aed_rental_billing")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[admin/rental-billing][GET]", error.message);
    return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, rows: data ?? [], stripeReady: !!getStripe() });
}

type Body = {
  planId?: unknown;
  units?: unknown;
  customerName?: unknown;
  companyName?: unknown;
  email?: unknown;
  phone?: unknown;
  contractRef?: unknown;
};

export async function POST(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 503 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const plan = findRentalPlan(body.planId);
  const units = Number(body.units ?? 1);
  if (!plan) return NextResponse.json({ ok: false, error: "unknown_plan" }, { status: 400 });
  if (!Number.isInteger(units) || units < 1 || units > MAX_RENTAL_UNITS) {
    return NextResponse.json({ ok: false, error: "bad_units" }, { status: 400 });
  }
  const customerName = text(body.customerName);
  const companyName = text(body.companyName);
  const email = text(body.email, 200);
  const phone = text(body.phone, 40);
  const contractRef = text(body.contractRef, 60);
  if (!customerName && !companyName) {
    return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "bad_email" }, { status: 400 });
  }

  try {
    const vat = await getVatTaxRateId(stripe);
    const metadata: Record<string, string> = {
      kind: "rental_billing",
      plan_id: plan.id,
      units: String(units),
      months_total: plan.months == null ? "" : String(plan.months),
      customer_name: customerName,
      company_name: companyName,
      phone,
      contract_ref: contractRef,
    };

    const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
      description: `${plan.label}${contractRef ? ` · สัญญา ${contractRef}` : ""}`,
      metadata,
    };
    // Rent-to-own: today = down payment only; instalments start next month.
    if (!plan.firstMonthUpfront) {
      subscriptionData.billing_cycle_anchor = firstInstalmentAnchor();
      subscriptionData.proration_behavior = "none";
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      locale: "th",
      currency: "thb",
      payment_method_types: ["card"], // PromptPay can't be charged automatically
      ...(email ? { customer_email: email } : {}),
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      line_items: [
        {
          quantity: units,
          price_data: {
            currency: "thb",
            unit_amount: satang(plan.upfront.amount),
            product_data: { name: `${plan.upfront.label} — ${plan.label}` },
          },
          ...(plan.upfront.vat ? { tax_rates: [vat] } : {}),
        },
        {
          quantity: units,
          price_data: {
            currency: "thb",
            unit_amount: satang(plan.monthly),
            recurring: { interval: "month" },
            product_data: {
              name: `ค่า${plan.kind === "rent-to-own" ? "เช่าซื้อ" : "เช่า"}รายเดือน — ${plan.label}`,
              description: plan.months ? `${plan.months} งวด` : "ตัดทุกเดือนจนกว่าจะแจ้งเลิกเช่า",
            },
          },
          tax_rates: [vat],
        },
      ],
      subscription_data: subscriptionData,
      metadata,
      custom_text: { submit: { message: quoteSummary(plan, units) } },
      expires_at: Math.floor(Date.now() / 1000) + 23 * 3600,
      success_url: `${SITE}/aed/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
      expiresAt: session.expires_at,
      quote: quoteRental(plan, units),
      summary: quoteSummary(plan, units),
    });
  } catch (e) {
    console.error("[admin/rental-billing][POST] stripe error:", e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: "stripe_error", message }, { status: 502 });
  }
}
