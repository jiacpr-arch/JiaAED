// ─── Rental → buy / rent-to-own, with the deposit (and optionally rent) credited ─
// A FLEX customer who decides to keep a machine: the refundable deposit they
// already paid is applied to the purchase instead of being refunded, and the
// team may also credit rent already paid (promo "ค่าเช่าหักเป็นส่วนลด").
//
// VAT: the deposit carried no VAT. The credit is treated as money already
// received toward the VAT-inclusive total, so VAT stays on the full price and
// the customer pays (price + VAT) − credit. Pure module, shared by the admin
// page, the admin API and tests.
import { findCheckoutItem, thbExact, vatOf } from "./checkout";
import { findRentalPlan, quoteRental, type RentalBillingPlanId } from "./rental-billing";

export type ConversionTargetId = "buy-y2" | "buy-y0" | "rto-y2" | "rto-gps";

export type ConversionTarget =
  | { id: ConversionTargetId; label: string; kind: "buy"; productId: "primedic-y2" | "primedic-y0" }
  | { id: ConversionTargetId; label: string; kind: "rto"; planId: RentalBillingPlanId };

export const conversionTargets: ConversionTarget[] = [
  { id: "buy-y2", label: "ซื้อขาด Yuwell Y2", kind: "buy", productId: "primedic-y2" },
  { id: "buy-y0", label: "ซื้อขาด HeartSave Y0", kind: "buy", productId: "primedic-y0" },
  { id: "rto-y2", label: "เช่าแล้วได้ซื้อ — Yuwell Y2", kind: "rto", planId: "rto-y2" },
  { id: "rto-gps", label: "เช่าแล้วได้ซื้อ — Yuwell GPS", kind: "rto", planId: "rto-gps" },
];

export function findConversionTarget(id: unknown): ConversionTarget | null {
  return conversionTargets.find((t) => t.id === id) ?? null;
}

/** Stripe won't take a charge below ~฿10; always leave something to pay. */
export const MIN_PAYABLE_THB = 20;

const r2 = (n: number) => Math.round(n * 100) / 100;

export type ConversionQuote = {
  grossToday: number; // what today's payment would be without credit (VAT incl.)
  creditApplied: number; // credit used today (capped to keep MIN_PAYABLE_THB)
  creditUnused: number; // credit that didn't fit (team handles it separately)
  payableToday: number;
  monthlyTotal: number | null; // rent-to-own instalment, unchanged by the credit
  monthlyCharges: number | null;
};

export function conversionQuote(target: ConversionTarget, units: number, credit: number): ConversionQuote {
  let grossToday: number;
  let monthlyTotal: number | null = null;
  let monthlyCharges: number | null = null;
  if (target.kind === "buy") {
    const item = findCheckoutItem(target.productId)!;
    grossToday = r2(units * (item.net + vatOf(item.net)));
  } else {
    const q = quoteRental(findRentalPlan(target.planId)!, units);
    grossToday = q.todayTotal;
    monthlyTotal = q.monthlyTotal;
    monthlyCharges = q.monthlyCharges;
  }
  const wanted = Math.max(0, r2(credit));
  const creditApplied = Math.min(wanted, Math.max(0, r2(grossToday - MIN_PAYABLE_THB)));
  return {
    grossToday,
    creditApplied,
    creditUnused: r2(wanted - creditApplied),
    payableToday: r2(grossToday - creditApplied),
    monthlyTotal,
    monthlyCharges,
  };
}

/** Deposit a FLEX subscription paid (the most that can be credited from it). */
export function depositOf(row: { plan_id: string; units: number }): number {
  const plan = findRentalPlan(row.plan_id);
  return plan && plan.kind === "flex" ? plan.upfront.amount * row.units : 0;
}

export function conversionSummary(target: ConversionTarget, units: number, credit: number): string {
  const q = conversionQuote(target, units, credit);
  const parts = [
    `${target.label}${units > 1 ? ` × ${units}` : ""}: ${thbExact(q.grossToday)}`,
    q.creditApplied > 0 ? `หักเงินประกัน/ค่าเช่า ${thbExact(q.creditApplied)}` : null,
    `จ่ายวันนี้ ${thbExact(q.payableToday)}`,
    q.monthlyTotal != null ? `แล้วตัดบัตรเดือนละ ${thbExact(q.monthlyTotal)} × ${q.monthlyCharges} งวด` : null,
  ];
  return `${parts.filter(Boolean).join(" · ")} (รวม VAT)`;
}
