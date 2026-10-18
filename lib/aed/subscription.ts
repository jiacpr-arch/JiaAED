// ─── ดูแลครบ managed-rental subscription tiers ─────────────────────────────
// BASIC / PRO / ELITE are the monthly service levels of the ดูแลครบ
// managed-rental package (see ./packages.ts). Prices are PROVISIONAL.

import { SAFETY_PREMIUM_PRICING } from "./packages";

export type SubscriptionTierId = "managed-basic" | "managed-pro" | "managed-elite";

export type SubscriptionTier = {
  id: SubscriptionTierId;
  name: string; // "BASIC"
  pricePerMonth: number; // 2990
  specialNote: string | null;
  bestFor: string;
  badge: string | null;
};

export const subscriptionTiers: SubscriptionTier[] = [
  {
    id: "managed-basic",
    name: "BASIC",
    pricePerMonth: 2990,
    specialNote: null,
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
    values: { "managed-basic": true, "managed-pro": true, "managed-elite": true },
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
    values: { "managed-basic": false, "managed-pro": "1 ครั้ง/ปี", "managed-elite": "2 ครั้ง/ปี" },
  },
  {
    feature: "อบรมพนักงาน (ครั้ง/ปี)",
    values: { "managed-basic": false, "managed-pro": "1 ครั้ง/ปี", "managed-elite": "2 ครั้ง/ปี" },
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
    // recurring training is a PRO/ELITE subscription feature, BASIC has none.
    dimension: "การอบรมพนักงาน",
    buy: "อบรมครั้งแรกรวมในแพ็กซื้อขาด (Safety Premium) — ครั้งต่อไปจัดเอง/ซื้อคอร์สเพิ่ม",
    subscribe: `อบรมประจำปีในระดับ ${tiersWith("อบรมพนักงาน (ครั้ง/ปี)")} (BASIC ซื้อคอร์สเพิ่มได้)`,
  },
  {
    dimension: "เหมาะกับองค์กรแบบใด",
    buy: "องค์กรที่มีทีมดูแลอุปกรณ์เองได้",
    subscribe: "องค์กรที่ต้องการความต่อเนื่องและมืออาชีพดูแล",
  },
];
