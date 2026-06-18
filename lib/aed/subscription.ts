// ─── Safety Care managed-rental subscription tiers ────────────────────────────
// BASIC / PREMIUM / ULTIMATE are the monthly service levels OF the Safety Care
// managed-rental package (see ./packages.ts). Prices are PROVISIONAL.

export type SubscriptionTierId = "care-basic" | "care-premium" | "care-ultimate";

export type SubscriptionTier = {
  id: SubscriptionTierId;
  name: string; // "BASIC"
  pricePerMonth: number; // 2990
  specialNote: string | null; // trade-in / turn-in discount
  bestFor: string;
  badge: string | null;
};

export const subscriptionTiers: SubscriptionTier[] = [
  {
    id: "care-basic",
    name: "BASIC",
    pricePerMonth: 2990,
    specialNote: "พิเศษ ฿1,990/เดือน เมื่อนำเครื่องเดิมมาแลก (Turn เครื่องเก่า)",
    bestFor: "SME · ร้านค้า · ฟิตเนส · คอนโด",
    badge: null,
  },
  {
    id: "care-premium",
    name: "PREMIUM",
    pricePerMonth: 3990,
    specialNote: null,
    bestFor: "โรงเรียน · โรงงาน · สำนักงาน",
    badge: "คุ้มค่าที่สุด",
  },
  {
    id: "care-ultimate",
    name: "ULTIMATE",
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
    values: { "care-basic": true, "care-premium": true, "care-ultimate": true },
  },
  {
    feature: "เปลี่ยนเครื่องเมื่อเสีย (SLA)",
    values: { "care-basic": "48 ชม.", "care-premium": "48 ชม.", "care-ultimate": "24 ชม." },
  },
  {
    feature: "รายงานประจำปี + Hotline",
    values: { "care-basic": true, "care-premium": true, "care-ultimate": true },
  },
  {
    feature: "ตรวจเช็กหน้างาน (ครั้ง/ปี)",
    values: { "care-basic": false, "care-premium": "1 ครั้ง/ปี", "care-ultimate": "2 ครั้ง/ปี" },
  },
  {
    feature: "อบรมพนักงาน (ครั้ง/ปี)",
    values: { "care-basic": false, "care-premium": "1 ครั้ง/ปี", "care-ultimate": "2 ครั้ง/ปี" },
  },
  {
    feature: "สร้างผู้สอน (Instructor) ในองค์กร",
    values: { "care-basic": false, "care-premium": false, "care-ultimate": true },
  },
  {
    feature: "แจ้งเตือนทางอีเมล (Email Alert)",
    values: { "care-basic": false, "care-premium": true, "care-ultimate": true },
  },
  {
    feature: "ระบบควบคุม Cloud Dashboard",
    values: { "care-basic": false, "care-premium": false, "care-ultimate": true },
  },
  {
    feature: "ป้ายจุดติดตั้ง",
    values: { "care-basic": false, "care-premium": false, "care-ultimate": "2 ป้าย พร้อมตู้" },
  },
];

// Rent (managed subscription) vs buy (outright) comparison.
export const rentVsBuy: { dimension: string; buy: string; subscribe: string }[] = [
  {
    dimension: "เงินลงทุนเริ่มต้น",
    buy: "จ่ายเต็มจำนวนทันที (เงินสด ฿39,900 / เครดิต-ราชการ ฿69,000)",
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
    subscribe: "มีระบบแจ้งเตือนอัตโนมัติ",
  },
  {
    dimension: "การอบรมพนักงาน",
    buy: "จัดอบรมเอง",
    subscribe: "มีในแพ็กเกจ",
  },
  {
    dimension: "เหมาะกับองค์กรแบบใด",
    buy: "องค์กรที่มีทีมดูแลอุปกรณ์เองได้",
    subscribe: "องค์กรที่ต้องการความต่อเนื่องและมืออาชีพดูแล",
  },
];
