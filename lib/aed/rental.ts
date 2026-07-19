import { AMOUL_REGULATORY, regLine } from "./regulatory";
import {
  faqRentToOwnVsRental,
  faqMidContractCancel,
  faqSwitchPackage,
  type FaqCategory,
} from "./faqs";

export type RentalPlan = {
  id: string;
  subtitle: string;
  name: string;
  price: number;
  unit: string;
  deposit: string;
  features: string[];
  badge: string;
  // Plan thumbnail (public path) — shared by RentalSpotlight and /aed/rental cards.
  image: string;
};

export const rentalPlans: RentalPlan[] = [
  {
    id: "rent-event",
    subtitle: "อีเวนต์ / รายวัน",
    name: "แผนอีเวนต์ (EVENT)",
    price: 1500,
    unit: "/ วันแรก",
    deposit: "บัตรเครดิต hold ฿30,000 หรือเงินสด ฿25,000",
    features: [
      "วันถัดไป ฿900/วัน",
      "ส่ง-รับถึงงาน (คิดตามระยะทาง)",
      "เหมาะกับมาราธอน คอนเสิร์ต งานกีฬา กองถ่าย",
      "พร้อมแผ่นอิเล็กโทรด + แบตเตอรี่",
    ],
    badge: "",
    image: "/images/aed-rent-daily.jpg",
  },
  {
    id: "rent-annual",
    subtitle: "รายปี — คุ้มที่สุด",
    name: "แผนรายปี (ANNUAL)",
    price: 22000,
    unit: "/ ปี",
    deposit: "฿5,000 (ยกเว้นได้ถ้ามี PO)",
    features: [
      "เฉลี่ยเพียง ~฿1,830/เดือน",
      "รวมส่ง+ติดตั้ง + อบรมใช้งาน 1 ครั้ง",
      "เช็กสภาพปีละ 1 ครั้ง + เครื่องสำรองถ้าเสีย",
      "เปลี่ยนแผ่นให้ฟรีหากใช้ช่วยชีวิตจริง",
    ],
    badge: "คุ้มที่สุด",
    image: "/images/aed-rent-yearly.jpg",
  },
  {
    id: "rent-flex",
    subtitle: "รายเดือน",
    name: "แผนยืดหยุ่น (FLEX)",
    price: 1990,
    unit: "/ เดือน",
    deposit: "฿10,000 (นิติบุคคล ฿7,000)",
    features: [
      "ขั้นต่ำ 3 เดือน",
      "เหมาะกับออฟฟิศชั่วคราว ไซต์งาน ทดลองใช้",
      "ค่าเช่าที่จ่ายแล้วหักเป็นส่วนลดเมื่อแปลงเป็นรายปี",
      "พร้อมแผ่นอิเล็กโทรด + แบตเตอรี่",
    ],
    badge: "",
    image: "/images/aed-rent-monthly.jpg",
  },
];

export type EventPackage = {
  id: string;
  name: string;
  nameTh: string;
  duration: string;
  price: number;
  priceNote: string;
};

export const eventPackages: EventPackage[] = [
  {
    id: "event-day",
    name: "DAY",
    nameTh: "วันเดียว",
    duration: "1 วัน",
    price: 1500,
    priceNote: "วันแรก ฿1,500 + วันถัดไป ฿900/วัน",
  },
  {
    id: "event-weekend",
    name: "WEEKEND",
    nameTh: "สุดสัปดาห์",
    duration: "ศุกร์–อาทิตย์ 3 วัน",
    price: 3500,
    priceNote: "flat ฿3,500",
  },
  {
    id: "event-weekly",
    name: "WEEKLY",
    nameTh: "รายสัปดาห์",
    duration: "7 วัน",
    price: 6000,
    priceNote: "flat ฿6,000",
  },
  {
    id: "event-extended",
    name: "EXTENDED",
    nameTh: "ยาวพิเศษ",
    duration: "14 วัน",
    price: 10000,
    priceNote: "flat ฿10,000",
  },
];

export type MultiUnitTier = {
  units: string;
  pricePerUnit: number;
  badge?: string;
};

export const multiUnitPricing: MultiUnitTier[] = [
  { units: "1 เครื่อง", pricePerUnit: 22000 },
  { units: "2–4 เครื่อง", pricePerUnit: 20000, badge: "ประหยัด" },
  { units: "5+ เครื่อง", pricePerUnit: 18000, badge: "ราคาพิเศษองค์กร" },
];

