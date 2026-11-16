// Stripe webhook side of rental card billing (see ./rental-billing.ts).
// Called from app/api/stripe/webhook/route.ts after the signature check.
import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { pushToOwner } from "./notify-owner";
import {
  addMonthsUnix,
  findRentalPlan,
  quoteRental,
  rentalFailedText,
  rentalPaidText,
  rentalStartedText,
  type RentalBillingRow,
} from "./rental-billing";

export const RENTAL_EVENTS = new Set([
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.deleted",
]);

type Result = { handled: boolean; note?: string };

const isRental = (md: Stripe.Metadata | null | undefined) => md?.kind === "rental_billing";
const idOf = (v: string | { id: string } | null | undefined) => (v == null ? null : typeof v === "string" ? v : v.id);

async function loadRow(db: SupabaseClient, subId: string): Promise<(RentalBillingRow & { status: string }) | null> {
  const { data } = await db.from("aed_rental_billing").select("*").eq("stripe_subscription_id", subId).maybeSingle();
  return (data as (RentalBillingRow & { status: string }) | null) ?? null;
}

/**
 * A FLEX renter paid for the machine they keep (buy or rent-to-own link made
 * with action "convert"): stop the old monthly rent. The deposit was credited
 * on the new payment, so nothing is refunded. Marked first so the
 * customer.subscription.deleted that follows doesn't alert as a cancellation.
 * Idempotent.
 */
