import { PRIMEDIC_REGULATORY, fdaLine, regLine } from "./regulatory";
import { consumableLifetimeText, primedicModels } from "./primedic";
import { RENT_TO_OWN_TERMS, SAFETY_PREMIUM_PRICING } from "./packages";
import {
  faqRentToOwnVsRental,
  faqMidContractCancel,
  faqSwitchPackage,
  type FaqCategory,
} from "./faqs";

const thb = (n: number) => `฿${n.toLocaleString("th-TH")}`;
// "฿5,000–30,000", or a single price when both ends match.
const thbRange = (lo: number, hi: number) =>
  lo === hi ? thb(lo) : `${thb(lo)}–${hi.toLocaleString("th-TH")}`;

// ─── Rental prices & deposits ─────────────────────────────────────────────────
// Every rental number lives here once; the plan cards, FAQs, comparison table,
// bots and the price-guide article all read from these constants.
export const RENTAL_PRICES = {
  eventFirstDay: 1_500,
  eventNextDay: 900,
  annual: 22_000,
  flexMonthly: 1_990,
  flexMinMonths: 3,
} as const;

// Training on the rental plans, as the owner's rental comparison table and
// flyers state it (Jun 2026) — a Sep 2026 annual quotation also says on-site
// training isn't included: monthly and annual include the free Mini Course at
// the JIA training centre, on-site training is extra, and an event rental gets
// a usage briefing only. Cards, bots and the price-guide article read these.
export const RENTAL_TRAINING = {
  included: "อบรมฟรี CPR & AED Mini Course 5–7 ท่าน (E-Certificate) ที่ The Street รัชดา",
  onSite: `อบรมนอกสถานที่ ${thb(4_000)} + ค่าเดินทาง`,
  event: "แนะนำการใช้งานเบื้องต้น (ไม่ใช่คอร์สอบรม)",
} as const;

const DEPOSITS = {
  eventCardHold: 30_000,
  eventCash: 25_000,
  annual: 5_000,
  flex: 10_000,
  flexCorporate: 7_000,
} as const;

export type RentalPlan = {
  id: string;
  subtitle: string;
  name: string;
  price: number;
  unit: string;
  deposit: string;
  // Lowest/highest deposit behind `deposit`, so summary ranges can't drift.
  depositRange: [number, number];
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
    price: RENTAL_PRICES.eventFirstDay,
    unit: "/ วันแรก",
    deposit: `บัตรเครดิต hold ${thb(DEPOSITS.eventCardHold)} หรือเงินสด ${thb(DEPOSITS.eventCash)}`,
    depositRange: [DEPOSITS.eventCash, DEPOSITS.eventCardHold],
    features: [
      `วันถัดไป ${thb(RENTAL_PRICES.eventNextDay)}/วัน`,
      "ส่ง-รับถึงงาน (คิดตามระยะทาง)",
      "เหมาะกับมาราธอน คอนเสิร์ต งานกีฬา กองถ่าย",
      "พร้อมแผ่นอิเล็กโทรด + แบตเตอรี่",
      RENTAL_TRAINING.event,
    ],
    badge: "",
    image: "/images/primedic-kit.png",
  },
  {
    id: "rent-annual",
    subtitle: "รายปี — คุ้มที่สุด",
    name: "แผนรายปี (ANNUAL)",
    price: RENTAL_PRICES.annual,
    unit: "/ ปี",
    deposit: `${thb(DEPOSITS.annual)} (ยกเว้นได้ถ้ามี PO)`,
    depositRange: [DEPOSITS.annual, DEPOSITS.annual],
    features: [
      `เฉลี่ยเพียง ~${thb(Math.round(RENTAL_PRICES.annual / 12 / 10) * 10)}/เดือน`,
      "รวมส่ง+ติดตั้ง",
      RENTAL_TRAINING.included,
      RENTAL_TRAINING.onSite,
      "เช็กสภาพปีละ 1 ครั้ง + เครื่องสำรองถ้าเสีย",
      "เปลี่ยนแผ่นให้ฟรีหากใช้ช่วยชีวิตจริง",
    ],
    badge: "คุ้มที่สุด",
    image: "/images/primedic-y2-open.jpg",
  },
  {
    id: "rent-flex",
    subtitle: "รายเดือน",
    name: "แผนยืดหยุ่น (FLEX)",
    price: RENTAL_PRICES.flexMonthly,
    unit: "/ เดือน",
    deposit: `${thb(DEPOSITS.flex)} (นิติบุคคล ${thb(DEPOSITS.flexCorporate)})`,
    depositRange: [DEPOSITS.flexCorporate, DEPOSITS.flex],
    features: [
      `ขั้นต่ำ ${RENTAL_PRICES.flexMinMonths} เดือน`,
      "เหมาะกับออฟฟิศชั่วคราว ไซต์งาน ทดลองใช้",
      "ค่าเช่าที่จ่ายแล้วหักเป็นส่วนลดเมื่อแปลงเป็นรายปี",
      "พร้อมแผ่นอิเล็กโทรด + แบตเตอรี่",
      RENTAL_TRAINING.included,
      RENTAL_TRAINING.onSite,
    ],
    badge: "",
    image: "/images/yuwell-y2-main.jpg",
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
    price: RENTAL_PRICES.eventFirstDay,
    priceNote: `วันแรก ${thb(RENTAL_PRICES.eventFirstDay)} + วันถัดไป ${thb(RENTAL_PRICES.eventNextDay)}/วัน`,
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
  { units: "1 เครื่อง", pricePerUnit: RENTAL_PRICES.annual },
  { units: "2–4 เครื่อง", pricePerUnit: 20000, badge: "ประหยัด" },
  { units: "5+ เครื่อง", pricePerUnit: 18000, badge: "ราคาพิเศษองค์กร" },
];

