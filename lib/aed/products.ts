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

// Amoul i7 discontinued — Yuwell Y2 takes over the "i7" SKU slot (ids kept
// as-is for LeadForm/lead-validation/Merchant-feed/accounting continuity).
// Real specs from lib/aed/primedic.ts (primedicSharedSpecs) — same numbers
// as the "primedic-y2" catalog entry, never re-typed independently.
export const products: Product[] = [
  {
    id: "i7",
    name: "AED Yuwell Y2",
    subtitle: "รุ่นเรือธง · จอสี EKG",
    price: 59000,
    msrp: 89000,
    description:
      "จอสี EKG แสดงคุณภาพ CPR สด ๆ (ความเร็ว/ความลึก/full recoil) เหมาะสำหรับสำนักงาน โรงเรียน และหน่วยกู้ชีพที่ต้องการ CPR คุณภาพสูงสุด",
    features: [
      "น้ำหนัก ~2.5 กก. (รวมโมดูลพลังงานและแผ่น)",
      "เสียงแนะนำ 4 ภาษา (ไทย/อังกฤษ/จีน/เยอรมัน)",
      "Escalating 200-360J ผู้ใหญ่ · 50-100J เด็ก",
      "จอสี EKG + เซ็นเซอร์ CPR feedback มาตรฐาน",
    ],
    badge: "เรือธง",
  },
  {
    id: "i7-cabinet",
    name: "AED Yuwell Y2 + ตู้",
    subtitle: "รุ่นพร้อมตู้ติดผนัง",
    price: 64900,
    msrp: 99000,
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
    name: "AED Yuwell Y2 + แท่นตั้งพื้น",
    subtitle: "รุ่นแท่นตั้งพื้น",
    price: 68900,
    msrp: 109000,
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
  // ─── จุดได้เปรียบที่คู่แข่งบนมาร์เก็ตเพลสไม่มี (ตู้ · อบรม · อุปกรณ์สอน) ──────────
  // ขายแยกเป็น SKU เดี่ยวได้ → ดึงลีด + กินตลาดคนที่ซื้อเครื่องถูกจากที่อื่นแต่ยังต้อง
  // หาตู้/หาคนสอนเอง (ราคา "ก่อน VAT" เพื่อให้ตรงกับการแสดงผลบนหน้าเว็บ)
  {
    id: "training-course",
    name: "คอร์สอบรม CPR & AED (on-site)",
    subtitle: "บริการอบรม · สอนถึงที่",
    price: 8500,
    image: "/images/training-bls-1.jpg",
    description:
      "อบรมการช่วยชีวิตขั้นพื้นฐาน (CPR) และการใช้เครื่อง AED สอนถึงที่โดยทีมวิทยากรที่ผ่าน BLS Instructor ราคาเริ่มต้นต่อรุ่น (รองรับสูงสุด ~20 คน)",
    features: [
      "วิทยากรผ่าน BLS Instructor Course (มาตรฐานสากล)",
      "ภาคปฏิบัติกับหุ่นจริง + เครื่องฝึก AED",
      "ออกใบรับรองการอบรมให้ผู้เข้าร่วม",
      "ออกใบกำกับภาษีได้",
    ],
  },
  {
    id: "training-kit",
    name: "ชุดอุปกรณ์ฝึกสอน (AED Trainer)",
    subtitle: "อุปกรณ์ฝึกสอน",
    price: 2900,
    image: "/images/training-bls-2.jpg",
    description:
      "เครื่องฝึก AED (Trainer) สำหรับสาธิต/ฝึกซ้อม ไม่ปล่อยกระแสไฟจริง พร้อมแผ่นฝึกใช้ซ้ำได้ เหมาะกับองค์กรที่ต้องการฝึกซ้อมเป็นประจำ",
    features: [
      "ของแท้ พร้อมแผ่นฝึก (ใช้ซ้ำได้)",
      "ปลอดภัย ไม่ปล่อยไฟจริง เหมาะกับการฝึก",
      "ออกใบกำกับภาษีได้",
    ],
  },
  {
    id: "cabinet-wall",
    name: "ตู้แขวนผนัง AED (พร้อมสัญญาณเตือน)",
    subtitle: "ตู้จัดเก็บ",
    price: 5900,
    image: "/images/aed-wallcabinet.png",
    description:
      "ตู้ติดผนังมาตรฐานสำหรับเก็บเครื่อง AED พร้อมสัญญาณเตือนเมื่อเปิดตู้ ช่วยให้มองเห็นชัดและหยิบใช้ได้ทันทีเมื่อเกิดเหตุ",
    features: [
      "สัญญาณเตือนเมื่อเปิดตู้",
      "ติดตั้งง่าย มองเห็นชัด",
      "ใช้ได้กับ AED Amoul i7 และรุ่นทั่วไป",
    ],
  },
  {
    id: "cabinet-floor",
    name: "ตู้ตั้งพื้น AED (Stainless)",
    subtitle: "ตู้จัดเก็บ",
    price: 9900,
    image: "/images/aed-floorstand.png",
    description:
      "แท่น/ตู้ตั้งพื้นสแตนเลส สำหรับพื้นที่เปิดโล่งหรือจุดที่ติดผนังไม่ได้ เคลื่อนย้ายและมองเห็นได้ชัดเจน",
    features: [
      "สแตนเลส แข็งแรง ทนทาน",
      "เหมาะกับพื้นที่เปิดโล่ง / ล็อบบี้ / โรงงาน",
      "เคลื่อนย้ายตำแหน่งได้",
    ],
  },
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
  // ─── อะไหล่ PRIMEDIC — ราคาจะใส่ทีหลัง (price: null) ───────────────────────────
  {
    id: "primedic-pad",
    name: "แผ่นนำไฟฟ้า (Pad) PRIMEDIC HeartSave",
    subtitle: "อะไหล่ PRIMEDIC / วัสดุสิ้นเปลือง",
    price: null,
    priceLabel: "สอบถามราคา",
    image: "/images/primedic-pads-y8.png",
    description: "แผ่นอิเล็กโทรดแบบใช้แล้วทิ้งสำหรับเครื่อง PRIMEDIC HeartSave (รองรับผู้ใหญ่และเด็ก)",
    features: [
      "ของแท้ PRIMEDIC",
      "รองรับผู้ใหญ่และเด็ก (อายุ 3 ปีขึ้นไป)",
      "แนะนำเปลี่ยนตามวันหมดอายุที่ระบุบนซอง",
    ],
  },
  {
    id: "primedic-battery",
    name: "ชุดพลังงาน (Battery) PRIMEDIC HeartSave",
    subtitle: "อะไหล่ PRIMEDIC",
    price: null,
    priceLabel: "สอบถามราคา",
    image: "/images/primedic-battery-nrl01c.png",
    description: "โมดูลพลังงานสำรอง / เปลี่ยนทดแทน สำหรับเครื่อง PRIMEDIC HeartSave",
    features: [
      "ของแท้ PRIMEDIC",
      "LiMnO₂ แบบใช้แล้วทิ้ง",
      "พร้อมใช้งานทันที",
    ],
  },
];
