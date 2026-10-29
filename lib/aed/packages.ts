// ─── Acquisition packages — "3 วิธีได้ AED มาใช้" ──────────────────────────────
// The top-level way customers choose how to get an AED: buy outright, rent-to-own,
// or managed rental. The managed-rental package (pkg-care) is the gateway to the
// ดูแลครบ STANDARD / PRO / ELITE subscription tiers in ./subscription.ts.
//
// Prices are PROVISIONAL (wholesale being finalized). Update here only — the
// rental table, FAQs, subscription comparison and bots read these constants.

import { PRICE_ON_REQUEST, primedicModels } from "./primedic";
import { PACKAGE_TRAINING_PERK } from "./promotion";
import { STANDARD_MONTHLY } from "./rental-prices";

const thb = (n: number) => `฿${n.toLocaleString("en-US")}`;

// ─── Rent-to-own (Safety Start) contract terms ────────────────────────────────
// The only place these numbers live — rental.ts derives its breakdown table and
// contract totals from here.
//   Owner, 29 ต.ค. 2026: higher deposit, lower monthly, SAME contract total —
//   the big deposit covers most of the unit cost on day one, so a default or a
//   unit that disappears costs far less.
//   Y8: 16,000 + 2,000 × 18 = ฿52,000 (≈1.16× ราคาสด 44,900)
//   Y2: 21,200 + 2,600 × 18 = ฿68,000 (≈1.13× ราคาสด 59,999)
//   (was 5,200 + 2,600 / 6,800 + 3,400 from 25 ต.ค.; 16,000 + 2,600 /
//   22,000 + 3,400 → ฿62,800/฿83,200 before that)
export type RentToOwnTerms = { deposit: number; monthly: number; months: number };

export const RENT_TO_OWN_TERMS = {
  "pkg-start-y8": { deposit: 16_000, monthly: 2_000, months: 18 },
  "pkg-start-y2": { deposit: 21_200, monthly: 2_600, months: 18 },
} as const satisfies Record<"pkg-start-y8" | "pkg-start-y2", RentToOwnTerms>;

// Owner, 25 ต.ค. 2026: this deposit is for registered companies only
// (checked with DBD); individuals and small shops get terms case by case. The
// unit stays the company's until the last instalment (ป.พ.พ. เช่าซื้อ).
export const RENT_TO_OWN_ELIGIBILITY =
  "เงินดาวน์นี้สำหรับนิติบุคคล · บุคคลธรรมดาและร้านค้าสอบถามเงื่อนไข";
export const RENT_TO_OWN_OWNERSHIP_NOTE =
  "เครื่องเป็นกรรมสิทธิ์ของบริษัทจนชำระครบ หากผิดนัด 2 งวดติดกัน บริษัทบอกเลิกสัญญาและรับเครื่องคืนได้";

const rentToOwnNote = (t: RentToOwnTerms) =>
  `ดาวน์ ${thb(t.deposit)} (นิติบุคคล) + ผ่อน ${thb(t.monthly)}/เดือน × ${t.months} เดือน แล้วเป็นเจ้าของ`;

// ─── Safety Premium (ซื้อขาด) price build-up ──────────────────────────────────
// Owner confirmed 2026-09-24: ฿42,900 = Yuwell Y0 (ขายเดี่ยว ฿39,000) + ฿3,900
// ค่าอบรม/ชุดฝึก/บริการ — ไม่รวม GPS. รวมตู้ +฿6,100 (all-in ฿49,000, ไม่แยกราคาตู้).
// อัปเกรดรุ่น GPS ในตัว: สอบถามราคา (owner, Oct 2026 — the ฿63,900/฿69,900/฿89,000
// GPS figures had no source; see yuwellGpsAed in ./primedic.ts).
// The credit/government prices are a different payment term (เทอมเครดิตยาว), NOT a
// former price — never render them struck-through as a "was" price.
const PREMIUM_SERVICE_ADDON = 3_900;
const PREMIUM_CABINET_ADDON = 6_100;
const y0 = primedicModels.find((m) => m.id === "primedic-y0")!;

export const SAFETY_PREMIUM_PRICING = {
  cash: y0.price + PREMIUM_SERVICE_ADDON,
  cashWithCabinet: y0.price + PREMIUM_SERVICE_ADDON + PREMIUM_CABINET_ADDON,
  credit: 69_000,
} as const;

