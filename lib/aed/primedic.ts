// ─── PRIMEDIC HeartSave line (Y0 / Y8 / YA0 / YA8) ─────────────────────────────
// Premium AED line sold ALONGSIDE the AED Amoul i7. Specs from the PRIMEDIC
// HeartSave comparison sheet.
//
// IMPORTANT (compliance): PRIMEDIC needs its OWN อย./ฆพ. (Thai FDA registration +
// advertising licence). DO NOT reuse the i7 numbers (อย. 68-2-2-2-0005243 /
// ฆพ.743/2569). The values below are PLACEHOLDERS until the owner supplies the
// real ones — do not publish them as real registrations in JSON-LD/feed.
export const PRIMEDIC_REGULATORY = {
  // TODO(owner): replace with the real PRIMEDIC อย. number before advertising.
  fdaRegistration: "อย. (อยู่ระหว่างขึ้นทะเบียน)",
  // TODO(owner): replace with the real PRIMEDIC ฆพ. number before advertising.
  adLicense: "ฆพ. (อยู่ระหว่างขออนุญาต)",
  disclaimer:
    "รุ่น PRIMEDIC HeartSave อยู่ระหว่างดำเนินการขึ้นทะเบียน อย. และใบอนุญาตโฆษณาสำหรับประเทศไทย — สอบถามสถานะล่าสุดและกำหนดวางจำหน่ายได้ทาง LINE",
} as const;

export type PrimedicModelId = "primedic-y0" | "primedic-y8";

export type PrimedicModel = {
  id: PrimedicModelId;
  name: string;
  price: number; // sell price (THB, before VAT)
  // Y0/Y8 keep a manual Shock button (semi-automatic). The auto YA0/YA8 are not sold.
  shockMode: "semi-auto";
  // Y8 ships with the CPR feedback sensor as standard; Y0 makes it optional.
  cprFeedback: "standard" | "optional";
  summary: string;
  image: string; // TODO(owner): real PRIMEDIC product photos
  badge: string | null;
};

export const primedicModels: PrimedicModel[] = [
  {
    id: "primedic-y0",
    name: "HeartSave Y0",
    price: 39_900,
    shockMode: "semi-auto",
    cprFeedback: "optional",
    summary: "กึ่งอัตโนมัติ (มีปุ่ม Shock) — เริ่มต้นคุ้มค่า",
    image: "/images/primedic-open.png",
    badge: null,
  },
  {
    id: "primedic-y8",
    name: "HeartSave Y8",
    price: 49_999,
    shockMode: "semi-auto",
    cprFeedback: "standard",
    summary: "กึ่งอัตโนมัติ + เซ็นเซอร์ CPR feedback มาตรฐาน",
    image: "/images/primedic-open.png",
    badge: "แนะนำ",
  },
];

// Yuwell AED with GPS built in (the red unit) — sold as its own product.
export const yuwellGpsAed = {
  id: "yuwell-gps",
  name: "Yuwell AED — GPS ในตัว",
  price: 60_000, // before VAT
  image: "/images/primedic-heartsave.png",
  description:
    "เครื่อง AED พร้อมระบบ GPS ในตัว — ติดตามตำแหน่งและสถานะเครื่องแบบเรียลไทม์ เหมาะกับองค์กรหลายสาขา",
  features: [
    "GPS ติดตามตำแหน่งในตัวเครื่อง",
    "เชื่อมระบบแจ้งเตือน/ติดตามสถานะ",
    "เสียงนำทางการกู้ชีพ",
  ],
};

// Specs shared by all four models — rendered as a simple label/value list.
export const primedicSharedSpecs: { label: string; value: string }[] = [
  { label: "ภาษาเสียงนำทาง CPR", value: "4 ภาษา (ไทย / อังกฤษ / จีน / เยอรมัน)" },
  { label: "หน้าจอแสดงสถานะ", value: "มี" },
  { label: "เสียงนำจังหวะกด CPR", value: "มี" },
  { label: "ปุ่ม Shock (กึ่งอัตโนมัติ)", value: "มี ทั้ง Y0 และ Y8" },
  { label: "ปุ่มเลือกโหมดเด็ก (Child)", value: "มี" },
  { label: "พลังงานผู้ใหญ่ (ค่าเริ่มต้น)", value: "200 → 300 → 360 J (escalating)" },
  { label: "พลังงานเด็ก (ค่าเริ่มต้น)", value: "50 → 70 → 100 J" },
  { label: "วิเคราะห์ถึงชาร์จ 200J พร้อม", value: "≤ 5 วินาที" },
  { label: "วิเคราะห์ถึงชาร์จ 360J พร้อม", value: "≤ 12 วินาที" },
  { label: "เปิดฝาเครื่องถึงชาร์จ 360J พร้อม", value: "≤ 14 วินาที" },
  { label: "จำนวนช็อกต่อแบต", value: "≥ 200 ครั้งที่ 360J (NRL01C)" },
  { label: "แบตเตอรี่", value: "LiMnO₂ 12V 4.2Ah แบบใช้แล้วทิ้ง (non-rechargeable)" },
  {
    label: "บันทึกข้อมูล",
    value: "SD card 16GB · ECG 10 ชม. · Event 2,000 · Audio log 2 ชม. · CPR data 10 ชม. · Self-test 3,650",
  },
  { label: "ถ่ายโอนข้อมูล", value: "USB 2.0" },
  { label: "แผ่นอิเล็กโทรด", value: "แบบใช้แล้วทิ้ง รองรับผู้ใหญ่และเด็ก (อายุ 3 ปี)" },
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

export const primedicDiffSpecs: PrimedicSpecRow[] = [
  {
    label: "เซ็นเซอร์ CPR feedback",
    values: {
      "primedic-y0": "optional",
      "primedic-y8": true,
    },
  },
  {
    label: "ราคา (ก่อน VAT)",
    values: {
      "primedic-y0": "฿39,900",
      "primedic-y8": "฿49,999",
    },
  },
];
