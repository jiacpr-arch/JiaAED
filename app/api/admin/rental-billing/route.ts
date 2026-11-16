/**
 * /api/admin/rental-billing — card payments for rental customers (admin only).
 *   GET  → monthly-billing customers + event card holds
 *   POST { action, ... }
 *     "subscribe" (default) → monthly card billing link for a signed contract
 *     "convert"  → buy / rent-to-own link with the FLEX deposit (+ rent) credited;
 *                  the old rental stops once the customer pays
 *     "hold"     → event rental: hold rent + deposit on the card
 *     "capture"  → machine returned: take the rent (+ damage), release the rest
 *     "release"  → cancel a hold without charging (rental cancelled)
 *     "refund_order" → refund all or part of a paid online order
 *     "end_flex" → FLEX machine returned: stop rent, refund deposit − damage
 *     "refund_hold" → refund part of a captured hold (full hold taken before expiry)
 *
 * Links expire after 23 h (Stripe's maximum is 24 h) — create a new one if it lapses.
 */
import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/aed/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/aed/stripe";
import { VAT_RATE, findCheckoutItem } from "@/lib/aed/checkout";
import {
  createCreditCoupon,
  createHoldSession,
  createOrderSession,
  createRentalSession,
  type CustomerInfo,
} from "@/lib/aed/checkout-sessions";
import { endFlexRental, refundHold, refundOrder } from "@/lib/aed/refund-actions";
import { MAX_RENTAL_UNITS, findRentalPlan, quoteRental, quoteSummary } from "@/lib/aed/rental-billing";
import { conversionQuote, conversionSummary, depositOf, findConversionTarget } from "@/lib/aed/rental-conversion";
import {
  MAX_HOLD_UNITS,
  captureAmount,
  findHoldPackage,
  holdQuote,
  holdReturnDateOk,
  holdSummary,
  type HoldRow,
} from "@/lib/aed/rental-holds";

export const runtime = "nodejs";
export const maxDuration = 30;

const unauthorized = () => NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

const text = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN);

export async function GET(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const db = createAdminClient();
  const [billing, holds, orders] = await Promise.all([
    db.from("aed_rental_billing").select("*").order("created_at", { ascending: false }).limit(200),
    db.from("aed_rental_holds").select("*").order("created_at", { ascending: false }).limit(100),
    db.from("aed_orders").select("*").eq("status", "paid").order("created_at", { ascending: false }).limit(100),
  ]);
  if (billing.error) {
    console.error("[admin/rental-billing][GET]", billing.error.message);
    return bad("database_error", 500);
  }
  return NextResponse.json({
    ok: true,
    rows: billing.data ?? [],
    holds: holds.error ? [] : (holds.data ?? []),
    orders: orders.error ? [] : (orders.data ?? []),
    holdsTableMissing: !!holds.error,
    stripeReady: !!getStripe(),
  });
}

type Body = Record<string, unknown>;

function readInfo(body: Body): CustomerInfo | string {
  const info: CustomerInfo = {
    customerName: text(body.customerName),
    companyName: text(body.companyName),
    email: text(body.email, 200),
    phone: text(body.phone, 40),
    contractRef: text(body.contractRef, 60),
  };
  if (!info.customerName && !info.companyName) return "name_required";
  if (info.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) return "bad_email";
  return info;
}

