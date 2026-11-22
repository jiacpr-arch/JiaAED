// ─── /aed/gps-rental — ad landing page: เช่า AED GPS 4G (JIA AED SMART NETWORK) ──
// Built from the owner's MASTER CONTEXT v1.0 (23 พ.ย. 2569). Owner decisions,
// 23 พ.ย. 2026: owner confirms TWO genuine long-term payment options:
// ฿1,990 per month paid monthly (12-month agreement), OR ฿22,000 per year paid yearly.
// The ฿1,830 figure is only the monthly equivalent of the annual price, never a billed monthly price.
// LINE = the site's existing OA (@JIA1669 isn't wired to the
// bot/follow tracking), publish straight away.
//
// Rules from the brief this module enforces: every number comes from the price /
// terms / tier / spec modules below; nothing promises live GPS tracking, the
// patient's exact position, an automatic 1669 link, 24-hour service beyond what
// a tier offers, free training on every plan, or unproven site/rescue counts;
// no government body is named. See docs/gps-rental-landing-2026-11-23.md.
import type { FAQ } from "./faqs";
import { primedicSharedSpecs, yuwellGpsAed } from "./primedic";
import { RENTAL_DEPOSITS } from "./rental";
import {
  RENTAL_LATE_RETURN_PER_DAY,
  RENTAL_PRICES,
  STANDARD_MONTHLY,
  THREE_YEAR_DISCOUNT,
} from "./rental-prices";
import { subscriptionMatrix, tiersWith } from "./subscription";
import { survivorReward } from "./promotion";

export const GPS_RENTAL_PATH = "/aed/gps-rental";
export const PRODUCT_NAME = `Yuwell ${yuwellGpsAed.name} 4G`; // "Yuwell HeartSave Y8 GPS 4G"
export const BRAND = "JIA AED SMART NETWORK";

const thb = (n: number) => `฿${n.toLocaleString("en-US")}`;
const pct = (n: number) => `${Math.round(n * 100)}%`;
const spec = (label: string) => primedicSharedSpecs.find((s) => s.label === label)?.value ?? "";
const matrix = (feature: string) => subscriptionMatrix.find((r) => r.feature === feature)?.values;

// ── Price ─────────────────────────────────────────────────────────────────────
export const FROM_MONTHLY = RENTAL_PRICES.annualMonthly; // ฿1,990 ชำระเป็นรายเดือน (สัญญา 12 เดือน)
export const PRICE_FROM = thb(FROM_MONTHLY);
export const PRICE_NOTE =
  `เลือกชำระรายเดือน ${thb(RENTAL_PRICES.annualMonthly)}/เดือน (สัญญา ${RENTAL_PRICES.annualMonthlyMinMonths} เดือน) หรือชำระรายปี ${thb(RENTAL_PRICES.annual)}/ปี · ไม่รวม VAT 7% · ` +
  `เงินประกันรายเดือน ${thb(RENTAL_DEPOSITS.flex)} / รายปี ${thb(RENTAL_DEPOSITS.annual)} (รายปีอาจยกเว้นเมื่อมี PO) · ` +
  "การจัดส่ง การชำระล่วงหน้าและบริการเพิ่มเติมตามใบเสนอราคาและสัญญาเช่า";

// ── Photos (catalog-labelled shots of this unit only — never a Y2/colour-screen
//    image, never an AI render) ──────────────────────────────────────────────
export type Photo = { src: string; width: number; height: number; alt: string; caption: string };
export const HERO_PHOTO: Photo = {
  src: yuwellGpsAed.image, // "/images/yuwell-gps-aed.webp" — the actual red GPS unit
  width: 549,
  height: 549,
  alt: "เครื่อง AED Yuwell HeartSave Y8 GPS สีแดง ไฟสถานะ OK ด้านบน",
  caption: "มุมเฉียง",
};
export const PRODUCT_PHOTOS: Photo[] = [
  HERO_PHOTO,
  { src: "/images/primedic-heartsave.png", width: 474, height: 474, alt: "AED HeartSave ด้านหน้า ปิดฝา", caption: "ด้านหน้า" },
  { src: "/images/primedic-y8-open.png", width: 556, height: 556, alt: "HeartSave Y8 เปิดฝา พร้อมแผ่นอิเล็กโทรดและตัววัดการกดหน้าอก (CPR feedback)", caption: "เปิดฝา" },
  { src: "/images/primedic-pads-y8.png", width: 296, height: 340, alt: "แผ่นอิเล็กโทรดของ HeartSave Y8", caption: "แผ่นอิเล็กโทรด" },
];