// Safety Care (managed rental) — refundable deposit for the 1-year contract.
// The monthly "เริ่ม" price is the STANDARD tier in ./subscription.ts (= the
// annual rental plan)
// (catalog-consistency.test.ts keeps the two in step).
export const SAFETY_CARE_DEPOSIT = 5_000;

export type AcquisitionPackage = {
  id: "pkg-premium" | "pkg-start-y8" | "pkg-start-y2" | "pkg-care";
  kind: "buy" | "rent-to-own" | "managed-rental";
  name: string; // English brand name, e.g. "Safety Premium"
  nameTh: string; // Thai label, e.g. "ซื้อขาด"
  tagline: string;
  priceLabel: string; // headline price string (packages aren't single-number SKUs)
  priceNote: string; // structure under the headline (alternative terms live here)
  deposit: string | null;
  features: string[];
  bestFor: string;
  badge: string | null;
  // Maps to a sellable id accepted by the lead API allowlist (see api/aed/lead).
  ctaProductHint: string;
  // Where the package's primary CTA links (a detail page, or null for LINE only).
  href: string | null;
  // Card header photo (public path). null = text-only card.
  image: string | null;
  imageAlt: string;
};

const startY8 = RENT_TO_OWN_TERMS["pkg-start-y8"];
const startY2 = RENT_TO_OWN_TERMS["pkg-start-y2"];
const premium = SAFETY_PREMIUM_PRICING;