function readUnits(body: Body, max: number): number | null {
  const units = num(body.units ?? 1);
  return Number.isInteger(units) && units >= 1 && units <= max ? units : null;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const stripe = getStripe();
  if (!stripe) return bad("stripe_not_configured", 503);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return bad("invalid_json");
  }
  const action = typeof body.action === "string" ? body.action : "subscribe";
  const db = createAdminClient();

  try {
    // ── Monthly card billing for a new contract ────────────────────────────
    if (action === "subscribe") {
      const plan = findRentalPlan(body.planId);
      if (!plan) return bad("unknown_plan");
      const units = readUnits(body, MAX_RENTAL_UNITS);
      if (!units) return bad("bad_units");
      const info = readInfo(body);
      if (typeof info === "string") return bad(info);
      const session = await createRentalSession(stripe, { plan, units, info });
      return NextResponse.json({
        ok: true,
        url: session.url,
        expiresAt: session.expires_at,
        quote: quoteRental(plan, units),
        summary: quoteSummary(plan, units),
      });
    }

    // ── FLEX renter keeps the machine: buy / rent-to-own with credit ─────────
    if (action === "convert") {
      const target = findConversionTarget(body.targetId);
      if (!target) return bad("unknown_target");
      const units = readUnits(body, MAX_RENTAL_UNITS);
      if (!units) return bad("bad_units");
      const info = readInfo(body);
      if (typeof info === "string") return bad(info);

      const sourceId = text(body.sourceSubscriptionId, 80);
      let maxDeposit = 0;
      if (sourceId) {
        const { data: src } = await db.from("aed_rental_billing").select("*").eq("stripe_subscription_id", sourceId).maybeSingle();
        if (!src) return bad("source_not_found");
        if (!["active", "past_due"].includes(src.status)) return bad("source_not_active");
        maxDeposit = depositOf(src);
      }
      const depositCredit = num(body.depositCredit ?? maxDeposit);
      const rentCredit = num(body.rentCredit ?? 0);
      if (!Number.isFinite(depositCredit) || depositCredit < 0 || depositCredit > maxDeposit) return bad("bad_deposit_credit");
      if (!Number.isFinite(rentCredit) || rentCredit < 0) return bad("bad_rent_credit");

      const q = conversionQuote(target, units, depositCredit + rentCredit);
      const metadata: Record<string, string> = {
        converts_from: sourceId,
        credit_thb: String(q.creditApplied),
        deposit_credit_thb: String(Math.min(depositCredit, q.creditApplied)),
      };
      const couponName = rentCredit > 0 ? "หักเงินประกัน + ค่าเช่า" : "หักเงินประกัน";

      let url: string | null;
      let expiresAt: number;
      if (target.kind === "buy") {
        // Manual VAT lines → the coupon comes off the VAT-inclusive total.
        const couponId = q.creditApplied > 0 ? await createCreditCoupon(stripe, q.creditApplied, couponName) : undefined;
        const s = await createOrderSession(stripe, {
          item: findCheckoutItem(target.productId)!,
          units,
          couponId,
          email: info.email,
          adminLink: true,
          metadata: { ...metadata, customer_name: info.customerName, company_name: info.companyName, contract_ref: info.contractRef },
        });
        url = s.url;
        expiresAt = s.expires_at;
      } else {
        // Stripe tax rate applies after the coupon → take credit / 1.07 off
        // the pre-VAT down payment so the customer pays exactly gross − credit.
        const couponId =
          q.creditApplied > 0
            ? await createCreditCoupon(stripe, Math.floor((q.creditApplied / (1 + VAT_RATE)) * 100) / 100, couponName)
            : undefined;
        const s = await createRentalSession(stripe, {
          plan: findRentalPlan(target.planId)!,
          units,
          info,
          couponId,
          metadata,
          submitMessage: conversionSummary(target, units, depositCredit + rentCredit),
        });
        url = s.url;
        expiresAt = s.expires_at;
      }
      return NextResponse.json({ ok: true, url, expiresAt, quote: q, summary: conversionSummary(target, units, depositCredit + rentCredit) });
    }

    // ── Event rental on a card hold ─────────────────────────────────────────
    if (action === "hold") {
      const pkg = findHoldPackage(body.packageId);
      if (!pkg) return bad("unknown_package");
      const days = num(body.days ?? pkg.days[0]);
      if (!pkg.days.includes(days)) return bad("bad_days");
      const units = readUnits(body, MAX_HOLD_UNITS);
      if (!units) return bad("bad_units");
      const returnDate = text(body.returnDate, 10);
      if (!holdReturnDateOk(returnDate)) return bad("return_too_late");
      const info = readInfo(body);
      if (typeof info === "string") return bad(info);
      const s = await createHoldSession(stripe, { pkg, days, units, info, eventName: text(body.eventName, 80), returnDate });
      return NextResponse.json({ ok: true, url: s.url, expiresAt: s.expires_at, quote: holdQuote(pkg, days, units), summary: holdSummary(pkg, days, units) });
    }

    if (action === "capture" || action === "release") {
      const id = num(body.holdId);
      const { data: hold } = await db.from("aed_rental_holds").select("*").eq("id", id).maybeSingle();
      if (!hold) return bad("hold_not_found", 404);
      const h = hold as HoldRow & { payment_intent_id: string };
      if (h.status !== "authorized") return bad("hold_not_open", 409);
      const now = new Date().toISOString();

      if (action === "release") {
        // Mark first, so the payment_intent.canceled webhook this triggers
        // doesn't read it as an expired hold.
        await db.from("aed_rental_holds").update({ status: "released", captured_thb: 0, updated_at: now }).eq("id", id);
        try {
          await stripe.paymentIntents.cancel(h.payment_intent_id, { cancellation_reason: "abandoned" });
        } catch (e) {
          await db.from("aed_rental_holds").update({ status: "authorized", captured_thb: null, updated_at: now }).eq("id", id);
          throw e;
        }
        return NextResponse.json({ ok: true, captured: 0 });
      }

      const damage = num(body.damage ?? 0);
      if (!Number.isFinite(damage) || damage < 0) return bad("bad_damage");
      const amount = captureAmount({ rentGross: Number(h.rent_thb), authorizeTotal: Number(h.authorized_thb) }, damage);
      await stripe.paymentIntents.capture(h.payment_intent_id, { amount_to_capture: Math.round(amount * 100) });
      await db
        .from("aed_rental_holds")
        .update({ status: "captured", captured_thb: amount, damage_thb: damage, updated_at: now })
        .eq("id", id);
      return NextResponse.json({ ok: true, captured: amount, released: Math.round((Number(h.authorized_thb) - amount) * 100) / 100 });
    }

    if (action === "refund_order") {
      const r = await refundOrder(stripe, db, num(body.orderId), num(body.amount));
      return r.ok ? NextResponse.json(r) : bad(r.error, r.status);
    }

    if (action === "refund_hold") {
      const r = await refundHold(stripe, db, num(body.holdId), num(body.keep), body.preview === true);
      return r.ok ? NextResponse.json(r) : bad(r.error, r.status);
    }

    if (action === "end_flex") {
      const r = await endFlexRental(stripe, db, text(body.subscriptionId, 80), num(body.damage ?? 0));
      return r.ok ? NextResponse.json(r) : bad(r.error, r.status);
    }

    return bad("unknown_action");
  } catch (e) {
    console.error(`[admin/rental-billing][${action}] stripe error:`, e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: "stripe_error", message }, { status: 502 });
  }
}
