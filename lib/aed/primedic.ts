// ─── PRIMEDIC HeartSave line (Y0 / Y8 / YA0 / YA8) ─────────────────────────────
// The AED line we sell (Amoul i7 removed by อย. order, ก.ค. 2026). Specs from the PRIMEDIC
// HeartSave comparison sheet.
//
// Compliance: PRIMEDIC's อย./ฆพ. (incl. validUntil + importer disclaimer) live in
// ./regulatory.ts (re-exported here for backward-compat). The อย. notification
// covers HeartSave Y0/Y8 (semi-auto) and YA0/YA8 (fully-auto), battery NRL01B, and
// the OBS-DE/P electrode pads. Registrant/importer: บริษัท ยูเวล เมดิคอล (ไทยแลนด์)
// จำกัด. DO NOT reuse the i7 numbers — see regulatory.ts.
import { PRIMEDIC_REGULATORY } from "./regulatory";
export { PRIMEDIC_REGULATORY };

// Certifications confirmed by the official Yuwell Y8 spec sheet (ISO 13485 / CE)
// and the Thai FDA ใบรับแจ้งรายการละเอียด (อย.). Shown as trust badges. The อย.
// badge follows the `published` gate like every other registration claim.
export const primedicCertifications: { label: string; sub: string }[] = [
  ...(PRIMEDIC_REGULATORY.published && PRIMEDIC_REGULATORY.fda
    ? [{ label: "อย.", sub: PRIMEDIC_REGULATORY.fda }]
    : []),
  { label: "ISO 13485", sub: "ระบบคุณภาพเครื่องมือแพทย์" },
  { label: "CE", sub: "มาตรฐานความปลอดภัยยุโรป" },
];

// Consumable lifetimes from the Y2 spec sheet
// (public/documents/aed-y2-specification-2026.docx): electrode pads and battery
// each last "ไม่น้อยกว่า 4 ปี นับจากวันที่ผลิต". The manufacturer's feature sheet
// says "up to 5 years" for both — we quote the guaranteed minimum. One constant so FAQs, articles and both bots say the
// same thing (they used to say 2–3, 3, ~5 and "≥ 5" years).
export const CONSUMABLE_LIFETIME_YEARS = { pads: 4, battery: 4 } as const;
export const consumableLifetimeText = `แผ่นอิเล็กโทรดอายุไม่น้อยกว่า ${CONSUMABLE_LIFETIME_YEARS.pads} ปี และแบตเตอรี่อายุไม่น้อยกว่า ${CONSUMABLE_LIFETIME_YEARS.battery} ปี นับจากวันที่ผลิต (เปลี่ยนตามวันหมดอายุที่ระบุบนซอง/ตัวแบต)`;

export type PrimedicModelId = "primedic-y0" | "primedic-y8" | "primedic-y2";

export type PrimedicModel = {
  id: PrimedicModelId;
  name: string;
  price: number; // sell price (THB, before VAT)
  // Y0/Y8 keep a manual Shock button (semi-automatic). The auto YA0/YA8 are not sold.
  shockMode: "semi-auto";
  // Y8 ships with the CPR feedback sensor as standard; Y0 makes it optional.
  cprFeedback: "standard" | "optional";
  summary: string;
  // keyDiff = the ONE thing that sets this model apart (so Y0/Y8/GPS don't blur
  // together on the page). bestFor = the buyer it suits.
  keyDiff: string;
  bestFor: string;
  image: string; // real photos from the Yuwell/PRIMEDIC HeartSave Y/YA catalog
  badge: string | null;
  warrantyYears: number; // body warranty Jia commits to — see warrantyLine below
  // A price this site really charged before the current one, shown struck
  // through ("ราคาเดิม"). Thai price-display rules only allow a struck price
  // that was actually sold — never a market "full price" or a competitor's
  // list price. soldFrom/soldUntil document when we sold at it (git history);
  // the strike stops showing after showUntil so it can't go stale.
  previousPrice?: { amount: number; soldFrom: string; soldUntil: string; showUntil: string };
};

