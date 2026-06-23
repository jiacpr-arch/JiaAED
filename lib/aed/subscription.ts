// ─── ดูแลครบ managed-rental subscription tiers ─────────────────────────────
// BASIC / PRO / ELITE are the monthly service levels of the ดูแลครบ
// managed-rental package (see ./packages.ts). Prices are PROVISIONAL.

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