// ── Audiences ─────────────────────────────────────────────────────────────────
export const RENT_AUDIENCES = [
  "หมู่บ้านจัดสรร / นิติบุคคล",
  "คอนโดมิเนียม / อาคารชุด",
  "โรงงาน / นิคมอุตสาหกรรม",
  "บริษัท / สำนักงาน",
  "โรงแรม รีสอร์ต สนามกอล์ฟ",
  "โรงเรียน มหาวิทยาลัย สถานที่สาธารณะ",
  "ผู้จัดงาน (ระยะสั้น/ระยะยาว)",
];

// ── Pain points ───────────────────────────────────────────────────────────────
export const PAIN_POINTS: { title: string; desc: string }[] = [
  { title: "แบตเตอรี่หมดหรือใกล้ถึงกำหนดเปลี่ยน", desc: "ผู้ดูแลอาจไม่ทราบจนกว่าจะถึงวันที่ต้องใช้" },
  { title: "แผ่น Electrode Pad หมดอายุ", desc: "แผ่นมีวันหมดอายุและต้องเปลี่ยนตามกำหนด" },
  { title: "เครื่องผิดปกติแต่ไม่มีใครตรวจ", desc: "ไม่ได้รับการตรวจสอบตามรอบ" },
  { title: "AED หลายจุด ติดตามยาก", desc: "การติดตามและบริหารอุปกรณ์กลายเป็นภาระของเจ้าหน้าที่" },
];
export const PAIN_NOTE =
  "ระบบ Monitoring ช่วยลดภาระการติดตาม แต่ไม่ได้ทดแทนการตรวจสอบหน้างานทั้งหมด — ทุกแผนยังมีการตรวจเช็กหน้างานตามรอบในสัญญา";

// ── Product features (verified catalog specs; network items hedged per brief) ─
export const PRODUCT_FEATURES: { title: string; desc: string }[] = [
  { title: "ใช้ได้ทั้งผู้ใหญ่และเด็ก", desc: `ปุ่มเลือกโหมดเด็ก — พลังงานเด็ก ${spec("พลังงานเด็ก (ค่าเริ่มต้น)")} ตามคู่มือ` },
  { title: "เสียงแนะนำการใช้งาน", desc: `เสียงนำทาง CPR ${spec("ภาษาเสียงนำทาง CPR")} · ปุ่ม Shock กึ่งอัตโนมัติ` },
  { title: "Self-test อัตโนมัติ", desc: spec("Self-test อัตโนมัติ") },
  { title: "แผ่นวัดการกดหน้าอก (CPR feedback)", desc: "ติดมากับ HeartSave Y8 บอกจังหวะและแรงกดด้วยเสียง" },
  { title: "ส่งข้อมูลผ่านเครือข่าย 4G", desc: "ตามรุ่นและการตั้งค่า — ตรวจสอบสถานะเครื่องจากระยะไกลผ่านระบบที่รองรับ" },
  { title: "รายงานเหตุการณ์และตำแหน่ง GPS", desc: "เมื่อระบบได้รับข้อมูลจากเครื่อง (ไม่ใช่การติดตามสดต่อเนื่อง)" },
];

// ── PRIMEDIC CLOUD capabilities ──────────────────────────────────────────────
export const CLOUD_CAPABILITIES: { title: string; desc: string }[] = [
  { title: "Cloud Monitoring", desc: "ตรวจสอบสถานะเครื่องหลายจุดผ่านระบบออนไลน์" },
  { title: "Battery / Pad Monitoring", desc: "ข้อมูลแบตเตอรี่และแผ่น Pad ตามที่เครื่องและระบบรายงาน" },
  { title: "Self-test", desc: "ผลการทดสอบตัวเองของเครื่องตามรอบข้อมูลที่ได้รับ" },
  { title: "Device Alert", desc: "เหตุการณ์และการแจ้งเตือนความผิดปกติที่ระบบรองรับ" },
  { title: "GPS Location", desc: "ตำแหน่งของเครื่องตามพิกัดและเวลาที่ระบบได้รับ" },
  { title: "Event History", desc: "ประวัติเหตุการณ์เปิดเครื่องและกิจกรรมที่ถูกบันทึก" },
];