// Order matters: rental-first. The homepage and /aed/packages render this array
// in order, so the two rental options (managed rental, rent-to-own) lead and the
// outright purchase comes last — the site emphasises เช่า over ซื้อ.
export const acquisitionPackages: AcquisitionPackage[] = [
  {
    id: "pkg-care",
    kind: "managed-rental",
    name: "Safety Care",
    nameTh: "เช่าบริการครบวงจร",
    tagline: "มีทีมดูแลความพร้อมให้ตลอดสัญญา",
    // Monthly price = the ดูแลครบ subscription tiers (STANDARD/PRO/ELITE).
    // STANDARD = the annual rental plan, shown as its monthly equivalent.
    priceLabel: `เริ่ม ${thb(STANDARD_MONTHLY)}/เดือน`,
    priceNote: `มัดจำ ${thb(SAFETY_CARE_DEPOSIT)} (คืนได้) · สัญญา 1 ปี · เลือกระดับบริการ STANDARD/PRO/ELITE`,
    deposit: `${thb(SAFETY_CARE_DEPOSIT)} (คืนเต็มเมื่อจบสัญญาและคืนเครื่องครบสภาพ)`,
    features: [
      "บริการครบวงจร ไม่ต้องดูแลอุปกรณ์เอง",
      "ทีมดูแลแบต / แผ่น / รายงาน + เครื่องสำรองถ้าเสีย",
      "คืนได้เมื่อเลิกใช้",
    ],
    bestFor: "องค์กรที่ต้องการความพร้อม 100% โดยไม่ต้องดูแลเอง / โครงการระยะสั้น",
    badge: "เช่า · แนะนำ",
    ctaProductHint: "pkg-care",
    href: "/aed/subscription",
    image: "/images/primedic-heartsave.png",
    imageAlt: "เช่า AED บริการครบวงจร — PRIMEDIC HeartSave",
  },
  {
    // Replaces the discontinued Amoul i7 pkg-start (มัดจำ 15,000 + 2,500 × 18).
    id: "pkg-start-y8",
    kind: "rent-to-own",
    name: "Safety Start — Yuwell Y8",
    nameTh: "เช่าแล้วได้ซื้อ",
    tagline: "ผ่อนเบา ๆ แล้วได้เครื่องเป็นของตัวเอง พร้อมเซ็นเซอร์ CPR feedback",
    priceLabel: `${thb(startY8.monthly)}/เดือน`,
    priceNote: rentToOwnNote(startY8),
    deposit: `${thb(startY8.deposit)} (นับเป็นส่วนหนึ่งของค่าเครื่อง) — ${RENT_TO_OWN_ELIGIBILITY}`,
    features: [
      "เซ็นเซอร์ CPR feedback มาตรฐาน — วัดแรง/จังหวะกดหน้าอกเรียลไทม์",
      "ค่างวดรายเดือนต่ำ กระจายภาระลงทุน",
      `ครบ ${startY8.months} เดือน เครื่องเป็นของท่านโดยไม่มีค่าใช้จ่ายเพิ่ม`,
    ],
    bestFor: "SME / สำนักงานใหม่ ที่อยากเป็นเจ้าของแต่สภาพคล่องจำกัด",
    badge: "ยอดนิยม",
    ctaProductHint: "primedic-y8",
    href: "/quote",
    image: "/images/primedic-y8-open.png",
    imageAlt: "เช่าแล้วได้ซื้อ AED Yuwell/PRIMEDIC HeartSave Y8",
  },
  {
    id: "pkg-start-y2",
    kind: "rent-to-own",
    name: "Safety Start — Yuwell Y2",
    nameTh: "เช่าแล้วได้ซื้อ · รุ่นเรือธง",
    tagline: "ผ่อนเบา ๆ ได้เครื่องรุ่นท็อป จอ EKG ดู CPR สด ๆ",
    priceLabel: `${thb(startY2.monthly)}/เดือน`,
    priceNote: rentToOwnNote(startY2),
    deposit: `${thb(startY2.deposit)} (นับเป็นส่วนหนึ่งของค่าเครื่อง) — ${RENT_TO_OWN_ELIGIBILITY}`,
    features: [
      "จอสี EKG — ดูคุณภาพ CPR สด (ความเร็ว/ความลึก/full recoil)",
      "ค่างวดรายเดือนต่ำ กระจายภาระลงทุน",
      `ครบ ${startY2.months} เดือน เครื่องเป็นของท่านโดยไม่มีค่าใช้จ่ายเพิ่ม`,
    ],
    bestFor: "หน่วยกู้ชีพ/คลินิก/องค์กรที่อยากได้รุ่นเรือธงแต่ผ่อนเบา ๆ",
    badge: "ผ่อนรุ่นเรือธง",
    ctaProductHint: "primedic-y2",
    href: "/quote",
    image: "/images/primedic-y2-open.jpg",
    imageAlt: "Yuwell/PRIMEDIC HeartSave Y2 เปิดฝาพร้อมจอ EKG",
  },
  {
    id: "pkg-premium",
    kind: "buy",
    name: "Safety Premium",
    nameTh: "ซื้อขาด",
    tagline: "เป็นเจ้าของเครื่องเต็มตัว จบในครั้งเดียว",
    priceLabel: `เงินสด ${thb(premium.cash)}`,
    priceNote:
      `เงินสด ${thb(premium.cash)} (Yuwell Y0 ไม่รวมตู้) / รวมตู้ ${thb(premium.cashWithCabinet)} · ` +
      `ราคาเครดิต/ราชการ ${thb(premium.credit)} (สำหรับเทอมเครดิตยาว) · ` +
      `อัปเกรดรุ่น GPS ในตัวได้ (${PRICE_ON_REQUEST}) · ออกใบกำกับภาษีได้`,
    deposit: null,
    features: [
      "เครื่อง AED Yuwell Y0 เป็นกรรมสิทธิ์ขององค์กร",
      `เลือกเพิ่มตู้ติดผนัง / ตู้ตั้งพื้น ได้ (รวมตู้ ${thb(premium.cashWithCabinet)})`,
      `อัปเกรดเป็นรุ่น GPS ในตัว ติดตามตำแหน่ง/สถานะออนไลน์ (${PRICE_ON_REQUEST})`,
      `รวม${PACKAGE_TRAINING_PERK} โดยทีม BLS Instructor (ต่างจังหวัดสอบถาม)`,
      "ชุดอุปกรณ์ฝึกสอน + บริการหลังการขาย",
    ],
    bestFor: "องค์กรที่มีงบลงทุน (CAPEX) และต้องการเป็นเจ้าของ",
    badge: null,
    ctaProductHint: "pkg-premium",
    href: "/quote",
    image: "/images/aed-floorstand.webp",
    imageAlt: "ซื้อขาดเครื่อง AED พร้อมตู้ตั้งพื้น",
  },
];
