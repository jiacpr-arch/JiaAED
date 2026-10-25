// ─── ดูแลครบ managed-rental subscription tiers ─────────────────────────────
// STANDARD / PRO / ELITE are the service levels of the ดูแลครบ managed-rental
// package (see ./packages.ts). Prices are PROVISIONAL.
//
// Owner, 25 ต.ค. 2026: one price ladder instead of a separate ANNUAL plan and a
// BASIC tier that cost more but included less. STANDARD *is* the annual rental
// plan (./rental.ts RENTAL_PRICES.annual, billed yearly, no GPS); PRO adds GPS,
// alerts and on-site training. The id stays "managed-basic" because it is a
// stored lead/product id (lead-validation allowlist, existing lead rows).

import { SAFETY_PREMIUM_PRICING } from "./packages";
import { RENTAL_PRICES } from "./rental-prices";

export type SubscriptionTierId = "managed-basic" | "managed-pro" | "managed-elite";

export type SubscriptionTier = {
  id: SubscriptionTierId;
  name: string; // "STANDARD"
  pricePerMonth: number; // monthly equivalent, e.g. 1830
  specialNote: string | null;
  bestFor: string;
  badge: string | null;
};

export const subscriptionTiers: SubscriptionTier[] = [
  {
    id: "managed-basic",
    name: "STANDARD",
    // Monthly equivalent of the annual plan, rounded to ฿10 like the rental card.
    pricePerMonth: Math.round(RENTAL_PRICES.annual / 12 / 10) * 10,
    specialNote: `ชำระรายปี ฿${RENTAL_PRICES.annual.toLocaleString("en-US")} · เครื่องรุ่นไม่มี GPS`,
    bestFor: "SME · ร้านค้า · ฟิตเนส · คอนโด",
    badge: null,
  },
  {
    id: "managed-pro",
    name: "PRO",
    pricePerMonth: 3990,
    specialNote: null,
    bestFor: "โรงเรียน · โรงงาน · สำนักงาน",
    badge: "คุ้มค่าที่สุด",
  },
  {
    id: "managed-elite",
    name: "ELITE",
    pricePerMonth: 4990,
    specialNote: null,
    bestFor: "องค์กรขนาดใหญ่ / หลายสาขา",
    badge: null,
  },
];

// Feature matrix: one row per capability, value per tier.
//   true   → ✓
//   false  → –
//   string → rendered literally
export type FeatureMatrixRow = {
  feature: string;
  values: Record<SubscriptionTierId, string | boolean>;
};

export const subscriptionMatrix: FeatureMatrixRow[] = [
  {
    feature: "Yuwell GPS ติดตามตำแหน่ง",
    values: { "managed-basic": false, "managed-pro": true, "managed-elite": true },
  },
  {
    feature: "เปลี่ยนเครื่องเมื่อเสีย (SLA)",
    values: { "managed-basic": "48 ชม.", "managed-pro": "48 ชม.", "managed-elite": "24 ชม." },
  },
  {
    feature: "รายงานประจำปี + Hotline",
    values: { "managed-basic": true, "managed-pro": true, "managed-elite": true },
  },
  {
    feature: "ตรวจเช็กหน้างาน (ครั้ง/ปี)",
    values: { "managed-basic": "1 ครั้ง/ปี", "managed-pro": "1 ครั้ง/ปี", "managed-elite": "2 ครั้ง/ปี" },
  },
  {
    feature: "อบรมพนักงาน (ครั้ง/ปี)",
    values: { "managed-basic": "Mini Course ที่ The Street", "managed-pro": "1 ครั้ง/ปี ถึงที่", "managed-elite": "2 ครั้ง/ปี ถึงที่" },
  },
  {
    feature: "สร้างผู้สอน (Instructor) ในองค์กร",
    values: { "managed-basic": false, "managed-pro": false, "managed-elite": true },
  },
  {
    feature: "แจ้งเตือนทางอีเมล (Email Alert)",
    values: { "managed-basic": false, "managed-pro": true, "managed-elite": true },
  },
  {
    feature: "ระบบควบคุม Cloud Dashboard",
    values: { "managed-basic": false, "managed-pro": false, "managed-elite": true },
  },
  {
    feature: "ป้ายจุดติดตั้ง",
    values: { "managed-basic": false, "managed-pro": false, "managed-elite": "2 ป้าย พร้อมตู้" },
  },
];

// Tier names that include a matrix feature, e.g. "PRO/ELITE" — so the
// comparison below can't claim more than the matrix promises.
export function tiersWith(feature: string): string {
  const row = subscriptionMatrix.find((r) => r.feature === feature);
  return subscriptionTiers
    .filter((t) => row && row.values[t.id] !== false)
    .map((t) => t.name)
    .join("/");
}

const thb = (n: number) => `฿${n.toLocaleString("en-US")}`;

// Rent (managed subscription) vs buy (outright) comparison.
export const rentVsBuy: { dimension: string; buy: string; subscribe: string }[] = [
  {
    dimension: "เงินลงทุนเริ่มต้น",
    buy: `จ่ายเต็มจำนวนทันที (เงินสด ${thb(SAFETY_PREMIUM_PRICING.cash)} / เครดิต-ราชการ ${thb(SAFETY_PREMIUM_PRICING.credit)})`,
    subscribe: "ไม่ต้องจ่ายเงินก้อนใหญ่",
  },
  {
    dimension: "การดูแลและบำรุงรักษา",
    buy: "องค์กรต้องจัดการเอง",
    subscribe: "มีทีมดูแลตามรอบ",
  },
  {
    dimension: "แจ้งเตือนแบต / แผ่นแปะหมดอายุ",
    buy: "ต้องติดตามเอง",
    subscribe: `ทีมงานติดตามและเปลี่ยนให้ · แจ้งเตือนทางอีเมลในระดับ ${tiersWith("แจ้งเตือนทางอีเมล (Email Alert)")}`,
  },
  {
    // Safety Premium includes the first on-site course (see ./packages.ts);
    // on-site training is PRO/ELITE; STANDARD gets the Mini Course at The Street.
    dimension: "การอบรมพนักงาน",
    buy: "อบรมครั้งแรกรวมในแพ็กซื้อขาด (Safety Premium) — ครั้งต่อไปจัดเอง/ซื้อคอร์สเพิ่ม",
    subscribe: "ทุกระดับมีอบรม — STANDARD เรียน Mini Course ที่ The Street · PRO/ELITE สอนถึงที่ทุกปี",
  },
  {
    dimension: "เหมาะกับองค์กรแบบใด",
    buy: "องค์กรที่มีทีมดูแลอุปกรณ์เองได้",
    subscribe: "องค์กรที่ต้องการความต่อเนื่องและมืออาชีพดูแล",
  },
];