// ── GPS 4G scenario + the limits the brief requires on the page ──────────────
export const GPS_SCENARIO = [
  "AED ติดตั้งอยู่ที่จุด A",
  "มีผู้ประสบเหตุอยู่ห่างออกไป 300–500 เมตร",
  "ผู้ช่วยเหลือนำ AED ไปยังจุดเกิดเหตุ",
  "เปิดเครื่อง AED ใกล้ผู้ป่วย",
  "เครื่องส่งข้อมูลเหตุการณ์และพิกัดที่ตรวจจับได้ผ่านเครือข่าย 4G",
  "ระบบแสดงข้อมูลตำแหน่งล่าสุดตามที่ได้รับ",
];
export const GPS_LIMITS = [
  "พิกัดของ AED ไม่ได้ยืนยันตำแหน่งของผู้ป่วยทุกกรณี",
  "ความแม่นยำขึ้นอยู่กับสัญญาณและสภาพแวดล้อม",
  "ไม่ใช่ระบบ GPS Tracking สดต่อเนื่องตลอดเวลา",
  "ระบบไม่ได้เชื่อมกับศูนย์ 1669 อัตโนมัติ",
];
export const EMERGENCY_REMINDER = "พบคนหมดสติไม่หายใจ: โทร 1669 · เริ่ม CPR · ใช้ AED โดยเร็วที่สุด";

// ── Packages ──────────────────────────────────────────────────────────────────
export type Pkg = { id: string; name: string; price: string; priceNote: string; points: string[]; cta: string; need: QuoteNeed; featured?: boolean };
export const PACKAGES: Pkg[] = [
  {
    id: "gps-monthly",
    name: "AED GPS — ชำระรายเดือน",
    price: `${PRICE_FROM}/เดือน`,
    priceNote: `ชำระรายเดือน · สัญญา ${RENTAL_PRICES.annualMonthlyMinMonths} เดือน · ไม่รวม VAT`,
    points: [
      `เครื่อง ${yuwellGpsAed.name} พร้อมแผ่นอิเล็กโทรดและแบตเตอรี่`,
      "ตรวจสอบสถานะผ่านระบบ Monitoring ตามบริการที่รองรับ",
      `เงินประกัน ${thb(RENTAL_DEPOSITS.flex)} · การชำระล่วงหน้าตามสัญญา`,
      "เหมาะกับองค์กรที่ต้องการแบ่งจ่ายรายเดือน",
    ],
    cta: "ขอใบเสนอราคารายเดือน",
    need: "rent",
    featured: true,
  },
  {
    id: "gps-annual",
    name: "AED GPS — ชำระรายปี",
    price: `${thb(RENTAL_PRICES.annual)}/ปี`,
    priceNote: `ชำระรายปี · เฉลี่ย ${thb(STANDARD_MONTHLY)}/เดือน · ไม่รวม VAT`,
    points: [
      `เครื่อง ${yuwellGpsAed.name} พร้อมระบบ Monitoring`,
      `ประหยัด ${thb(RENTAL_PRICES.annualMonthly * 12 - RENTAL_PRICES.annual)}/ปี เมื่อเทียบกับการจ่ายรายเดือน 12 ครั้ง`,
      `เงินประกัน ${thb(RENTAL_DEPOSITS.annual)} (อาจยกเว้นเมื่อมี PO)`,
      `สัญญา 3 ปี ลด ${pct(THREE_YEAR_DISCOUNT)} ตามเงื่อนไข`,
    ],
    cta: "ขอใบเสนอราคารายปี",
    need: "rent",
  },
  {
    id: "gps-cabinet",
    name: "AED GPS + Cabinet",
    price: "ตามใบเสนอราคา",
    priceNote: "ขึ้นกับชนิดตู้และสัญญา",
    points: ["เครื่อง AED GPS พร้อมตู้แขวนหรือตู้ตั้ง (เลือกได้)", "ระบบ Monitoring", "ติดตั้งตามจุดที่กำหนด"],
    cta: "ขอราคาพร้อมตู้",
    need: "rent",
  },
  {
    id: "corporate",
    name: "Corporate / Government",
    price: "เสนอราคาเฉพาะโครงการ",
    priceNote: `รายปีหลายเครื่อง 2–4 เครื่อง ${thb(RENTAL_PRICES.annual2to4Units)} · 5 เครื่องขึ้นไป ${thb(RENTAL_PRICES.annual5PlusUnits)} ต่อเครื่อง/ปี`,
    points: ["เช่าหรือจัดซื้อหลายเครื่อง", "ติดตามสถานะหลายจุดในระบบเดียว", "ติดตั้งและบำรุงรักษา", "แผนฝึกอบรม CPR/AED"],
    cta: "ขอใบเสนอราคาโครงการ",
    need: "project",
  },
];
export const PACKAGE_FINE_PRINT =
  `แผน ${thb(RENTAL_PRICES.annualMonthly)}/เดือนเป็นสัญญา ${RENTAL_PRICES.annualMonthlyMinMonths} เดือน ชำระรายเดือน; แผน ${thb(RENTAL_PRICES.annual)}/ปีชำระรายปี · ไม่รวม VAT · ` +
  `ค่าตู้ ค่าขนส่ง/ติดตั้งต่างจังหวัด และบริการเพิ่มเติมตามใบเสนอราคา · คืนเครื่องช้าคิดวันละ ${thb(RENTAL_LATE_RETURN_PER_DAY)} · ` +
  `เช่าระยะสั้นมีแผนรายวัน รายสัปดาห์ และ FLEX ${thb(RENTAL_PRICES.flexMonthly)}/เดือน (ขั้นต่ำ ${RENTAL_PRICES.flexMinMonths} เดือน)`;

