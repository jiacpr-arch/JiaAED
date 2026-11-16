// ─── Event rentals secured by a card hold instead of a cash deposit ───────────
// The team creates a link that authorises (does not charge) rent + deposit on
// the customer's card. On return the team captures the rent (plus any damage)
// and the rest of the hold is released automatically.
//
// A card authorisation lasts 7 days for an online, customer-initiated payment
// (Stripe docs; 30-day holds need IC+ pricing). If it lapses uncaptured the
// rent is lost too, so holds are offered only when the machine comes back
// within HOLD_MAX_RETURN_DAYS of today, and a cron reminds the team before the
// hold expires. Longer rentals keep the cash deposit.
import { RENTAL_DEPOSITS, RENTAL_PRICES } from "./rental";
import { thbExact, vatOf } from "./checkout";

export type HoldPackageId = "event-day" | "event-weekend";

export type HoldPackage = {
  id: HoldPackageId;
  label: string;
  /** Allowed rental lengths in days (the first is the default). */
  days: number[];
  rentNet: (days: number) => number; // per unit, before VAT
};

export const HOLD_MAX_RETURN_DAYS = 6;
export const HOLD_PER_UNIT = RENTAL_DEPOSITS.eventCardHold;
export const MAX_HOLD_UNITS = 10;

export const holdPackages: HoldPackage[] = [
  {
    id: "event-day",
    label: "เช่าอีเวนต์รายวัน",
    // Up to 6 days (owner, 16 พ.ย. 2026). 6 days = 1,500 + 5 × 900 = 6,000,
    // the same as the 7-day WEEKLY package. The return-date check below is
    // what keeps it inside the card-hold window, whatever the length.
    days: [1, 2, 3, 4, 5, 6],
    rentNet: (d) => RENTAL_PRICES.eventFirstDay + RENTAL_PRICES.eventNextDay * (d - 1),
  },
  {
    id: "event-weekend",
    label: "เช่าสุดสัปดาห์ (ศุกร์–อาทิตย์)",
    days: [3],
    rentNet: () => RENTAL_PRICES.eventWeekend,
  },
];

export function findHoldPackage(id: unknown): HoldPackage | null {
  return holdPackages.find((p) => p.id === id) ?? null;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export type HoldQuote = {
  rentNet: number;
  rentGross: number; // captured on return (VAT incl.)
  hold: number; // deposit part of the authorisation (no VAT)
  authorizeTotal: number; // what the card is held for
};

export function holdQuote(pkg: HoldPackage, days: number, units: number): HoldQuote {
  const rentNet = pkg.rentNet(days) * units;
  const rentGross = r2(rentNet + vatOf(rentNet));
  const hold = HOLD_PER_UNIT * units;
  return { rentNet, rentGross, hold, authorizeTotal: r2(rentGross + hold) };
}

/** Return date (YYYY-MM-DD, Bangkok) must fall within the card-hold window. */
export function holdReturnDateOk(returnDate: string, now: Date = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(returnDate)) return false;
  const ret = Date.parse(`${returnDate}T23:59:59+07:00`);
  const todayBkk = Date.parse(`${new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 10)}T00:00:00+07:00`);
  return ret >= todayBkk && ret <= todayBkk + (HOLD_MAX_RETURN_DAYS + 1) * 86_400_000 - 1;
}

/** Amount to capture on return: rent + damage, never above the authorisation. */
export function captureAmount(q: { rentGross: number; authorizeTotal: number }, damage: number): number {
  return Math.min(r2(q.rentGross + Math.max(0, damage)), q.authorizeTotal);
}

export function holdSummary(pkg: HoldPackage, days: number, units: number): string {
  const q = holdQuote(pkg, days, units);
  return `กันวงเงินบัตร ${thbExact(q.authorizeTotal)} (ค่าเช่า ${thbExact(q.rentGross)} รวม VAT + มัดจำ ${thbExact(q.hold)}) — ยังไม่ตัดเงิน · คืนเครื่องแล้วตัดเฉพาะค่าเช่า ส่วนที่เหลือปล่อยคืนบัตรอัตโนมัติ`;
}

export type HoldRow = {
  id: number;
  package_id: string;
  days: number;
  units: number;
  status: "authorized" | "captured" | "released" | "expired";
  rent_thb: number;
  hold_thb: number;
  authorized_thb: number;
  captured_thb: number | null;
  damage_thb: number | null;
  capture_before: string | null;
  return_date: string | null;
  customer_name: string | null;
  company_name: string | null;
  event_name: string | null;
};

const who = (h: HoldRow) => [h.company_name || h.customer_name, h.event_name].filter(Boolean).join(" · ") || "ลูกค้า";
const bkkTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export function holdAuthorizedText(h: HoldRow): string {
  return [
    "🔒 ลูกค้ากันวงเงินบัตรแล้ว (เช่าอีเวนต์)",
    `${who(h)} — ${findHoldPackage(h.package_id)?.label ?? h.package_id} ${h.days} วัน${h.units > 1 ? ` × ${h.units} เครื่อง` : ""}`,
    `กันไว้ ${thbExact(Number(h.authorized_thb))} (ค่าเช่า ${thbExact(Number(h.rent_thb))} + มัดจำ ${thbExact(Number(h.hold_thb))})`,
    h.return_date ? `คืนเครื่อง ${h.return_date}` : null,
    `⏰ ต้องกด "เก็บค่าเช่า" ใน /admin/billing ก่อน ${bkkTime(h.capture_before)} ไม่อย่างนั้นวงเงินหมดอายุและเก็บค่าเช่าไม่ได้`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function holdExpiringText(holds: HoldRow[]): string {
  return [
    `⏰ วงเงินบัตรเช่าอีเวนต์ใกล้หมดอายุ ${holds.length} รายการ — กด "เก็บค่าเช่า" ใน /admin/billing`,
    ...holds.map((h) => `• ${who(h)} — ค่าเช่า ${thbExact(Number(h.rent_thb))} · หมดอายุ ${bkkTime(h.capture_before)}`),
  ].join("\n");
}

export function holdExpiredText(h: HoldRow): string {
  return [
    "❌ วงเงินบัตรหมดอายุก่อนเก็บค่าเช่า",
    `${who(h)} — ค่าเช่า ${thbExact(Number(h.rent_thb))} ยังไม่ได้เก็บ`,
    "👉 ส่งลิงก์ชำระค่าเช่าให้ลูกค้าใหม่ หรือออกใบแจ้งหนี้",
  ].join("\n");
}
