// ─── Acquisition packages — "3 วิธีได้ AED มาใช้" ──────────────────────────────
// The top-level way customers choose how to get an AED: buy outright, rent-to-own,
// or managed rental. The managed-rental package (pkg-care) is the gateway to the
// ดูแลครบ BASIC / PRO / ELITE subscription tiers in ./subscription.ts.
//
// Prices are PROVISIONAL (wholesale being finalized). Update here only.

export type AcquisitionPackage = {
  id: "pkg-premium" | "pkg-start" | "pkg-care";
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
  },
  {
    id: "pkg-start",
    kind: "rent-to-own",
    name: "Safety Start",
    nameTh: "เช่าแล้วได้ซื้อ",
    tagline: "ผ่อนเบา ๆ แล้วได้เครื่องเป็นของตัวเอง",
    priceLabel: "฿2,500/เดือน",
    listPriceLabel: null,
    // Rent-to-own total = 15,000 + 2,500 × 18 = ฿60,000. Sits between cash buy
    // (฿39,900) and the credit/government list (฿69,000) — a ~50% financing
    // premium over cash, which is the expected cost of paying monthly. Coherent.
    priceNote: "มัดจำ ฿15,000 + ผ่อน ฿2,500/เดือน × 18 เดือน แล้วเป็นเจ้าของ",
    deposit: "฿15,000 (นับเป็นส่วนหนึ่งของค่าเครื่อง)",
    features: [
      "ใช้ชุดอุปกรณ์ครบได้ทันที",
      "กระจายภาระลงทุน ไม่ต้องจ่ายก้อนใหญ่",
      "ครบ 18 เดือน เครื่องเป็นของท่านโดยไม่มีค่าใช้จ่ายเพิ่ม",
    ],
    bestFor: "SME / สำนักงานใหม่ ที่อยากเป็นเจ้าของแต่สภาพคล่องจำกัด",
    badge: "ยอดนิยม",
    ctaProductHint: "pkg-start",
    href: "/quote",
  },
  {
    id: "pkg-premium",
    kind: "buy",
    name: "Safety Premium",
    nameTh: "ซื้อขาด",
    tagline: "เป็นเจ้าของเครื่องเต็มตัว จบในครั้งเดียว",
    priceLabel: "เงินสด ฿39,900",
    listPriceLabel: "฿69,000",
    priceNote: "เงินสด ฿39,900 · ราคาเครดิต/ราชการ ฿69,000 (สำหรับเทอมเครดิตยาว) · ออกใบกำกับภาษีได้",
    deposit: null,
    features: [
      "เครื่อง AED + GPS เป็นกรรมสิทธิ์ขององค์กร",
      "ตู้ติดผนัง / ตู้ตั้งพื้น",
      "อบรมการใช้งานให้ทีมงาน",
      "บริการหลังการขายเบื้องต้น",
    ],
    bestFor: "องค์กรที่มีงบลงทุน (CAPEX) และต้องการเป็นเจ้าของ",
    badge: null,
    ctaProductHint: "pkg-premium",
    href: "/quote",
  },
];