// ── After-sales service (from the rental terms and the tier matrix) ──────────
const sla = matrix("เปลี่ยนเครื่องเมื่อเสีย (SLA)");
const visits = matrix("ตรวจเช็กหน้างาน (ครั้ง/ปี)");
export const SERVICE_ITEMS: { title: string; desc: string }[] = [
  { title: "ตรวจสอบข้อมูลเครื่องตามรอบ", desc: "ทีมงานดูสถานะเครื่องในระบบ" },
  { title: "แจ้งเตือนเมื่อพบความผิดปกติ", desc: `ทีมงานติดต่อผู้ดูแลเครื่อง · แจ้งเตือนทางอีเมลในระดับ ${tiersWith("แจ้งเตือนทางอีเมล (Email Alert)")}` },
  { title: "ติดตามกำหนดเปลี่ยนวัสดุสิ้นเปลือง", desc: "แผนรายปีและแผนยืดหยุ่น ผู้ให้เช่าดูแลแบตเตอรี่และแผ่นอิเล็กโทรดให้พร้อมใช้ตลอดสัญญา" },
  { title: "เครื่องสำรองเมื่อเครื่องเสีย", desc: `จากการใช้งานปกติ ภายใน ${sla?.["managed-basic"]} (STANDARD/PRO) · ${sla?.["managed-elite"]} (ELITE) ตามสัญญา` },
  { title: "ตรวจเช็กหน้างาน", desc: `STANDARD/PRO ${visits?.["managed-basic"]} · ELITE ${visits?.["managed-elite"]}` },
  { title: "ติดตั้งและอบรมตามแพ็กเกจ", desc: "รวมส่งและติดตั้งในแผนรายปี · การอบรมตามระดับบริการที่เลือก" },
];

// ── Training (per tier — not "free on every plan") ───────────────────────────
const trainingRow = matrix("อบรมพนักงาน (ครั้ง/ปี)");
export const TRAINING_COURSES = ["CPR / AED", "BLS", "First Aid", "อบรมที่ JIA TRAINER CENTER", "อบรมในสถานประกอบการ", "หลักสูตรออนไลน์และทบทวนความรู้"];
export const TRAINING_NOTE =
  `อบรมในแผนเช่า: STANDARD ${trainingRow?.["managed-basic"]} · PRO ${trainingRow?.["managed-pro"]} · ELITE ${trainingRow?.["managed-elite"]} — ` +
  "ต้องการอบรมเพิ่มหรือแพ็กเกจเครื่องพร้อมอบรม ขอราคาได้";

