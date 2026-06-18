export type Product = {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  msrp: number;
  description: string;
  features: string[];
  badge: string | null;
};

export const products: Product[] = [
  {
    id: "i7",
    name: "AED Amoul i7",
    subtitle: "รุ่นมาตรฐาน",
    price: 39999,
    msrp: 70000,
    description: "เหมาะสำหรับสำนักงาน โรงเรียน และสถานที่ทั่วไป",
    features: [
      "น้ำหนัก ~ 2 กก. (รวมแบตเตอรี่)",
      "เสียงแนะนำ 5 ภาษา (TH/EN/CN/ES/IT)",
      "Escalating 100-360J ผู้ใหญ่ · 10-100J เด็ก",
      "Standalone — ไม่ต้องเชื่อมต่อก็ใช้งานได้",
    ],
    badge: null,
  },
  {
    id: "i7-cabinet",
    name: "AED Amoul i7 + ตู้",
    subtitle: "รุ่นพร้อมตู้ติดผนัง",
    price: 44999,
    msrp: 80000,
    description: "ครบชุด พร้อมตู้ติดผนังและสัญญาณเตือน",
    features: [
      "ครบชุดพร้อมติดตั้ง",
      "ตู้กันฝุ่นกันน้ำ IP65",
      "สัญญาณเตือนเปิดตู้",
    ],
    badge: "ยอดนิยม",
  },
  {
    id: "i7-floor",
    name: "AED Amoul i7 + แท่นตั้งพื้น",
    subtitle: "รุ่นแท่นตั้งพื้น",
    price: 49000,
    msrp: 90000,
    description: "เคลื่อนย้ายได้ เหมาะสำหรับสถานที่ขนาดใหญ่",
    features: [
      "เคลื่อนย้ายได้สะดวก",
      "แท่นตั้งพื้นมั่นคง",
      "มองเห็นได้ชัด",
    ],
    badge: null,
  },
];

// ─── อุปกรณ์เสริม / อะไหล่ ──────────────────────────────────────────────────────

export type Accessory = {
  id: string;
  name: string;
  subtitle: string;
  // ราคาก่อน VAT. null = ยังไม่กำหนดราคา (โชว์ priceLabel แทน — สำหรับอะไหล่ PRIMEDIC
  // ที่เจ้าของจะใส่ราคาทีหลัง)
  price: number | null;
  priceLabel?: string; // ข้อความแทนราคาเมื่อ price เป็น null
  image: string; // path ใต้ /public
  description: string;
  features: string[];
};

export const accessories: Accessory[] = [
  {
    id: "pad-adult",
    name: "แผ่นนำไฟฟ้า (Pad) สำหรับผู้ใหญ่",
    subtitle: "อะไหล่ Amoul i7 / วัสดุสิ้นเปลือง",
    price: 5000,
    image: "/images/accessory-pad.jpg",
    description: "แผ่นแปะนำไฟฟ้าสำหรับผู้ใหญ่ ใช้กับเครื่อง AED Amoul i7",
    features: [
      "ของแท้ Ambul (REF 1.129.00201)",
      "สำหรับผู้ใหญ่",
      "แนะนำเปลี่ยนตามวันหมดอายุที่ระบุบนซอง",
    ],
  },
  {
    id: "battery",
    name: "แบตเตอรี่ AED Amoul i7",
    subtitle: "อะไหล่ Amoul i7",
    price: 7500,
    image: "/images/accessory-battery.jpg",
    description: "แบตเตอรี่สำรอง / เปลี่ยนทดแทน สำหรับเครื่อง AED Amoul i7",
    features: [
      "ของแท้ Ambul",
      "ลิเธียม อายุการใช้งานยาวนาน",
      "พร้อมใช้งานทันที",
    ],
  },
  // ─── อะไหล่ PRIMEDIC HeartSave (Yuwell Y8) ───────────────────────────────────
  {
    id: "primedic-pad",
    name: "แผ่นนำไฟฟ้า (Pad) Yuwell HeartSave Y8",
    subtitle: "อะไหล่ PRIMEDIC HeartSave Y8 / วัสดุสิ้นเปลือง",
    price: 4000,
    image: "/images/yuwell-pad.png",
    description: "แผ่นอิเล็กโทรดแบบใช้แล้วทิ้งสำหรับเครื่อง Yuwell PRIMEDIC HeartSave Y8 (รองรับผู้ใหญ่และเด็ก) — แบบไม่มีเซ็นเซอร์ CPR feedback",
    features: [
      "ของแท้ Yuwell (PRIMEDIC)",
      "รองรับผู้ใหญ่และเด็ก (อายุ 3 ปีขึ้นไป)",
      "แนะนำเปลี่ยนตามวันหมดอายุที่ระบุบนซอง",
    ],
  },
  {
    id: "primedic-pad-feedback",
    name: "แผ่นนำไฟฟ้า (Pad) Yuwell HeartSave Y8 + CPR Feedback",
    subtitle: "อะไหล่ PRIMEDIC HeartSave Y8 / วัสดุสิ้นเปลือง",
    price: 5000,
    image: "/images/yuwell-pad-feedback.jpg",
    description: "แผ่นอิเล็กโทรดพร้อมเซ็นเซอร์ CPR feedback สำหรับเครื่อง Yuwell PRIMEDIC HeartSave Y8 — วัดแรงและจังหวะกดหน้าอกแบบเรียลไทม์",
    features: [
      "ของแท้ Yuwell (PRIMEDIC)",
      "มีเซ็นเซอร์ CPR feedback ในตัว",
      "รองรับผู้ใหญ่และเด็ก (อายุ 3 ปีขึ้นไป)",
      "แนะนำเปลี่ยนตามวันหมดอายุที่ระบุบนซอง",
    ],
  },
  {
    id: "primedic-battery",
    name: "แบตเตอรี่ Yuwell HeartSave Y8 (NRL01C)",
    subtitle: "อะไหล่ PRIMEDIC HeartSave Y8",
    price: 8000,
    image: "/images/yuwell-battery.jpg",
    description: "โมดูลพลังงานสำรอง / เปลี่ยนทดแทน สำหรับเครื่อง Yuwell PRIMEDIC HeartSave Y8 — รุ่น NRL01C 12V 4.2Ah",
    features: [
      "ของแท้ Yuwell (PRIMEDIC) รุ่น NRL01C",
      "LiMnO₂ 12V 4.2Ah แบบใช้แล้วทิ้ง",
      "≥ 200 ครั้งที่ 360J ต่อแบตเตอรี่",
      "พร้อมใช้งานทันที",
    ],
  },
];
