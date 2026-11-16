// ─── Refunds from /admin/billing ───────────────────────────────────────────────
// 1. Online orders: refund all or part of what was paid (never more).
// 2. FLEX rental ends: stop the monthly rent and refund the deposit minus any
//    damage. The deposit carried no VAT, so the refund is plain baht.
// Stripe keeps its fee on refunded payments — say so where the team decides.
// Pure module, shared by the admin page, the API and tests.
import { thbExact } from "./checkout";
import { findRentalPlan } from "./rental-billing";

const r2 = (n: number) => Math.round(n * 100) / 100;

export type RefundableOrder = { total_thb: number; refunded_thb: number | null; status: string };

/** What is left to refund on an order (0 if unpaid or fully refunded). */
export function refundableLeft(o: RefundableOrder): number {
  if (o.status !== "paid") return 0;
  return Math.max(0, r2(Number(o.total_thb) - Number(o.refunded_thb ?? 0)));
}

/** Validated refund amount, or an error code. */
export function orderRefundAmount(o: RefundableOrder, requested: number): number | "nothing_to_refund" | "bad_amount" {
  const left = refundableLeft(o);
  if (left <= 0) return "nothing_to_refund";
  if (!Number.isFinite(requested) || requested <= 0 || r2(requested) > left) return "bad_amount";
  return r2(requested);
}

export type FlexEnd = { deposit: number; damage: number; refund: number };

/** Ending a FLEX rental: deposit back minus damage (damage capped at the deposit). */
export function flexEndQuote(row: { plan_id: string; units: number }, damage: number): FlexEnd | null {
  const plan = findRentalPlan(row.plan_id);
  if (!plan || plan.kind !== "flex") return null;
  const deposit = plan.upfront.amount * row.units;
  const d = Math.min(Math.max(0, r2(Number.isFinite(damage) ? damage : 0)), deposit);
  return { deposit, damage: d, refund: r2(deposit - d) };
}

export function orderRefundText(o: { customer_name: string | null; company_name: string | null; product_id: string }, amount: number, left: number): string {
  return [
    `↩️ คืนเงินออเดอร์ออนไลน์ ${thbExact(amount)}`,
    `${o.company_name || o.customer_name || "ลูกค้า"} — ${o.product_id}`,
    left > 0 ? `คงเหลือคืนได้อีก ${thbExact(left)}` : "คืนครบแล้ว",
    "👉 ออกใบลดหนี้ใน FlowAccount · เงินเข้าบัตรลูกค้าใน 5–10 วันทำการ",
  ].join("\n");
}

export function flexEndText(r: { company_name: string | null; customer_name: string | null; contract_ref: string | null }, q: FlexEnd, refunded: boolean): string {
  return [
    "🏁 จบเช่า FLEX — หยุดตัดค่าเช่ารายเดือนแล้ว",
    `${r.company_name || r.customer_name || "ลูกค้า"}${r.contract_ref ? ` · สัญญา ${r.contract_ref}` : ""}`,
    `เงินประกัน ${thbExact(q.deposit)}${q.damage > 0 ? ` − ค่าเสียหาย ${thbExact(q.damage)}` : ""} → คืน ${thbExact(q.refund)}`,
    refunded ? "เงินคืนเข้าบัตรลูกค้าใน 5–10 วันทำการ" : q.refund > 0 ? "⚠️ คืนเงินอัตโนมัติไม่สำเร็จ — คืนเองใน Stripe Dashboard" : null,
    q.damage > 0 ? "👉 ออกใบกำกับภาษีค่าเสียหายใน FlowAccount" : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Hold captured in full (late return), machine back: keep rent + late fee +
 * damage, refund the rest minus the share of Stripe's fee that falls on the
 * refunded part (Stripe keeps its fee on refunds; the renter bears it).
 */
export function holdRefundQuote(captured: number, keep: number, stripeFee: number) {
  const k = Math.min(Math.max(0, r2(keep)), captured);
  const excess = r2(captured - k);
  const feeOnExcess = captured > 0 ? Math.ceil((stripeFee * excess) / captured * 100) / 100 : 0;
  return { captured, keep: k, excess, feeOnExcess, refund: Math.max(0, r2(excess - feeOnExcess)) };
}
