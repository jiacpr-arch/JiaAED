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

export type PrimedicModelId =
  | "primedic-y0"
  | "primedic-y8"
  | "primedic-ya0"
  | "primedic-ya8";

export type PrimedicModel = {
  id: PrimedicModelId;
  name: string;
  // Y0/Y8 keep a manual Shock button (semi-automatic); YA0/YA8 deliver the shock
  // automatically (no Shock button).
  shockMode: "semi-auto" | "auto";
  // Y8/YA8 ship with the CPR feedback sensor as standard; Y0/YA0 make it optional.
  cprFeedback: "standard" | "optional";
  summary: string;
  image: string; // TODO(owner): real PRIMEDIC product photos
  badge: string | null;
};

export const primedicModels: PrimedicModel[] = [
  {
    id: "primedic-y0",
    name: "HeartSave Y0",
    shockMode: "semi-auto",
    cprFeedback: "optional",
    summary: "รุ่นกึ่งอัตโนมัติ (มีปุ่ม Shock) — เริ่มต้นคุ้มค่า",
    image: "/images/primedic-heartsave.png",
    badge: null,
  },
  {
    id: "primedic-y8",
    name: "HeartSave Y8",
    shockMode: "semi-auto",
    cprFeedback: "standard",
    summary: "กึ่งอัตโนมัติ + เซ็นเซอร์ CPR feedback มาตรฐาน",
    image: "/images/primedic-heartsave.png",
    badge: "แนะนำ",
  },
  {
    id: "primedic-ya0",
    name: "HeartSave YA0",
    shockMode: "auto",
    cprFeedback: "optional",
    summary: "อัตโนมัติเต็มระบบ (ไม่มีปุ่ม Shock)",
    image: "/images/primedic-open.png",
    badge: null,
  },
  {
    id: "primedic-ya8",
    name: "HeartSave YA8",
    shockMode: "auto",
    cprFeedback: "standard",
    summary: "อัตโนมัติเต็มระบบ + เซ็นเซอร์ CPR feedback มาตรฐาน",
    image: "/images/primedic-open.png",
    badge: "ออโต้เต็มระบบ",
  },
];

// Specs shared by all four models — rendered as a simple label/value list.
export const primedicSharedSpecs: { label: string; value: string }[] = [
  { label: "ภาษาเสียงนำทาง CPR", value: "4 ภาษา (ไทย / อังกฤษ / จีน / เยอรมัน)" },
  { label: "หน้าจอแสดงสถานะ", value: "มี" },
  { label: "เสียงนำจังหวะกด CPR", value: "มี" },
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
    label: "ปุ่ม Shock (กึ่งอัตโนมัติ)",
    values: {
      "primedic-y0": true,
      "primedic-y8": true,
      "primedic-ya0": false,
      "primedic-ya8": false,
    },
  },
  {
    label: "ช็อกอัตโนมัติ (ไม่มีปุ่ม Shock)",
    values: {
      "primedic-y0": false,
      "primedic-y8": false,
      "primedic-ya0": true,
      "primedic-ya8": true,
    },
  },
  {
    label: "เซ็นเซอร์ CPR feedback",
    values: {
      "primedic-y0": "optional",
      "primedic-y8": true,
      "primedic-ya0": "optional",
      "primedic-ya8": true,
    },
  },
  {
    label: "ปุ่มเลือกโหมดเด็ก (Child)",
    values: {
      "primedic-y0": true,
      "primedic-y8": true,
      "primedic-ya0": true,
      "primedic-ya8": true,
    },
  },
];