export const primedicModels: PrimedicModel[] = [
  {
    id: "primedic-y0",
    name: "HeartSave Y0",
    price: 39_999, // Yuwell OK'd 39,999 for Y0 (owner, 15 พ.ย. 2026)
    shockMode: "semi-auto",
    cprFeedback: "optional",
    summary: "กึ่งอัตโนมัติ (มีปุ่ม Shock) — เริ่มต้นคุ้มค่า",
    keyDiff: "รุ่นประหยัด — แผ่นที่แถมมาเป็นแบบไม่มี CPR feedback",
    bestFor: "งบจำกัด · ร้านค้า/สำนักงานทั่วไปที่อยากมี AED พร้อมใช้",
    image: "/images/primedic-y-series.png",
    badge: null,
    warrantyYears: 5,
  },
  {
    id: "primedic-y8",
    name: "HeartSave Y8",
    // ตัวเครื่องเดียวกับ Y0 ต่างกันที่แผ่น CPR feedback — บอกลูกค้าตรง ๆ (เจ้าของ 13 พ.ย. 2026)
    price: 45_900,
    shockMode: "semi-auto",
    cprFeedback: "standard",
    summary: "ตัวเครื่องเดียวกับ Y0 + แผ่น CPR feedback",
    keyDiff: "แผ่นวัดแรง/จังหวะกดหน้าอก (เสียงบอก) · เพิ่มอีก ฿4,000 → Y2 เห็นคุณภาพ CPR บนจอสี",
    bestFor: "อยากให้ผู้ช่วยเหลือกดหน้าอกได้ถูกต้อง · โรงเรียน/ฟิตเนส/โรงงาน",
    image: "/images/primedic-y8-open.png",
    badge: null,
    warrantyYears: 8,
  },
  {
    // รุ่นเรือธง — ฮาร์ดแวร์เดียวกับ Y8 แต่มีจอสีแสดง EKG + ดูคุณภาพ CPR สด ๆ.
    // ชื่อทางการตลาด "Yuwell Y2 (You Too)" ตามที่เจ้าของกำหนด.
    id: "primedic-y2",
    name: "Yuwell Y2",
    price: 49_900,
    // Sold at ฿59,999 on this site 26 ก.ย.–13 พ.ย. 2026 (commits b077914 → 2dc4783).
    previousPrice: { amount: 59_999, soldFrom: "2026-09-26", soldUntil: "2026-11-13", showUntil: "2027-02-13" },
    shockMode: "semi-auto",
    cprFeedback: "standard",
    summary: "จอสี EKG + ดูคุณภาพ CPR สด ๆ — รุ่นแนะนำ (You Too)",
    keyDiff: "จอแสดงคุณภาพ CPR เรียลไทม์ — ความเร็ว/ความลึก/การปล่อยสุด (full recoil) + คลื่น EKG",
    bestFor: "หน่วยกู้ชีพ/คลินิก/องค์กรที่ต้องการ CPR คุณภาพสูงสุด · เห็นบนจอ ปรับท่าปั๊มได้ทันที",
    image: "/images/primedic-y2-open.jpg",
    badge: "แนะนำ",
    warrantyYears: 4,
  },
];

/** The struck-through "ราคาเดิม" to show today, or null (none, expired, or not higher). */
export function activePreviousPrice(m: PrimedicModel, now: Date = new Date()): number | null {
  const p = m.previousPrice;
  if (!p || p.amount <= m.price) return null;
  // showUntil is inclusive, Bangkok time.
  if (now.getTime() > new Date(`${p.showUntil}T23:59:59+07:00`).getTime()) return null;
  return p.amount;
}

// ─── Models listed for outright sale on the site (owner, 15 พ.ย. 2026) ─────────
// Y2 (recommended) then Y0. Y8 = Y0 + feedback pads and costs the same as Y2
// wholesale, so it is quote-only: no price card, a "ask on LINE" line instead,
// and the bots steer Y8 askers to Y2. Y8 stays in primedicModels/AED_PRODUCTS
// so quotes, rent-to-own (GPS = Y8 hardware) and the bots still know it.
export const LISTED_MODEL_IDS = ["primedic-y2", "primedic-y0"] as const;
export const listedPrimedicModels: PrimedicModel[] = LISTED_MODEL_IDS.map(
  (id) => primedicModels.find((m) => m.id === id)!,
);

// Owner, 15 พ.ย. 2026 (later): Y8 is no longer sold — shown greyed in the
// comparison so buyers see the ladder. Worded "งดจำหน่าย", not "สินค้าหมด":
// it's a decision, not a stock-out.
export const Y8_STATUS = "งดจำหน่าย";
export const Y8_ON_REQUEST_NOTE =
  "Y8 (ตัวเครื่อง Y0 + แผ่น CPR feedback) งดจำหน่ายแล้ว — ถ้าต้องการแผ่น feedback แนะนำ Y2 ที่มีทั้งแผ่น feedback และจอในตัว · ลูกค้าที่มี Y8 อยู่แล้ว ยังได้รับประกันและบริการเหมือนเดิม";