// Why renting is safe to say yes to — each point restates a commitment already
// made in rentalPlans/rentalFaqs (never promise here what those don't back up).
export type RentalTrustSignal = { icon: string; text: string };

export const rentalTrustSignals: RentalTrustSignal[] = [
  { icon: "🔁", text: "เครื่องสำรองเปลี่ยนให้ใน 24–48 ชม. ถ้าเครื่องเสีย" },
  { icon: "🩹", text: "ใช้ช่วยชีวิตจริง — เปลี่ยนแผ่นให้ฟรี" },
  { icon: "✅", text: regLine(PRIMEDIC_REGULATORY) },
  { icon: "💰", text: "มัดจำคืนเต็มจำนวนเมื่อคืนเครื่องครบสภาพ" },
];

// ─── เช่าซื้อ (Rent-to-Own) ────────────────────────────────────────────────────
// มัดจำ/ค่างวด/จำนวนงวด มาจาก RENT_TO_OWN_TERMS (./packages.ts) และราคาซื้อสด
// มาจาก primedicModels — ที่นี่ไม่มีตัวเลขพิมพ์เอง. ยอดรวมทั้งสัญญา derive ด้วย
// rentToOwnTotal เสมอ.

export type RentToOwnBreakdown = {
  packageId: keyof typeof RENT_TO_OWN_TERMS; // must exist in acquisitionPackages
  model: string;
  deposit: number;
  monthly: number;
  months: number;
  cashPrice: number; // ราคาซื้อสดของรุ่นเดียวกัน (จาก primedicModels)
  cashPriceLabel: string;
};

export const rentToOwnTotal = (b: RentToOwnBreakdown) => b.deposit + b.monthly * b.months;

function rentToOwnBreakdown(
  packageId: RentToOwnBreakdown["packageId"],
  modelId: "primedic-y8" | "primedic-y2",
  model: string,
  shortName: string,
): RentToOwnBreakdown {
  const cashPrice = primedicModels.find((m) => m.id === modelId)!.price;
  return {
    packageId,
    model,
    ...RENT_TO_OWN_TERMS[packageId],
    cashPrice,
    cashPriceLabel: `ซื้อสด ${shortName} ${thb(cashPrice)}`,
  };
}

export const rentToOwnBreakdowns: RentToOwnBreakdown[] = [
  rentToOwnBreakdown("pkg-start-y8", "primedic-y8", "Yuwell Y8", "Y8"),
  rentToOwnBreakdown("pkg-start-y2", "primedic-y2", "Yuwell Y2", "Y2"),
];

// ─── ตารางเปรียบเทียบ เช่า / เช่าซื้อ / ซื้อขาด ───────────────────────────────
// ตัวเลขทุกช่อง derive จาก rentalPlans (เช่า), rentToOwnBreakdowns (เช่าซื้อ) และ
// SAFETY_PREMIUM_PRICING (ซื้อขาด) — ห้ามพิมพ์ราคาใหม่ที่นี่.

export type AcquisitionCompareRow = {
  dimension: string;
  rent: string;
  rentToOwn: string;
  buy: string;
};

const rentDepositLo = Math.min(...rentalPlans.map((p) => p.depositRange[0]));
const rentDepositHi = Math.max(...rentalPlans.map((p) => p.depositRange[1]));
const rtoDeposits = rentToOwnBreakdowns.map((b) => b.deposit);
const rtoMonthly = rentToOwnBreakdowns.map((b) => b.monthly);
const rtoMonths = rentToOwnBreakdowns.map((b) => b.months);
const rtoMonthsLabel =
  Math.min(...rtoMonths) === Math.max(...rtoMonths)
    ? `${rtoMonths[0]}`
    : `${Math.min(...rtoMonths)}–${Math.max(...rtoMonths)}`;