// ── Survivor programme (existing ./promotion.ts copy; no case study yet) ─────
export const SURVIVOR = {
  title: "JIA สนับสนุนผู้ที่ลงมือช่วยชีวิตจริง",
  body: survivorReward.subtitle,
  note: `${survivorReward.conditionNote} · ไม่ใช่คำรับประกันผลการช่วยชีวิต · ไม่เปิดเผยข้อมูลผู้ป่วย`,
};

// ── Government & enterprise ──────────────────────────────────────────────────
export const ENTERPRISE_GROUPS = [
  "หน่วยงานการแพทย์ฉุกเฉิน",
  "องค์กรปกครองส่วนท้องถิ่น",
  "โรงพยาบาลและหน่วยงานสาธารณสุข",
  "ผู้ดูแลโครงการ AED หลายสิบถึงหลายพันจุด",
  "องค์กรที่ต้องการระบบพร้อมบริการดูแลระยะยาว",
];
export const ENTERPRISE_ITEMS = [
  "บริหารอุปกรณ์จำนวนมากผ่าน Cloud",
  "GPS 4G และข้อมูลเหตุการณ์",
  "ฝึกอบรมผู้ดูแลประจำจุด",
  "บำรุงรักษาตาม SLA ในสัญญา",
  "รายงานสำหรับองค์กร",
  "ประเมินต้นทุนรวมตลอดอายุโครงการ และเทียบซื้อขาดกับเช่าระยะยาว",
];

// ── Quote form ────────────────────────────────────────────────────────────────
export type QuoteNeed = "rent" | "buy" | "consult" | "demo" | "proposal" | "project";
export const QUOTE_NEEDS: { id: QuoteNeed; label: string }[] = [
  { id: "rent", label: "เช่า" },
  { id: "buy", label: "ซื้อ" },
  { id: "consult", label: "ขอคำปรึกษา" },
  { id: "demo", label: "นัดสาธิตระบบ" },
  { id: "proposal", label: "เอกสารข้อเสนอสำหรับองค์กร" },
  { id: "project", label: "ใบเสนอราคาโครงการ" },
];
export const GPS_RENTAL_LEAD = { variant: "gps_rental", source: "gps_rental_form", productId: "yuwell-gps" } as const;