// Why renting is safe to say yes to — each point restates a commitment already
// made in rentalPlans/rentalFaqs (never promise here what those don't back up).
export type RentalTrustSignal = { icon: string; text: string };

export const rentalTrustSignals: RentalTrustSignal[] = [
  { icon: "🔁", text: "เครื่องสำรองเปลี่ยนให้ใน 24–48 ชม. ถ้าเครื่องเสีย" },
  { icon: "🩹", text: "ใช้ช่วยชีวิตจริง — เปลี่ยนแผ่นให้ฟรี" },
  { icon: "✅", text: regLine(AMOUL_REGULATORY) },
  { icon: "💰", text: "มัดจำคืนเต็มจำนวนเมื่อคืนเครื่องครบสภาพ" },
];

// ─── เช่าซื้อ (Rent-to-Own) ────────────────────────────────────────────────────
// ตัวเลข mirror acquisitionPackages (./packages.ts) priceNote — แก้ต้องแก้คู่กัน.
// ยอดรวมทั้งสัญญา derive ด้วย rentToOwnTotal เสมอ ไม่พิมพ์ซ้ำ.

export type RentToOwnBreakdown = {
  packageId: "pkg-start-y8" | "pkg-start-y2"; // must exist in acquisitionPackages
  model: string;
  deposit: number;
  monthly: number;
  months: number;
  cashPrice: number; // ราคาซื้อสดของรุ่นเดียวกัน (จาก primedicModels)
  cashPriceLabel: string;
};

export const rentToOwnTotal = (b: RentToOwnBreakdown) => b.deposit + b.monthly * b.months;

export const rentToOwnBreakdowns: RentToOwnBreakdown[] = [
  {
    // 16,000 + 2,600 × 18 = ฿62,800 (≈1.40× ราคาสด — owner approved 2026-07-19)
    packageId: "pkg-start-y8",
    model: "Yuwell Y8",
    deposit: 16_000,
    monthly: 2_600,
    months: 18,
    cashPrice: 44_900,
    cashPriceLabel: "ซื้อสด Y8 ฿44,900",
  },
  {
    // 22,000 + 3,400 × 18 = ฿83,200 (≈1.39× ราคาสด 59,999)
    packageId: "pkg-start-y2",
    model: "Yuwell Y2",
    deposit: 22_000,
    monthly: 3_400,
    months: 18,
    cashPrice: 59_999,
    cashPriceLabel: "ซื้อสด Y2 ฿59,999",
  },
];

// ─── ตารางเปรียบเทียบ เช่า / เช่าซื้อ / ซื้อขาด ───────────────────────────────
// ตัวเลขอ้างจาก rentalPlans (เช่า), rentToOwnBreakdowns (เช่าซื้อ) และ
// acquisitionPackages pkg-premium (ซื้อขาดเงินสด ฿42,900) — ห้ามใส่ราคาใหม่ที่นี่.

export type AcquisitionCompareRow = {
  dimension: string;
  rent: string;
  rentToOwn: string;
  buy: string;
};

export const acquisitionComparison: AcquisitionCompareRow[] = [
  {
    dimension: "เงินก้อนแรก",
    rent: "มัดจำ ฿5,000–10,000 (คืนได้)",
    rentToOwn: "มัดจำ ฿16,000–22,000 (นับเป็นค่าเครื่อง)",
    buy: "จ่ายเต็ม เงินสด ฿42,900",
  },
  {
    dimension: "ค่าใช้จ่ายต่อเดือน",
    rent: "เริ่ม ฿1,990 (รายปีเฉลี่ย ~฿1,830)",
    rentToOwn: "฿2,600–3,400 × 18 เดือน",
    buy: "ไม่มี (มีค่าวัสดุสิ้นเปลืองเมื่อหมดอายุ)",
  },
  {
    dimension: "กรรมสิทธิ์เมื่อจบสัญญา",
    rent: "คืนเครื่อง",
    rentToOwn: "เครื่องเป็นของท่าน ไม่มีค่าใช้จ่ายเพิ่ม",
    buy: "เป็นเจ้าของตั้งแต่วันแรก",
  },
  {
    dimension: "การดูแลรักษา",
    rent: "ทีมเราดูแลตลอดสัญญา",
    rentToOwn: "ตรวจเช็คเบื้องต้น + ประกันโรงงาน",
    buy: "ดูแลเอง (เลือกซื้อบริการเสริมได้)",
  },
  {
    dimension: "ระยะสัญญา",
    rent: "รายวัน · รายเดือน (ขั้นต่ำ 3 เดือน) · รายปี",
    rentToOwn: "18 เดือน",
    buy: "—",
  },
  {
    dimension: "เหมาะกับ",
    rent: "อีเวนต์ · ไซต์งาน · องค์กรที่ไม่อยากลงทุนก้อนใหญ่",
    rentToOwn: "SME ที่อยากเป็นเจ้าของแต่สภาพคล่องจำกัด",
    buy: "องค์กรที่มีงบลงทุน (CAPEX)",
  },
];

