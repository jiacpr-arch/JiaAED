// ─── Monthly card billing for rental customers (Stripe subscriptions) ──────────
// After a contract is signed, the team creates a card-payment link from
// /admin/billing. The customer pays the upfront part once (rent-to-own down
// payment, or FLEX refundable deposit + first month) and Stripe charges the card
// every month after that. Rent-to-own stops by itself after the last instalment.
//
// Amounts come from the catalog (packages.ts / rental-prices.ts) — never typed
// here. Pure module (no Stripe import) so pages, routes and tests share it.
import { RENT_TO_OWN_TERMS } from "./packages";
import { RENTAL_DEPOSITS, RENTAL_PRICES } from "./rental";
import { VAT_RATE, thbExact } from "./checkout";

export type RentalBillingPlanId = "rto-y2" | "rto-gps" | "flex" | "flex-corp";

export type RentalBillingPlan = {
  id: RentalBillingPlanId;
  label: string; // shown to the team and on the Stripe page
  kind: "rent-to-own" | "flex";
  /** Charged once on the payment page, per unit. */
  upfront: { label: string; amount: number; vat: boolean };
  /** Charged every month, per unit, before VAT. */
  monthly: number;
  /** Number of monthly charges, or null = until the team cancels. */
  months: number | null;
  /**
   * true  → the first monthly charge is taken on the payment page (FLEX pays
   *         rent in advance: "ชำระล่วงหน้าก่อนเริ่มรอบ").
   * false → the payment page takes only the down payment; monthly instalments
   *         start one month later (rent-to-own: ดาวน์ = งวดแรก in the contract).
   */
  firstMonthUpfront: boolean;
};

const y2 = RENT_TO_OWN_TERMS["pkg-start-y2"];
const gps = RENT_TO_OWN_TERMS["pkg-start-y8"];

export const rentalBillingPlans: RentalBillingPlan[] = [
  {
    id: "rto-y2",
    label: "เช่าแล้วได้ซื้อ — Yuwell Y2",
    kind: "rent-to-own",
    upfront: { label: "เงินดาวน์ (ค่าเช่าซื้องวดแรก)", amount: y2.deposit, vat: true },
    monthly: y2.monthly,
    months: y2.months,
    firstMonthUpfront: false,
  },
  {
    id: "rto-gps",
    label: "เช่าแล้วได้ซื้อ — Yuwell GPS",
    kind: "rent-to-own",
    upfront: { label: "เงินดาวน์ (ค่าเช่าซื้องวดแรก)", amount: gps.deposit, vat: true },
    monthly: gps.monthly,
    months: gps.months,
    firstMonthUpfront: false,
  },
  {
    id: "flex",
    label: "เช่ารายเดือน FLEX (บุคคล)",
    kind: "flex",
    upfront: { label: "เงินประกัน (คืนเมื่อคืนเครื่อง)", amount: RENTAL_DEPOSITS.flex, vat: false },
    monthly: RENTAL_PRICES.flexMonthly,
    months: null,
    firstMonthUpfront: true,
  },
  {
    id: "flex-corp",
    label: "เช่ารายเดือน FLEX (นิติบุคคล)",
    kind: "flex",
    upfront: { label: "เงินประกัน (คืนเมื่อคืนเครื่อง)", amount: RENTAL_DEPOSITS.flexCorporate, vat: false },
    monthly: RENTAL_PRICES.flexMonthly,
    months: null,
    firstMonthUpfront: true,
  },
];

export const MAX_RENTAL_UNITS = 20;

