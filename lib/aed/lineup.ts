// ─── Homepage tier ladder — Yuwell / PRIMEDIC HeartSave lineup ─────────────────
// Composes the homepage "เลือกตามระดับ" grid by REFERENCING the canonical data
// (primedic.ts). Prices/ids are imported, never re-typed here, so there's one
// source of truth per model.
//
// Amoul i7 discontinued (ก.ค. 2026) — Yuwell Y2 replaced it everywhere,
// including the SKU/lead-form slot it used to occupy (see products.ts). The
// "Amoul" brand type/styling stay in LineupBrand/LineupProductCard in case a
// future legacy-support card needs it, but no card uses it anymore.
//
//   Tier 1 "รุ่นเริ่มต้น":  PRIMEDIC HeartSave Y0
//   Tier 2 "รุ่นสูงกว่า":   PRIMEDIC HeartSave Y8  +  Yuwell Y2 (เรือธง)  +  Yuwell AED GPS

import { primedicModels, yuwellGpsAed, type PrimedicModel } from "./primedic";

export type LineupBrand = "Amoul" | "PRIMEDIC" | "Yuwell";

export type LineupCard = {
  id: string;
  brand: LineupBrand;
  name: string;
  subtitle: string;
  price: number; // ก่อน VAT
  msrp?: number; // ราคาขีดฆ่า (ไม่ได้ตั้งในการ์ดปัจจุบัน — เผื่อไว้)
  image: string;
  description: string;
  features: string[];
  badge: string | null; // ป้ายมุมบน เช่น "แนะนำ"
  highlight: boolean; // true => เน้นกรอบ/ปุ่มสีเหลือง
  dataProduct: string; // data-product attr (ตรงกับ id ใน pricing.ts)
  detailHref?: string; // หน้ารายละเอียดรุ่น (ถ้ามี) — การ์ดจะแสดงลิงก์ "ดูรายละเอียด"
};

export type LineupTier = {
  label: string;
  note: string;
  cards: LineupCard[];
};

// PRIMEDIC card body, derived from the model's own fields.
// Y2 (เรือธง) leads with its screen; Y0/Y8 lead with the CPR-feedback difference.
function primedicFeatures(m: PrimedicModel): string[] {
  const first =
    m.id === "primedic-y2"
      ? "จอสี EKG — ดูคุณภาพ CPR สด (ความเร็ว/ความลึก/full recoil)"
      : m.cprFeedback === "standard"
        ? "เซ็นเซอร์ CPR feedback มาตรฐาน — วัดแรง/จังหวะกดเรียลไทม์"
        : "เซ็นเซอร์ CPR feedback เป็นตัวเลือกเสริม (เพิ่มทีหลังได้)";
  return [
    "กึ่งอัตโนมัติ — มีปุ่ม Shock ใช้งานง่าย",
    first,
    "เสียงนำทาง CPR 4 ภาษา (ไทย/อังกฤษ/จีน/เยอรมัน)",
    "พลังงาน escalating 200 → 300 → 360 J",
  ];
}

function primedicCard(m: PrimedicModel, subtitle: string): LineupCard {
  const brand: LineupBrand = m.id === "primedic-y2" ? "Yuwell" : "PRIMEDIC";
  return {
    id: m.id,
    brand,
    name: m.name,
    subtitle,
    price: m.price,
    image: m.image,
    description: m.bestFor,
    features: primedicFeatures(m),
    badge: m.badge,
    highlight: m.badge != null,
    dataProduct: m.id,
    // Y2 has its own landing page; the rest share the PRIMEDIC lineup page.
    detailHref: m.id === "primedic-y2" ? "/aed/yuwell-y2" : "/aed/primedic",
  };
}

const gpsCard: LineupCard = {
  id: yuwellGpsAed.id,
  brand: "Yuwell",
  name: yuwellGpsAed.name,
  subtitle: "AED + GPS ในตัว",
  price: yuwellGpsAed.price,
  image: yuwellGpsAed.image,
  description: yuwellGpsAed.description,
  features: yuwellGpsAed.features,
  badge: null,
  highlight: false,
  dataProduct: yuwellGpsAed.id,
};

export const homepageTiers: LineupTier[] = [
  {
    label: "รุ่นเริ่มต้น",
    note: "จุดเริ่มต้นคุ้มค่า ใช้งานง่าย พร้อมใช้ทันที",
    cards: [
      {
        ...primedicCard(primedicModels[0], "กึ่งอัตโนมัติ · รุ่นเริ่มต้น"),
        badge: "⭐ แนะนำ",
        highlight: true,
      },
    ],
  },
  {
    label: "รุ่นสูงกว่า · ฟีเจอร์เพิ่ม",
    note: "เพิ่มเซ็นเซอร์ CPR feedback · จอ EKG ดู CPR สด หรือ GPS ติดตามในตัว",
    cards: [
      primedicCard(primedicModels[1], "กึ่งอัตโนมัติ · มี CPR feedback"),
      {
        ...primedicCard(primedicModels[2], "จอ EKG · ดู CPR สด · รุ่นเรือธง"),
        highlight: true,
      },
      gpsCard,
    ],
  },
];