export const rentalFaqs = [
  {
    question: "เช่า AED ต้องวางมัดจำเท่าไหร่?",
    answer:
      "แผนรายปี (ANNUAL) มัดจำ ฿5,000 (ยกเว้นได้หากเป็นองค์กรที่มีใบสั่งซื้อ/PO) · แผนยืดหยุ่น (FLEX) มัดจำ ฿10,000 (นิติบุคคล ฿7,000) · แผนอีเวนต์ (EVENT) วางบัตรเครดิต hold ฿30,000 หรือมัดจำเงินสด ฿25,000 มัดจำคืนเต็มจำนวนเมื่อคืนเครื่องครบสภาพ",
  },
  {
    question: "แผนยืดหยุ่น (FLEX) มีขั้นต่ำกี่เดือน?",
    answer:
      "ขั้นต่ำ 3 เดือน เริ่ม ฿1,990/เดือน หากใช้ครบปีแนะนำเปลี่ยนเป็นแผนรายปี (ANNUAL) ฿22,000 จะคุ้มกว่า และค่าเช่าที่จ่ายมาแล้วนำมาหักเป็นส่วนลดได้",
  },
  {
    question: "ถ้าเครื่องชำรุดหรือสูญหายระหว่างเช่าทำอย่างไร?",
    answer:
      "หากเครื่องชำรุดจากการใช้งานปกติ เรามีเครื่องสำรองเปลี่ยนให้ภายใน 24–48 ชม. แต่หากสูญหายหรือเสียหายจากการใช้งานผิดวิธี ผู้เช่าชดใช้ตามมูลค่าทดแทน (เครื่อง ~30,000 · แผ่น ~2,000 · แบต ~5,000) โดยหักจากมัดจำก่อน",
  },
  {
    question: "ใช้ช็อตช่วยชีวิตจริงแล้วต้องเปลี่ยนแผ่นไหม?",
    answer:
      "ต้องเปลี่ยนแผ่นอิเล็กโทรดชุดใหม่ทุกครั้งหลังใช้งานจริง สำหรับแผนรายปี/แผนยืดหยุ่นเราเปลี่ยนแผ่นให้ฟรี ส่วนแผนอีเวนต์คิดค่าแผ่นตามจริง",
  },
  {
    question: "AED ที่ให้เช่าผ่าน อย. หรือไม่?",
    answer:
      "ผ่านครับ เป็นรุ่น AED Yuwell/PRIMEDIC HeartSave Y2 ทะเบียน อย. 65-2-2-2-0013415 มาตรฐาน ISO 13485 · CE แผ่นอิเล็กโทรดแบบใช้แล้วทิ้ง อายุ 3 ปี แบตเตอรี่ LiMnO₂ ใช้ครั้งเดียว (non-rechargeable)",
  },
];

// FAQ ของหน้า /aed/rental แบ่งสองหมวด — หมวดเช่าซื้อ reuse copy ที่ owner อนุมัติ
// แล้วจาก ./faqs.ts (อ้างอิง ไม่ก็อป).
export const rentalFaqCategories: FaqCategory[] = [
  { category: "เช่า AED (รายวัน / รายเดือน / รายปี)", items: rentalFaqs },
  {
    category: "เช่าซื้อ — เช่าแล้วได้ซื้อ (Rent-to-Own)",
    items: [faqRentToOwnVsRental, faqMidContractCancel, faqSwitchPackage],
  },
];