/** How both bots answer a customer who asks for Y8 (owner's script, 15 พ.ย. 2026). */
export function y8BotRule(): string {
  const y2 = primedicModels.find((m) => m.id === "primedic-y2")!;
  const fmt = (n: number) => `฿${n.toLocaleString("en-US")}`;
  return `แผ่น CPR feedback ไม่ขายแยก (เจ้าของ 15 พ.ย. 2026) — ขายเป็นแผ่นเปลี่ยนให้ลูกค้าที่มี Y8 อยู่แล้วเท่านั้น ถ้าลูกค้า Y0 อยากได้ feedback ให้แนะนำ Y2 · ถ้าลูกค้าถามรุ่น Y8: บอกตรง ๆ ว่า Y8 (ตัวเครื่อง Y0 + แผ่นวัดการกดหน้าอก) งดจำหน่ายแล้ว ห้ามเสนอราคาหรือออกใบเสนอราคา Y8 — แนะนำ Yuwell Y2 (${fmt(y2.price)}) ที่มีแผ่นวัดแบบเดียวกัน + จอแสดงความเร็ว/ความลึก/การปล่อยหน้าอกสด ๆ หรือ Y0 ถ้างบจำกัด · ถ้าเป็นลูกค้าที่มี Y8 อยู่แล้ว บอกว่ายังได้รับประกัน แผ่น/แบตเปลี่ยน และบริการเหมือนเดิม · ถ้าหน่วยงานระบุ Y8 ใน TOR ให้ escalate_to_human`;
}

// Yuwell AED with GPS built in (the red unit; HeartSave Y8 hardware with the
// networking module) — sold as its own product.
export const yuwellGpsAed = {
  id: "yuwell-gps",
  name: "HeartSave Y8 GPS",
  // Price on request (owner, Oct 2026): the ฿60,000 shown before had no source
  // and sat above what the team actually quotes. Pages print "สอบถามราคา" while
  // this is null; the LINE bot still quotes from AED_PRODUCTS in ./pricing.ts.
  // Owner, 29 ต.ค. 2026: ฿55,000 (raised from 52,000 the same day) — between Y8
  // (44,900 at the time) and the rent-to-own Y8 GPS contract (62,000).
  // Owner, 15 พ.ย. 2026: back to "สอบถามราคา" — customers call/LINE for a price.
  price: null as number | null, // before VAT
  warrantyYears: 8, // same as the Y8 it's built on, per the owner's GPS quotations
  // Clean photo of the actual red GPS unit (also used by the lineup card). Feeds
  // the Google product JSON-LD (StructuredData) and lineup.ts.
  image: "/images/yuwell-gps-aed.webp",
  keyDiff: "เครื่อง Y8 (แถมแผ่น CPR feedback) + GPS ติดตามตำแหน่ง/สถานะออนไลน์",
  bestFor: "องค์กรหลายสาขา · ต้องรู้ว่าเครื่องอยู่ไหนและพร้อมใช้ตลอดเวลา",
  description:
    "เครื่อง AED พร้อมระบบ GPS ในตัว — ติดตามตำแหน่งและสถานะเครื่องแบบเรียลไทม์ เหมาะกับองค์กรหลายสาขา",
  features: [
    "ตัวเครื่อง HeartSave Y8 + แผ่น CPR feedback",
    "GPS ติดตามตำแหน่งในตัวเครื่อง",
    "เชื่อมระบบแจ้งเตือน/ติดตามสถานะ",
    "เสียงนำทางการกู้ชีพ",
  ],
};

export const PRICE_ON_REQUEST = "สอบถามราคา";

// Body warranty (ตัวเครื่อง) per model, as Jia's quotations state it and the
// owner confirmed (Oct 2026). The manufacturer's Thailand letter says 8 years for
// the whole Y line and the manual says 24 months; the site follows what Jia
// actually commits to. One line so pages, FAQs and both bots say the same thing.
export const warrantyLine = `รับประกันตัวเครื่อง ${[
  ...primedicModels.map((m) => `${m.id.replace("primedic-", "").toUpperCase()} ${m.warrantyYears} ปี`),
  `รุ่น GPS ${yuwellGpsAed.warrantyYears} ปี`,
].join(" · ")}`;