export const acquisitionComparison: AcquisitionCompareRow[] = [
  {
    dimension: "เงินก้อนแรก",
    rent: `มัดจำ ${thbRange(rentDepositLo, rentDepositHi)} ตามแผน (คืนได้)`,
    rentToOwn: `มัดจำ ${thbRange(Math.min(...rtoDeposits), Math.max(...rtoDeposits))} (นับเป็นค่าเครื่อง)`,
    buy: `จ่ายเต็ม เงินสด ${thb(SAFETY_PREMIUM_PRICING.cash)}`,
  },
  {
    dimension: "ค่าใช้จ่ายต่อเดือน",
    rent: `เริ่ม ${thb(RENTAL_PRICES.flexMonthly)}/เดือน`,
    rentToOwn: `${thbRange(Math.min(...rtoMonthly), Math.max(...rtoMonthly))} × ${rtoMonthsLabel} เดือน`,
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
    rent: `รายวัน · รายเดือน (ขั้นต่ำ ${RENTAL_PRICES.flexMinMonths} เดือน) · รายปี`,
    rentToOwn: `${rtoMonthsLabel} เดือน`,
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
    answer: `แผนรายปี (ANNUAL) มัดจำ ${thb(DEPOSITS.annual)} (ยกเว้นได้หากเป็นองค์กรที่มีใบสั่งซื้อ/PO) · แผนยืดหยุ่น (FLEX) มัดจำ ${thb(DEPOSITS.flex)} (นิติบุคคล ${thb(DEPOSITS.flexCorporate)}) · แผนอีเวนต์ (EVENT) วางบัตรเครดิต hold ${thb(DEPOSITS.eventCardHold)} หรือมัดจำเงินสด ${thb(DEPOSITS.eventCash)} มัดจำคืนเต็มจำนวนเมื่อคืนเครื่องครบสภาพ`,
  },
  {
    question: "แผนยืดหยุ่น (FLEX) มีขั้นต่ำกี่เดือน?",
    answer: `ขั้นต่ำ ${RENTAL_PRICES.flexMinMonths} เดือน เริ่ม ${thb(RENTAL_PRICES.flexMonthly)}/เดือน หากใช้ครบปีแนะนำเปลี่ยนเป็นแผนรายปี (ANNUAL) ${thb(RENTAL_PRICES.annual)} จะคุ้มกว่า และค่าเช่าที่จ่ายมาแล้วนำมาหักเป็นส่วนลดได้`,
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
    answer: PRIMEDIC_REGULATORY.published
      ? `ผ่านครับ เป็นรุ่น AED Yuwell/PRIMEDIC HeartSave Y2 ทะเบียน ${fdaLine(PRIMEDIC_REGULATORY)} มาตรฐาน ISO 13485 · CE แผ่นอิเล็กโทรดแบบใช้แล้วทิ้ง แบตเตอรี่ LiMnO₂ ใช้ครั้งเดียว (non-rechargeable) — ${consumableLifetimeText}`
      : `เป็นรุ่น AED Yuwell/PRIMEDIC HeartSave Y2 มาตรฐาน ISO 13485 · CE — ${PRIMEDIC_REGULATORY.pendingNote}`,
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

// ─── Prompt block สำหรับบอท (LINE bot + web chat) ─────────────────────────────
// สร้างจากข้อมูลแผนจริงด้านบนทั้งหมด — แก้ราคา/เงื่อนไขที่ data แล้ว prompt
// ของทั้งสองบอทอัปเดตตามเอง ห้ามพิมพ์ตัวเลขซ้ำในไฟล์ prompt.

export function rentalKnowledgeBlock(): string {
  const plans = rentalPlans
    .map(
      (p) =>
        `• ${p.name} — ${thb(p.price)}${p.unit} · มัดจำ ${p.deposit}\n  ${p.features.join(" · ")}`,
    )
    .join("\n");

  const events = eventPackages
    .map((e) => `• ${e.nameTh} (${e.duration}): ${e.priceNote}`)
    .join("\n");

  const multi = multiUnitPricing
    .map(
      (t) =>
        `• ${t.units}: ${thb(t.pricePerUnit)}/เครื่อง/ปี${t.badge ? ` (${t.badge})` : ""}`,
    )
    .join("\n");

  const rto = rentToOwnBreakdowns
    .map(
      (b) =>
        `• ${b.model}: มัดจำ ${thb(b.deposit)} + ${thb(b.monthly)}/เดือน × ${b.months} งวด = รวม ${thb(rentToOwnTotal(b))} จบสัญญาเครื่องเป็นของลูกค้าทันที (เทียบ${b.cashPriceLabel})`,
    )
    .join("\n");

  const faq = rentalFaqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");

  return `### เช่า AED (รายวัน / รายเดือน / รายปี)
${plans}

แพ็กอีเวนต์แบบเหมา:
${events}

ราคารายปีต่อเครื่องเมื่อเช่าหลายเครื่อง:
${multi}

### เช่าซื้อ (Rent-to-Own) — ผ่อน ${rtoMonthsLabel} งวด จบสัญญาเป็นเจ้าของ
${rto}

### FAQ เรื่องเช่า
${faq}`;
}