// ── FAQ (answers grounded in the terms/tier/spec modules) ────────────────────
const monthMin = RENTAL_PRICES.flexMinMonths;
export const GPS_RENTAL_FAQS: FAQ[] = [
  {
    question: "เช่า AED ราคาเท่าไร?",
    answer: `เลือกชำระรายเดือน ${thb(RENTAL_PRICES.annualMonthly)}/เดือน (สัญญา ${RENTAL_PRICES.annualMonthlyMinMonths} เดือน) หรือชำระรายปี ${thb(RENTAL_PRICES.annual)}/ปี (เฉลี่ยประมาณ ${thb(STANDARD_MONTHLY)}/เดือน) ไม่รวม VAT · 2–4 เครื่อง ${thb(RENTAL_PRICES.annual2to4Units)} และ 5 เครื่องขึ้นไป ${thb(RENTAL_PRICES.annual5PlusUnits)} ต่อเครื่อง/ปี · ราคาสุดท้ายตามใบเสนอราคา`,
  },
  {
    question: "ต้องวางเงินประกันหรือไม่?",
    answer: `แผนชำระรายเดือนแบบสัญญา ${RENTAL_PRICES.annualMonthlyMinMonths} เดือน วางเงินประกัน ${thb(RENTAL_DEPOSITS.flex)} · แผนชำระรายปีวางเงินประกัน ${thb(RENTAL_DEPOSITS.annual)} (อาจยกเว้นเมื่อมี PO) · เงื่อนไขชำระล่วงหน้าและการคืนประกันเป็นไปตามสัญญา`,
  },
  {
    question: "เช่าขั้นต่ำกี่เดือน?",
    answer: `แผนจ่ายรายเดือน ${thb(RENTAL_PRICES.annualMonthly)} มีสัญญา ${RENTAL_PRICES.annualMonthlyMinMonths} เดือน (ไม่ใช่ราคาเช่าเพียง 1 เดือน) · แผนจ่ายรายปีสัญญาขั้นต่ำ 1 ปี · FLEX ขั้นต่ำ ${monthMin} เดือน และมีแผนเช่าระยะสั้นแยกต่างหาก`,
  },
  {
    question: "ระบบ GPS 4G ทำงานอย่างไร?",
    answer:
      "เครื่องส่งผล Self-test สถานะแบตเตอรี่/แผ่นอิเล็กโทรด และข้อมูลเหตุการณ์พร้อมพิกัดที่ตรวจจับได้ ผ่านเครือข่าย 4G เข้าระบบ PRIMEDIC CLOUD ตามรุ่นและการตั้งค่า ทีมงานเห็นข้อมูลล่าสุดที่ระบบได้รับ — ไม่ใช่การติดตามตำแหน่งสดต่อเนื่องตลอดเวลา",
  },
  {
    question: "ถ้านำเครื่องออกจากตู้ ระบบจะรู้หรือไม่?",
    answer:
      "เมื่อเปิดเครื่องใช้งาน เครื่องบันทึกเหตุการณ์และส่งเข้าระบบเมื่อมีสัญญาณ ส่วนการแจ้งเตือนทันทีที่เปิดประตูตู้ขึ้นกับชนิดตู้ที่เลือก — สอบถามทีมงานตามรุ่นตู้",
  },
  {
    question: "ถ้าเครื่องไม่มีสัญญาณ 4G จะเป็นอย่างไร?",
    answer:
      "เครื่อง AED ยังช็อกไฟฟ้าและให้เสียงนำทางได้ตามปกติ เพราะการช่วยชีวิตไม่ต้องใช้สัญญาณ ข้อมูลจะเข้าระบบเมื่อเครื่องเชื่อมต่อได้ และยังมีการตรวจเช็กหน้างานตามรอบในสัญญา",
  },
  {
    question: "ถ้าแบตเตอรี่หรือ Pad ใกล้หมดอายุ ใครเป็นผู้ดูแล?",
    answer:
      "แผนรายปีและแผนยืดหยุ่น ผู้ให้เช่าดูแลแบตเตอรี่และแผ่นอิเล็กโทรดให้พร้อมใช้ตลอดสัญญา ทีมงานติดตามวันหมดอายุในระบบและนัดเปลี่ยนให้",
  },
  {
    question: "หากนำ AED ไปใช้ช่วยชีวิตจริง มีค่าใช้จ่ายเพิ่มเติมหรือไม่?",
    answer: `แผนชำระรายปี STANDARD และ FLEX มีเงื่อนไขเปลี่ยนแผ่นเมื่อใช้ช่วยชีวิตจริงตามสัญญา · แผนชำระรายเดือนแบบสัญญา 12 เดือนและแผนอีเวนต์ให้ยืนยันค่าใช้จ่ายกับทีมงานตามแพ็กเกจ · มีโครงการ ฿10,000 เมื่อผู้ป่วยรอดตามเงื่อนไขที่กำหนด`,
  },
  {
    question: "มีบริการติดตั้งและอบรมต่างจังหวัดหรือไม่?",
    answer: "มี — ค่าขนส่ง ติดตั้ง และเดินทางไปอบรมต่างจังหวัดเป็นไปตามใบเสนอราคา แจ้งจังหวัดในแบบฟอร์มเพื่อให้ทีมงานคิดราคาให้",
  },
  {
    question: "สามารถเช่าหลายเครื่องและดูใน Dashboard เดียวกันได้หรือไม่?",
    answer: `ได้ — ทีมงานเห็นทุกเครื่องในระบบเดียว · องค์กรเข้าดู Dashboard เองได้ในระดับ ${tiersWith("ระบบควบคุม Cloud Dashboard")} · ราคาหลายเครื่องถูกลงต่อเครื่อง`,
  },
];