// Specs shared by all four models — rendered as a simple label/value list.
// Verified against the official Yuwell HeartSave Y8 spec sheet + the อย. แนบท้าย.
// ตัวเครื่อง/หูหิ้ว, Self-test ทุก 24 ชม., AHA Guideline 2010/2015 และจอ Backlight
// ยืนยันโดยเจ้าของ (ก.ค. 2026) เพื่อให้ตรงกับเอกสารสเปกจัดซื้อภาครัฐ.
export const primedicSharedSpecs: { label: string; value: string }[] = [
  { label: "รูปแบบคลื่นกระตุก", value: "Biphasic Truncated Exponential (BTE)" },
  { label: "ECG ในตัว", value: "Single Channel ECG — วิเคราะห์จังหวะหัวใจอัตโนมัติ" },
  {
    label: "มาตรฐานรับรอง",
    value:
      PRIMEDIC_REGULATORY.published && PRIMEDIC_REGULATORY.fda
        ? `ISO 13485 · CE · อย. ${PRIMEDIC_REGULATORY.fda}`
        : "ISO 13485 · CE",
  },
  { label: "แนวทางการกู้ชีพ (CPR)", value: "ตาม AHA Guideline 2010/2015" },
  { label: "ตัวเครื่อง", value: "วัสดุแข็งแรง มีหูหิ้วในตัว ขนาดกะทัดรัด เคลื่อนย้ายสะดวก" },
  { label: "Self-test อัตโนมัติ", value: "ทุก 24 ชั่วโมง (บันทึกผลได้ 3,650 ครั้ง)" },
  { label: "ภาษาเสียงนำทาง CPR", value: "4 ภาษา (ไทย / อังกฤษ / จีน / เยอรมัน)" },
  { label: "หน้าจอแสดงสถานะ", value: "มี — Backlight อ่านง่ายแม้ในที่มืด" },
  { label: "เสียงนำจังหวะกด CPR", value: "มี" },
  { label: "ปุ่ม Shock (กึ่งอัตโนมัติ)", value: "มี ทั้ง Y0 / Y8 / Y2" },
  { label: "ปุ่มเลือกโหมดเด็ก (Child)", value: "มี" },
  { label: "พลังงานผู้ใหญ่ (ค่าเริ่มต้น)", value: "200 → 300 → 360 J (escalating)" },
  { label: "พลังงานเด็ก (ค่าเริ่มต้น)", value: "50 → 70 → 100 J" },
  { label: "วิเคราะห์ถึงชาร์จ 200J พร้อม", value: "≤ 5 วินาที" },
  { label: "วิเคราะห์ถึงชาร์จ 360J พร้อม", value: "≤ 12 วินาที" },
  { label: "เปิดฝาเครื่องถึงชาร์จ 200J พร้อม", value: "≤ 7 วินาที" },
  { label: "เปิดฝาเครื่องถึงชาร์จ 360J พร้อม", value: "≤ 14 วินาที" },
  { label: "จำนวนช็อกต่อแบต", value: "≥ 200 ครั้งที่ 360J (NRL01C)" },
  { label: "แบตเตอรี่", value: "LiMnO₂ 12V 4.2Ah แบบใช้แล้วทิ้ง (non-rechargeable)" },
  { label: "อายุแบตเตอรี่", value: `ไม่น้อยกว่า ${CONSUMABLE_LIFETIME_YEARS.battery} ปี นับจากวันที่ผลิต` },
  {
    label: "บันทึกข้อมูล",
    value: "SD card 16GB · ECG 10 ชม. · Event 2,000 · Audio log 2 ชม. · CPR data 10 ชม. · Self-test 3,650",
  },
  { label: "ถ่ายโอนข้อมูล", value: "USB 2.0" },
  { label: "แผ่นอิเล็กโทรด", value: "แบบใช้แล้วทิ้ง รองรับผู้ใหญ่และเด็ก (อายุ 3 ปี)" },
  { label: "อายุแผ่นอิเล็กโทรด", value: `ไม่น้อยกว่า ${CONSUMABLE_LIFETIME_YEARS.pads} ปี นับจากวันที่ผลิต` },
  { label: "ขนาด (กว้าง×ลึก×สูง)", value: "22 × 9.7 × 29.6 ซม." },
  { label: "น้ำหนัก", value: "~2.5 กก. (รวมโมดูลพลังงานและแผ่น)" },
  { label: "อายุการเก็บรักษา (shelf life)", value: "10 ปี" },
];

// Spec rows that DIFFER across models. A cell value of:
//   true       → ✓ (มี)
//   false      → – (ไม่มี)
//   "optional" → ตัวเลือกเสริม
//   string     → rendered literally
export type PrimedicSpecRow = {
  label: string;
  values: Record<PrimedicModelId, string | boolean | "optional">;
};