export function findRentalPlan(id: unknown): RentalBillingPlan | null {
  return rentalBillingPlans.find((p) => p.id === id) ?? null;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const withVat = (n: number) => r2(n * (1 + VAT_RATE));

export type RentalQuote = {
  todayTotal: number; // charged on the payment page, VAT included
  monthlyTotal: number; // each monthly charge, VAT included
  monthlyCharges: number | null; // how many monthly charges follow (null = open-ended)
  contractTotal: number | null; // everything incl. VAT (rent-to-own only)
};

/** What the customer pays, VAT included, for `units` machines. */
export function quoteRental(plan: RentalBillingPlan, units: number): RentalQuote {
  const upfront = plan.upfront.vat ? withVat(plan.upfront.amount) : plan.upfront.amount;
  const monthly = withVat(plan.monthly);
  const todayTotal = r2(units * (upfront + (plan.firstMonthUpfront ? monthly : 0)));
  const monthlyTotal = r2(units * monthly);
  const monthlyCharges = plan.months == null ? null : plan.months - (plan.firstMonthUpfront ? 1 : 0);
  return {
    todayTotal,
    monthlyTotal,
    monthlyCharges,
    contractTotal: plan.months == null ? null : r2(todayTotal + monthlyTotal * (monthlyCharges ?? 0)),
  };
}

export function quoteSummary(plan: RentalBillingPlan, units: number): string {
  const q = quoteRental(plan, units);
  const after =
    q.monthlyCharges == null
      ? `แล้วตัดบัตรเดือนละ ${thbExact(q.monthlyTotal)} จนกว่าจะแจ้งเลิกเช่า`
      : `แล้วตัดบัตรเดือนละ ${thbExact(q.monthlyTotal)} อีก ${q.monthlyCharges} งวด (รวม ${thbExact(q.contractTotal!)})`;
  return `วันนี้ ${thbExact(q.todayTotal)} ${after} · รวม VAT แล้ว`;
}

// ─── Dates ──────────────────────────────────────────────────────────────────
// Rent-to-own instalments start a month after signing. The anchor day is
// clamped to 1–28 so every month has it and "N months later" is exact — the
// subscription is then set to end right after the last instalment.

const BKK_OFFSET_MS = 7 * 3_600_000;

/** First monthly charge for a rent-to-own: same day next month (≤ 28th), 10:00 Bangkok. */
export function firstInstalmentAnchor(now: Date = new Date()): number {
  const bkk = new Date(now.getTime() + BKK_OFFSET_MS);
  const day = Math.min(bkk.getUTCDate(), 28);
  const utc = Date.UTC(bkk.getUTCFullYear(), bkk.getUTCMonth() + 1, day, 10) - BKK_OFFSET_MS;
  return Math.floor(utc / 1000);
}

/** Unix time `months` calendar months after `anchor` (anchor day must be ≤ 28). */
export function addMonthsUnix(anchor: number, months: number): number {
  const bkk = new Date(anchor * 1000 + BKK_OFFSET_MS);
  const utc =
    Date.UTC(bkk.getUTCFullYear(), bkk.getUTCMonth() + months, bkk.getUTCDate(), bkk.getUTCHours(), bkk.getUTCMinutes()) -
    BKK_OFFSET_MS;
  return Math.floor(utc / 1000);
}

export function thaiDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "numeric" });
}

// ─── LINE alerts for the team ─────────────────────────────────────────────────

export type RentalBillingRow = {
  plan_id: string;
  units: number;
  customer_name: string | null;
  company_name: string | null;
  contract_ref: string | null;
  months_total: number | null;
  installments_paid: number;
};

const who = (r: RentalBillingRow) =>
  [r.company_name || r.customer_name, r.contract_ref && `สัญญา ${r.contract_ref}`].filter(Boolean).join(" · ") || "ลูกค้า";
const planName = (r: RentalBillingRow) => `${findRentalPlan(r.plan_id)?.label ?? r.plan_id}${r.units > 1 ? ` × ${r.units} เครื่อง` : ""}`;

export function rentalStartedText(r: RentalBillingRow, paidToday: number, firstInstalment: number | null): string {
  return [
    "💳 ลูกค้าผูกบัตรตัดรายเดือนแล้ว",
    `${who(r)} — ${planName(r)}`,
    `ชำระวันนี้ ${thbExact(paidToday)}`,
    firstInstalment ? `ตัดงวดแรก ${thaiDate(firstInstalment)}` : null,
    r.months_total ? `ทั้งหมด ${r.months_total} งวด แล้วระบบหยุดตัดเอง` : "ตัดทุกเดือนจนกว่าจะยกเลิกใน Stripe",
  ]
    .filter(Boolean)
    .join("\n");
}

export function rentalPaidText(r: RentalBillingRow, amount: number): string {
  const n = r.months_total ? `งวดที่ ${r.installments_paid}/${r.months_total}` : `เดือนที่ ${r.installments_paid}`;
  const done = r.months_total != null && r.installments_paid >= r.months_total;
  return [
    `✅ ตัดบัตรสำเร็จ ${n} — ${thbExact(amount)}`,
    `${who(r)} — ${planName(r)}`,
    "👉 ออกใบกำกับภาษี/ใบเสร็จงวดนี้",
    done ? "🎉 ผ่อนครบแล้ว — โอนกรรมสิทธิ์เครื่องให้ลูกค้า" : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function rentalFailedText(r: RentalBillingRow, amount: number, payUrl: string | null, nextRetry: number | null): string {
  return [
    `⚠️ ตัดบัตรไม่ผ่าน — ${thbExact(amount)}`,
    `${who(r)} — ${planName(r)}`,
    nextRetry ? `Stripe จะลองตัดใหม่ ${thaiDate(nextRetry)}` : "Stripe จะไม่ลองตัดใหม่แล้ว",
    payUrl ? `ส่งลิงก์ให้ลูกค้าจ่าย/เปลี่ยนบัตร: ${payUrl}` : null,
    findRentalPlan(r.plan_id)?.kind === "rent-to-own" ? "สัญญา: ผิดนัด 2 งวดติดกันบอกเลิกสัญญาได้" : null,
  ]
    .filter(Boolean)
    .join("\n");
}
