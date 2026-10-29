// Rental prices — the single source for every rental number. Kept in its own
// module (no imports) so ./subscription.ts and ./packages.ts can read it without
// an import cycle through ./faqs.ts. Re-exported from ./rental.ts.
//
// Owner, 25 ต.ค. 2026: one price ladder where a longer rental always costs less
// per day but never less in total than a shorter one (the old ฿10,000 for 14
// days vs ฿1,990 × 3 = ฿5,970 for three months broke that).
export const RENTAL_PRICES = {
  // ── ใช้ชั่วคราว ──
  eventFirstDay: 1_500,
  eventNextDay: 900,
  eventWeekend: 3_500, // ศุกร์–อาทิตย์ 3 วัน
  eventWeekly: 6_000, // 7 วัน
  eventFortnight: 7_000, // 14 วัน
  oneMonth: 7_900, // 1 เดือน ไม่มีขั้นต่ำ
  flexMonthly: 2_990, // ต่อเนื่อง 3–11 เดือน
  flexMinMonths: 3,
  // ── ติดตั้งประจำ (STANDARD tier, billed yearly) ──
  annual: 22_000,
  annual2to4Units: 20_000, // ต่อเครื่อง/ปี
  annual5PlusUnits: 18_000, // ต่อเครื่อง/ปี
} as const;

// Three-year contracts on the yearly tiers (STANDARD / PRO / ELITE).
export const THREE_YEAR_DISCOUNT = 0.1;

// Rounded to ฿10, the way every monthly-equivalent price on the site is shown.
export const round10 = (n: number) => Math.round(n / 10) * 10;

/** STANDARD's monthly equivalent — ฿22,000 / 12 ≈ ฿1,830. */
export const STANDARD_MONTHLY = round10(RENTAL_PRICES.annual / 12);

// Short rentals credited toward a yearly contract signed soon after.
export const RENTAL_CREDIT_DAYS = 30;
export const RENTAL_CREDIT_NOTE = `ค่าเช่าที่จ่ายแล้วหักเป็นส่วนลดได้ เมื่อทำสัญญารายปีภายใน ${RENTAL_CREDIT_DAYS} วัน`;

// The CFO's reason to rent rather than buy. Worded so it holds for any company
// that rents for its business; the buyer's accountant confirms their own case.
export const RENTAL_EXPENSE_NOTE =
  "ค่าเช่าบันทึกเป็นค่าใช้จ่ายของกิจการได้ ไม่ต้องตั้งเป็นสินทรัพย์ (ยืนยันกับฝ่ายบัญชีของท่าน)";

// ─── Rental terms the owner set on 29 ต.ค. 2026 (หน้า /aed/rental/terms) ────────
// Loss/damage replacement values: the unit value replaces the old FAQ's "~30,000"
// (owner chose the Y8 cash price); pads/battery follow the retail prices in
// ./pricing.ts (were ~2,000 / ~5,000 in the old FAQ).
export const RENTAL_REPLACEMENT_VALUE = {
  unit: 44_900,
  pads: 5_000,
  battery: 7_500,
} as const;

/** Late return on short rentals is charged at the next-day event rate. */
export const RENTAL_LATE_RETURN_PER_DAY = RENTAL_PRICES.eventNextDay;
/** Ending an annual contract early: this share of the rent for the months left. */
export const ANNUAL_EARLY_TERMINATION_SHARE = 0.5;
/** No auto-renewal; the customer is reminded this many days before the end. */
export const RENEWAL_REMINDER_DAYS = 30;