// Plain-language rows so a buyer sees what each step adds:
// Y0 → (+ แผ่น feedback) = Y8 → (+ จอ) = Y2. Y8 is shown greyed as งดจำหน่าย
// (owner, 15 พ.ย. 2026) so the ladder still makes sense.
const warrantyOf = (id: PrimedicModelId) => `${primedicModels.find((m) => m.id === id)!.warrantyYears} ปี`;
export const primedicDiffSpecs: PrimedicSpecRow[] = [
  {
    label: "ช็อกหัวใจ + เสียงนำทางภาษาไทยทีละขั้น",
    values: { "primedic-y0": true, "primedic-y8": true, "primedic-y2": true },
  },
  {
    label: "ใช้กับเด็กได้ (ปุ่มโหมดเด็ก)",
    values: { "primedic-y0": true, "primedic-y8": true, "primedic-y2": true },
  },
  {
    label: "บอกว่ากดหน้าอกแรง/เร็วพอไหม (แผ่น CPR feedback)",
    values: { "primedic-y0": false, "primedic-y8": "เสียงบอก", "primedic-y2": "เสียงบอก + บนจอ" },
  },
  {
    label: "จอแสดงความเร็ว / ความลึก / การปล่อยหน้าอก สด ๆ",
    values: { "primedic-y0": false, "primedic-y8": false, "primedic-y2": true },
  },
  {
    label: "จอสีแสดงคลื่นหัวใจ (EKG)",
    values: { "primedic-y0": false, "primedic-y8": false, "primedic-y2": true },
  },
  {
    label: "รับประกันตัวเครื่อง",
    values: {
      "primedic-y0": warrantyOf("primedic-y0"),
      "primedic-y8": warrantyOf("primedic-y8"),
      "primedic-y2": warrantyOf("primedic-y2"),
    },
  },
  {
    label: "ราคา (ก่อน VAT)",
    // Derived from primedicModels so the table can't drift from the cards.
    values: Object.fromEntries(
      primedicModels.map((m) => [m.id, m.id === "primedic-y8" ? Y8_STATUS : `฿${m.price.toLocaleString("en-US")}`]),
    ) as Record<PrimedicModelId, string>,
  },
];

/** Comparison columns in "what each step adds" order: Y0 → Y8 → Y2. */
export const comparisonModels: PrimedicModel[] = (["primedic-y0", "primedic-y8", "primedic-y2"] as const).map(
  (id) => primedicModels.find((m) => m.id === id)!,
);

/** Who should buy which — shown next to the comparison so buyers can decide. */
export const modelChooser: { id: "primedic-y2" | "primedic-y0" | "yuwell-gps" | "rent"; title: string; pick: string[]; skip: string[] }[] = [
  {
    id: "primedic-y2",
    title: "เลือก Yuwell Y2 ⭐ ถ้า…",
    pick: [
      "คนที่จะใช้เครื่องไม่ได้ทำ CPR บ่อย — อยากให้เครื่องบอกว่ากดถูกไหม",
      "โรงพยาบาล ศูนย์ฝึกอบรม หน่วยกู้ชีพ โรงเรียน ฟิตเนส — ต้องการข้อมูล CPR และ EKG บนจอ",
      "ต้องใช้เอกสารสเปก (TOR) สำหรับจัดซื้อ",
    ],
    skip: ["ไม่จำเป็นถ้างบจำกัดมาก และทีมผ่านการฝึก CPR สม่ำเสมออยู่แล้ว"],
  },
  {
    id: "primedic-y0",
    title: "เลือก HeartSave Y0 ถ้า…",
    pick: [
      "อยากมี AED พร้อมใช้ในราคาประหยัดที่สุด",
      "สำนักงาน ร้านค้า คอนโด ที่มีคนผ่านการอบรม CPR",
    ],
    skip: ["แผ่นที่แถมไม่มี CPR feedback (ไม่ขายแยก) — ถ้าอยากได้ เลือก Y2"],
  },
  {
    id: "yuwell-gps",
    title: "เลือก Y8 GPS ถ้า…",
    pick: [
      "มีหลายสาขา/หลายจุด ต้องรู้ว่าเครื่องอยู่ไหนและพร้อมใช้ไหม",
      "ไม่มีคนเดินเช็คเครื่องเป็นประจำ — ให้ทีมเราเช็คออนไลน์แทน",
    ],
    skip: ["ไม่มีจอแสดงผล CPR — ถ้าอยากเห็นคุณภาพการปั๊มบนจอ เลือก Y2"],
  },
  {
    id: "rent",
    title: "ยังไม่ต้องซื้อ — เช่าดีกว่า ถ้า…",
    pick: [
      "ใช้ชั่วคราว (งานอีเวนต์ โครงการ) หรือยังไม่แน่ใจ",
      "ไม่อยากดูแลแบต/แผ่นเอง หรือไม่อยากจ่ายก้อนใหญ่",
    ],
    skip: [],
  },
];

