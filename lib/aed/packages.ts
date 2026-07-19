// ─── Acquisition packages — "3 วิธีได้ AED มาใช้" ──────────────────────────────
// The top-level way customers choose how to get an AED: buy outright, rent-to-own,
// or managed rental. The managed-rental package (pkg-care) is the gateway to the
// ดูแลครบ BASIC / PRO / ELITE subscription tiers in ./subscription.ts.
//
// Prices are PROVISIONAL (wholesale being finalized). Update here only.

export type AcquisitionPackage = {
  id: "pkg-premium" | "pkg-start-y8" | "pkg-start-y2" | "pkg-care";
  kind: "buy" | "rent-to-own" | "managed-rental";
  name: string; // English brand name, e.g. "Safety Premium"
  nameTh: string; // Thai label, e.g. "ซื้อขาด"
  tagline: string;
  priceLabel: string; // headline price string (packages aren't single-number SKUs)
  listPriceLabel: string | null; // struck-through list/credit price, if any
  priceNote: string; // structure under the headline
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
    listPriceLabel: null,
    // Monthly price = the ดูแลครบ subscription tiers (BASIC/PRO/ELITE).
    // BASIC tier starts at ฿2,990/month. Deposit ฿5,000 for annual contract.
    priceLabel: "เริ่ม ฿2,990/เดือน",
    priceNote: "มัดจำ ฿5,000 (คืนได้) · สัญญา 1 ปี · เลือกระดับบริการ BASIC/PRO/ELITE",
    deposit: "฿5,000 (คืนเต็มเมื่อจบสัญญาและคืนเครื่องครบสภาพ)",
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
    priceLabel: "฿2,600/เดือน",
    listPriceLabel: null,
    // Rent-to-own total = 16,000 + 2,600 × 18 = ฿62,800 vs ราคาสด Y8 ฿44,900
    // (62,800 / 44,900 ≈ 1.40) — สัดส่วนพรีเมียมเดียวกับ pkg-start-y2 (≈1.41)
    // ตามนโยบายผ่อนของร้าน. Owner approved 2026-07-19.
    priceNote: "มัดจำ ฿16,000 + ผ่อน ฿2,600/เดือน × 18 เดือน แล้วเป็นเจ้าของ",
    deposit: "฿16,000 (นับเป็นส่วนหนึ่งของค่าเครื่อง)",
    features: [
      "เซ็นเซอร์ CPR feedback มาตรฐาน — วัดแรง/จังหวะกดหน้าอกเรียลไทม์",
      "กระจายภาระลงทุน ไม่ต้องจ่ายก้อนใหญ่",
      "ครบ 18 เดือน เครื่องเป็นของท่านโดยไม่มีค่าใช้จ่ายเพิ่ม",
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
    priceLabel: "฿3,400/เดือน",
    listPriceLabel: null,
    // Rent-to-own total = 22,000 + 3,400 × 18 = ฿83,200. สัดส่วนพรีเมียมเทียบราคาสด
    // (83,200 / 59,000 ≈ 1.41) เท่ากับสัดส่วนของแพ็ก pkg-start-y8 (62,800/44,900 ≈ 1.40)
    // — คงความสม่ำเสมอของนโยบายผ่อนระหว่างรุ่น (ปรับตามราคาป้าย Y2 ใหม่ 59,000).
    priceNote: "มัดจำ ฿22,000 + ผ่อน ฿3,400/เดือน × 18 เดือน แล้วเป็นเจ้าของ",
    deposit: "฿22,000 (นับเป็นส่วนหนึ่งของค่าเครื่อง)",
    features: [
      "จอสี EKG — ดูคุณภาพ CPR สด (ความเร็ว/ความลึก/full recoil)",
      "กระจายภาระลงทุน ไม่ต้องจ่ายก้อนใหญ่",
      "ครบ 18 เดือน เครื่องเป็นของท่านโดยไม่มีค่าใช้จ่ายเพิ่ม",
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
    priceLabel: "เงินสด ฿42,900",
    listPriceLabel: "฿69,000",
    priceNote: "เงินสด ฿42,900 · ราคาเครดิต/ราชการ ฿69,000 (สำหรับเทอมเครดิตยาว) · ออกใบกำกับภาษีได้",
    deposit: null,
    features: [
      "เครื่อง AED + GPS เป็นกรรมสิทธิ์ขององค์กร",
      "เลือกเพิ่มตู้ติดผนัง / ตู้ตั้งพื้น ได้",
      "อบรม CPR & AED สอนถึงที่ โดยทีม BLS Instructor",
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
