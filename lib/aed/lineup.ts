// ─── Homepage tier ladder — Amoul i7 + PRIMEDIC sold side by side ──────────────
// Composes the homepage "เลือกตามระดับ" grid by REFERENCING the canonical data
// (products.ts / primedic.ts). Prices/ids are imported, never re-typed here, so
// there's one source of truth per brand.
//
//   Tier 1 "รุ่นเริ่มต้น (เทียบเท่ากัน)":  Amoul i7  ↔  PRIMEDIC HeartSave Y0
//   Tier 2 "รุ่นสูงกว่า":                  PRIMEDIC HeartSave Y8  +  Yuwell AED GPS

import { products } from "./products";
import { primedicModels, yuwellGpsAed, type PrimedicModel } from "./primedic";

export type LineupBrand = "Amoul" | "PRIMEDIC" | "Yuwell";

export type LineupCard = {
  id: string;
  brand: LineupBrand;
  name: string;
  subtitle: string;
  price: number; // ก่อน VAT
  msrp?: number; // ราคาขีดฆ่า (มีเฉพาะ i7)
  image: string;
  description: string;
  features: string[];
  badge: string | null; // ป้ายมุมบน เช่น "แนะนำ"
  highlight: boolean; // true => เน้นกรอบ/ปุ่มสีเหลือง
  dataProduct: string; // data-product attr (ตรงกับ id ใน pricing.ts)
};

export type LineupTier = {
  label: string;
  note: string;
  cards: LineupCard[];
};

const i7 = products[0]; // id "i7"

// PRIMEDIC card body, derived from the model's own fields so density matches i7.
function primedicFeatures(cprFeedback: PrimedicModel["cprFeedback"]): string[] {
  return [
    "กึ่งอัตโนมัติ — มีปุ่ม Shock ใช้งานง่าย",
    cprFeedback === "standard"
      ? "เซ็นเซอร์ CPR feedback มาตรฐาน — วัดแรง/จังหวะกดเรียลไทม์"
      : "เซ็นเซอร์ CPR feedback เป็นตัวเลือกเสริม (เพิ่มทีหลังได้)",
    "เสียงนำทาง CPR 4 ภาษา (ไทย/อังกฤษ/จีน/เยอรมัน)",
    "พลังงาน escalating 200 → 300 → 360 J",
  ];
}

function primedicCard(m: PrimedicModel, subtitle: string): LineupCard {
  return {
    id: m.id,
    brand: "PRIMEDIC",
    name: m.name,
    subtitle,
    price: m.price,
    image: m.image,
    description: m.bestFor,
    features: primedicFeatures(m.cprFeedback),
    badge: m.badge,
    highlight: m.badge != null,
    dataProduct: m.id,
  };
}

const amoulI7Card: LineupCard = {
  id: i7.id,
  brand: "Amoul",
  name: i7.name,
  subtitle: i7.subtitle,
  price: i7.price,
  msrp: i7.msrp,
  image: "/images/product-main.png",
  description: i7.description,
  features: i7.features,
  badge: i7.badge,
  highlight: i7.badge != null,
  dataProduct: i7.id,
};

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
    label: "รุ่นเริ่มต้น · เทียบเท่ากัน",
    note: "สเปกระดับเดียวกัน — เลือกตามงบและความชอบ",
    // Yuwell/PRIMEDIC is the featured brand (owner decision) — red machine leads.
    cards: [
      {
        ...primedicCard(primedicModels[0], "กึ่งอัตโนมัติ · รุ่นเริ่มต้น"),
        badge: "⭐ แนะนำ",
        highlight: true,
      },
      amoulI7Card,
    ],
  },
  {
    label: "รุ่นสูงกว่า · ฟีเจอร์เพิ่ม",
    note: "เพิ่มเซ็นเซอร์ CPR feedback หรือ GPS ติดตามในตัว",
    cards: [primedicCard(primedicModels[1], "กึ่งอัตโนมัติ · มี CPR feedback"), gpsCard],
  },
];