export async function finalizeConversion(stripe: Stripe, db: SupabaseClient, sourceSubId: string, creditThb: number): Promise<void> {
  const row = await loadRow(db, sourceSubId);
  if (!row || row.status === "converted") return;
  await db
    .from("aed_rental_billing")
    .update({ status: "converted", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", sourceSubId);
  try {
    await stripe.subscriptions.cancel(sourceSubId, { prorate: false, invoice_now: false });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code !== "resource_missing") {
      await pushToOwner(`⚠️ ยกเลิกการตัดค่าเช่าเดิมไม่สำเร็จ (${sourceSubId}) — ยกเลิกเองใน Stripe Dashboard`);
      throw e;
    }
  }
  await pushToOwner(
    `🔁 ลูกค้าเปลี่ยนจากเช่าเป็นซื้อ/เช่าซื้อแล้ว — หยุดตัดค่าเช่าเดิม\n` +
      `${row.company_name || row.customer_name || "ลูกค้า"}${row.contract_ref ? ` · สัญญา ${row.contract_ref}` : ""}\n` +
      `หักเงินประกัน/ค่าเช่าไป ${creditThb.toLocaleString("en-US")} บาท (ไม่ต้องคืนเงินประกัน) · รับเครื่องเช่าเดิมเป็นของลูกค้า/ออกเอกสารโอน`,
  );
}

/** checkout.session.completed for a rental link: set the end date, record, alert. */
export async function handleRentalCheckout(stripe: Stripe, db: SupabaseClient, session: Stripe.Checkout.Session): Promise<Result> {
  if (session.mode !== "subscription" || !isRental(session.metadata)) return { handled: false };
  const subId = idOf(session.subscription);
  const md = session.metadata!;
  const plan = findRentalPlan(md.plan_id);
  if (!subId || !plan) return { handled: true, note: "missing subscription or plan" };
  const units = Number(md.units) || 1;

  let sub = await stripe.subscriptions.retrieve(subId);
  // Rent-to-own: stop right after the last instalment. Charges fall on the
  // anchor + 0..months-1 months, so ending at anchor + months takes exactly
  // `months` charges with no proration.
  let endsAt: number | null = null;
  if (plan.months != null) {
    endsAt = addMonthsUnix(plan.firstMonthUpfront ? sub.start_date : sub.billing_cycle_anchor, plan.months);
    if (sub.cancel_at !== endsAt) {
      sub = await stripe.subscriptions.update(subId, { cancel_at: endsAt, proration_behavior: "none" });
    }
  }

  const row = {
    stripe_subscription_id: subId,
    stripe_customer_id: idOf(session.customer),
    checkout_session_id: session.id,
    plan_id: plan.id,
    units,
    status: "active",
    months_total: plan.months,
    installments_paid: plan.firstMonthUpfront ? 1 : 0,
    monthly_total_thb: quoteRental(plan, units).monthlyTotal,
    customer_name: md.customer_name || session.customer_details?.name || null,
    company_name: md.company_name || null,
    customer_email: session.customer_details?.email ?? null,
    customer_phone: md.phone || session.customer_details?.phone || null,
    contract_ref: md.contract_ref || null,
    ends_at: endsAt ? new Date(endsAt * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const { data: inserted, error } = await db
    .from("aed_rental_billing")
    .upsert(row, { onConflict: "stripe_subscription_id", ignoreDuplicates: true })
    .select("id");
  if (error) throw new Error(`aed_rental_billing upsert: ${error.message}`);
  if (inserted && inserted.length > 0) {
    const firstInstalment = plan.firstMonthUpfront ? null : sub.billing_cycle_anchor;
    await pushToOwner(rentalStartedText(row, (session.amount_total ?? 0) / 100, firstInstalment));
  }
  if (md.converts_from) await finalizeConversion(stripe, db, md.converts_from, Number(md.credit_thb) || 0);
  return { handled: true };
}

/**
 * The subscription an invoice belongs to. Webhook payloads use the endpoint's
 * API version, which can be older than the SDK's: 2025 "basil" nests it under
 * parent.subscription_details, older versions (e.g. 2022-11-15) put
 * `subscription` and `subscription_details.metadata` on the invoice itself.
 */
export function subscriptionOfInvoice(inv: Stripe.Invoice): { id: string | null; metadata: Stripe.Metadata | null } {
  const d = inv.parent?.subscription_details;
  if (d) return { id: idOf(d.subscription ?? null), metadata: d.metadata ?? null };
  const legacy = inv as unknown as {
    subscription?: string | { id: string; metadata?: Stripe.Metadata } | null;
    subscription_details?: { metadata?: Stripe.Metadata | null } | null;
  };
  const sub = legacy.subscription ?? null;
  return {
    id: idOf(sub),
    metadata: legacy.subscription_details?.metadata ?? (typeof sub === "object" && sub ? (sub.metadata ?? null) : null),
  };
}

/** invoice.paid / invoice.payment_failed / customer.subscription.deleted */
export async function handleRentalEvent(db: SupabaseClient, event: Stripe.Event): Promise<Result> {
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    if (!isRental(sub.metadata)) return { handled: false };
    const row = await loadRow(db, sub.id);
    if (!row || ["completed", "canceled", "converted"].includes(row.status)) return { handled: true };
    const done = row.months_total != null && row.installments_paid >= row.months_total;
    await db
      .from("aed_rental_billing")
      .update({ status: done ? "completed" : "canceled", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", sub.id);
    if (!done) {
      await pushToOwner(
        `⛔ หยุดตัดบัตรรายเดือนแล้ว (ยกเลิก${sub.cancellation_details?.reason === "payment_failed" ? "เพราะตัดบัตรไม่ผ่านหลายครั้ง" : ""})\n` +
          `${row.company_name || row.customer_name || "ลูกค้า"}${row.contract_ref ? ` · สัญญา ${row.contract_ref}` : ""}\n` +
          `ชำระแล้ว ${row.installments_paid}${row.months_total ? `/${row.months_total}` : ""} งวด`,
      );
    }
    return { handled: true };
  }

  const inv = event.data.object as Stripe.Invoice;
  const { id: subId, metadata } = subscriptionOfInvoice(inv);
  if (!subId || !isRental(metadata)) return { handled: false };
  // The first invoice (down payment / deposit) is announced by handleRentalCheckout.
  if (inv.billing_reason === "subscription_create") return { handled: true };

  const status = event.type === "invoice.paid" ? "paid" : "failed";
  const amount = (status === "paid" ? inv.amount_paid : inv.amount_due) / 100;
  const countsAsInstallment = status === "paid" && inv.billing_reason === "subscription_cycle";

  const { error: dupError } = await db.from("aed_rental_billing_invoices").insert({
    stripe_invoice_id: inv.id,
    stripe_subscription_id: subId,
    status,
    amount_thb: amount,
    counts_as_installment: countsAsInstallment,
    attempt: status === "failed" ? inv.attempt_count : 1,
  });
  if (dupError) {
    if (dupError.code === "23505") return { handled: true, note: "duplicate" }; // Stripe retry
    throw new Error(`aed_rental_billing_invoices insert: ${dupError.message}`);
  }

  const row = await loadRow(db, subId);
  if (!row) {
    // Checkout completion not processed yet (out-of-order delivery) — the
    // invoice row is stored, so the count catches up; just tell the team.
    await pushToOwner(`${status === "paid" ? "✅ ตัดบัตรสำเร็จ" : "⚠️ ตัดบัตรไม่ผ่าน"} ${amount.toLocaleString("en-US")} บาท (subscription ${subId})`);
    return { handled: true };
  }

  if (status === "paid") {
    const plan = findRentalPlan(row.plan_id);
    const { count } = await db
      .from("aed_rental_billing_invoices")
      .select("id", { count: "exact", head: true })
      .eq("stripe_subscription_id", subId)
      .eq("counts_as_installment", true);
    const paid = (plan?.firstMonthUpfront ? 1 : 0) + (count ?? 0);
    const done = row.months_total != null && paid >= row.months_total;
    await db
      .from("aed_rental_billing")
      .update({ installments_paid: paid, status: done ? "completed" : "active", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subId);
    await pushToOwner(rentalPaidText({ ...row, installments_paid: paid }, amount));
  } else {
    await db
      .from("aed_rental_billing")
      .update({ status: "past_due", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subId);
    await pushToOwner(rentalFailedText(row, amount, inv.hosted_invoice_url ?? null, inv.next_payment_attempt ?? null));
  }
  return { handled: true };
}
