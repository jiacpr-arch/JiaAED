import { LINE_OA_ID } from "./line";
import { consumableLifetimeText, primedicModels, warrantyLine } from "./primedic";
import { products } from "./products";
import { TRAINING_POLICY } from "./promotion";
import { subscriptionMatrix, subscriptionTiers } from "./subscription";
import { RENT_TO_OWN_OWNERSHIP_NOTE } from "./packages";
import { PRIMEDIC_REGULATORY, adLicensesLine, fdaLine } from "./regulatory";

export type FAQ = {
  question: string;
  answer: string;
};

// Prices in the copy below come from the catalog modules, never re-typed.
const baht = (n: number) => n.toLocaleString("en-US");
const modelPrice = (id: string) => primedicModels.find((m) => m.id === id)!.price;
const productPrice = (id: string) => products.find((p) => p.id === id)!.price;

// "PRO 1 ครั้ง/ปี · ELITE 2 ครั้ง/ปี" — training per subscription tier, read from
// the feature matrix so the FAQ can't promise training a tier doesn't include.
const trainingRow = subscriptionMatrix.find((r) => r.feature === "อบรมพนักงาน (ครั้ง/ปี)")!;
const tierTraining = subscriptionTiers
  .filter((t) => trainingRow.values[t.id] !== false)
  .map((t) => `${t.name} ${trainingRow.values[t.id]}`)
  .join(" · ");
// Tiers whose devices include GPS — STANDARD (the annual plan) has none.
const gpsRow = subscriptionMatrix.find((r) => r.feature === "Yuwell GPS ติดตามตำแหน่ง")!;
const gpsTiers = subscriptionTiers
  .filter((t) => gpsRow.values[t.id] !== false)
  .map((t) => t.name)
  .join("/");

const reg = PRIMEDIC_REGULATORY;

// Amoul i7 discontinued (ก.ค. 2026) — these FAQs now describe AED Yuwell Y2 /
// PRIMEDIC HeartSave. Real specs from lib/aed/primedic.ts (primedicSharedSpecs)
// — never re-typed independently. Two Amoul-only Wi-Fi/SIM/"AED Management
// Platform" FAQs were removed rather than repointed — Yuwell/PRIMEDIC hardware
// doesn't have that feature (GPS tracking is a separate product, yuwellGpsAed).
export const faqs: FAQ[] = [
  {
    // Y2 is the flagship, not the entry point — the answer also names the
    // cheaper Y0/Y8 so "how much is an AED" never reads as "from ฿59,999".
    question: "AED Yuwell Y2 ราคาเท่าไหร่?",
    answer:
      `Yuwell Y2 (รุ่นเรือธง จอสี EKG) ราคา ${baht(productPrice("i7"))} บาท (ยังไม่รวม VAT), ${baht(productPrice("i7-cabinet"))} บาท สำหรับรุ่นพร้อมตู้ติดผนัง, และ ${baht(productPrice("i7-floor"))} บาท สำหรับรุ่นพร้อมแท่นตั้งพื้น — ถ้าต้องการรุ่นที่ราคาเริ่มต้นต่ำกว่า มี PRIMEDIC HeartSave Y0 ${baht(modelPrice("primedic-y0"))} บาท และ Y8 (มีเซ็นเซอร์ CPR feedback) ${baht(modelPrice("primedic-y8"))} บาท — ${TRAINING_POLICY} — ออกใบกำกับภาษีได้ มีราคาพิเศษสำหรับองค์กร โรงพยาบาล และหน่วยงานภาครัฐ สอบถามได้ทาง LINE ${LINE_OA_ID}`,
  },
  {
    // เจี่ยรักษา is the seller and ฆพ. holder — the importer/registrant is Yuwell
    // Medical (Thailand). Never call เจี่ยรักษา the importer.
    question: "AED Yuwell Y2 ผ่าน อย. หรือไม่?",
    answer: reg.published
      ? `ผ่านครับ ทะเบียน ${fdaLine(reg)} ครอบคลุมตระกูล HeartSave Y0/Y8/Y2 นำเข้าโดย ${reg.importer} — พร้อมใบอนุญาตโฆษณาเครื่องมือแพทย์ ${adLicensesLine(reg, { short: true })} จัดจำหน่ายโดย ${reg.advertiser}`
      : `เป็นเครื่องมือแพทย์นำเข้าโดย ${reg.importer} — ${reg.pendingNote}`,
  },
  {
    question: "ใช้งานยากไหม คนไม่เคยใช้กดเป็นไหม?",
    answer:
      "ใช้งานง่ายมากครับ มีเสียงแนะนำภาษาไทยทีละขั้นตอน พร้อมภาพนิ่งบนหน้าจอ คนทั่วไปที่ไม่เคยฝึกอบรมก็สามารถใช้ได้ทันทีเมื่อเกิดเหตุฉุกเฉิน เพียง 3 ขั้นตอน: เปิดเครื่อง → แปะแผ่น electrode → กดปุ่ม Shock ตามคำสั่งเสียง",
  },
  {
    question: "AED ใช้กับเด็กได้ไหม?",
    answer:
      "ใช้ได้ทั้งผู้ใหญ่และเด็กครับ (อายุ 3 ปีขึ้นไป) — สลับโหมดด้วยปุ่มเลือกโหมดเด็กที่ตัวเครื่อง โหมดผู้ใหญ่ใช้พลังงานช็อกแบบ escalating 200 → 300 → 360 J และโหมดเด็ก 50 → 70 → 100 J เครื่องวิเคราะห์คลื่นหัวใจและเลือกระดับพลังงานให้อัตโนมัติ",
  },
  {
    question: "AED Yuwell Y2 ตั้งค่าพลังงาน Shock เองได้ไหม?",
    answer:
      "ผู้ใช้ไม่สามารถตั้งค่าพลังงานเองได้ครับ เครื่องใช้ escalating protocol ที่ตั้งค่าไว้แล้วตาม international guidelines (ILCOR/AHA) เริ่มจากระดับต่ำเพื่อลด myocardial damage แล้วเพิ่มเมื่อจำเป็น เป็น standard ที่ AHA รับรอง — จุดเด่นของ Y2 คือจอสี EKG ที่แสดงคุณภาพการทำ CPR สด ๆ (ความเร็ว/ความลึก/full recoil) ให้ผู้ช่วยเหลือปรับท่าปั๊มได้ทันที",
  },
  {
    question: "เครื่อง AED Yuwell Y2 ต้องเชื่อมต่ออินเทอร์เน็ตไหม?",
    answer:
      "ไม่ต้องครับ เครื่องทำงานได้ครบทุกฟังก์ชันโดยไม่ต้องเชื่อมต่อใดๆ ไม่ต้องสมัครบริการหรือเข้า dashboard เพียงเปิดเครื่อง → แปะแผ่น → กด Shock ตามเสียงนำทาง — ข้อมูลการใช้งานบันทึกในตัวเครื่อง (SD card) ดึงออกผ่าน USB ได้เมื่อตรวจสอบ หากต้องการติดตามตำแหน่ง/สถานะเครื่องแบบเรียลไทม์ผ่าน GPS มีรุ่น Yuwell AED (GPS ในตัว) แยกต่างหาก",
  },
  {
    question: "Shock พร้อมในกี่วินาที?",
    answer:
      "วิเคราะห์คลื่นหัวใจและชาร์จพร้อม Shock ภายใน ≤ 5 วินาทีที่ 200J (≤ 12 วินาทีเมื่อต้องชาร์จเต็ม 360J) ทุกวินาทีคือชีวิต — การ Shock เร็วช่วยลดอัตราการเสียชีวิตจากภาวะหัวใจหยุดเต้นเฉียบพลันได้อย่างมีนัยสำคัญ",
  },
  {
    question: "แบตเตอรี่อยู่ได้นานแค่ไหน?",
    answer:
      `แบตเตอรี่ LiMnO₂ 12V 4.2Ah แบบใช้แล้วทิ้ง (ชาร์จใหม่ไม่ได้) ช็อกได้ ≥ 200 ครั้งที่ 360J พร้อม Self-test อัตโนมัติ (สูงสุด 3,650 ครั้ง) เพื่อให้แน่ใจว่าเครื่องพร้อมใช้งานตลอดเวลา และบันทึกข้อมูลได้ครบ — ECG 10 ชม. · event 2,000 รายการ · เสียง 2 ชม. · CPR data 10 ชม. · อายุการใช้งาน: ${consumableLifetimeText}`,
  },
  {
    question: "AED Yuwell Y2 กันน้ำกันฝุ่นไหม?",
    answer:
      "กันได้ครับ ผ่านมาตรฐาน IP55 กันละอองน้ำและฝุ่น เหมาะกับการติดตั้งหลากหลายสถานที่ทั้งในอาคารและกึ่งกลางแจ้ง",
  },
  {
    question: "ออกใบกำกับภาษีและใบเสนอราคาได้ไหม?",
    answer:
      `ได้ครับ รองรับการจัดซื้อภาครัฐ โรงพยาบาล และองค์กรเอกชน พร้อมเอกสารครบถ้วน — ใบเสนอราคา ใบกำกับภาษี ใบส่งของ และเอกสาร อย./ใบโฆษณา สอบถามได้ทาง LINE ${LINE_OA_ID}`,
  },
  {
    question: "มีบริการหลังการขายไหม?",
    answer:
      `มีครับ — ทีมเทคนิคไทยให้คำปรึกษาและดูแลตลอดอายุการใช้งาน จัดส่งทั่วประเทศพร้อมบริการติดตั้งสาธิตการใช้งาน ${warrantyLine} สอบถามรายละเอียดเงื่อนไขได้ที่ทีมขาย LINE ${LINE_OA_ID}`,
  },
  {
    question: "เครื่อง AED ควรติดตั้งที่ไหนบ้าง?",
    answer:
      "ควรติดตั้งในสถานที่ที่มีคนชุมนุม เช่น สำนักงาน โรงเรียน โรงงาน ห้างสรรพสินค้า ฟิตเนส สนามกีฬา หมู่บ้าน คอนโด สถานที่ราชการ และโรงพยาบาล โดยติดในจุดที่หยิบใช้ได้ภายใน 3 นาที — ทีมเจี่ยรักษาให้คำแนะนำการเลือกตำแหน่งติดตั้งฟรี",
  },
];

// ─── Categorized FAQ (packages / subscription pages) ──────────────────────────
// The flat `faqs` export above stays unchanged (homepage + StructuredData depend
// on it). These categorized sets power the new pages.

export type FaqCategory = {
  category: string;
  items: FAQ[];
};

// Rent-to-own FAQs shared by /aed/packages and /aed/rental — owner-approved
// copy, referenced (not duplicated) so both pages stay in sync.
export const faqRentToOwnVsRental: FAQ = {
  question: "แพ็กเกจเช่าแล้วได้ซื้อ (Safety Start) ต่างจากการเช่าธรรมดาอย่างไร?",
  answer:
    'การเช่าธรรมดาจ่ายค่าเช่าไปเรื่อย ๆ และอุปกรณ์ยังเป็นของเรา แต่ "เช่าแล้วได้ซื้อ" เป็นการผ่อนเพื่อเป็นเจ้าของ — เมื่อผ่อนครบตามสัญญา (เช่น 18 เดือน) อุปกรณ์จะเป็นสินทรัพย์ขององค์กรทันทีโดยไม่มีค่าใช้จ่ายเพิ่ม เป็นการกระจายภาระลงทุนแต่ยังได้ความเป็นเจ้าของในที่สุด',
};

export const faqMidContractCancel: FAQ = {
  question: "หากต้องการยกเลิกสัญญากลางคัน (Safety Start / Care) จะเป็นอย่างไร?",
  answer:
    `Safety Start (เช่าแล้วได้ซื้อ): หากยกเลิกกลางคัน เงินดาวน์และค่างวดที่ชำระแล้วไม่คืน ส่วนอุปกรณ์ต้องส่งคืนในสภาพดี — ${RENT_TO_OWN_OWNERSHIP_NOTE} · Safety Care (เช่าบริการ): แจ้งยกเลิกได้เมื่อครบกำหนดสัญญารายปี ค่ามัดจำคืนหลังตรวจรับอุปกรณ์ครบและสภาพสมบูรณ์`,
};

export const faqSwitchPackage: FAQ = {
  question: "ต้องการปรับเปลี่ยนแพ็กเกจในอนาคต ทำได้ไหม?",
  answer:
    "ได้ เช่น อัปเกรดจาก Safety Care เป็น Safety Start เมื่อต้องการเป็นเจ้าของ หรือเพิ่มจำนวนเครื่อง AED และ GPS ในแพ็กเกจเดิม ติดต่อทีมขายเพื่อขอใบเสนอราคาใหม่ได้ตลอดเวลา",
};

// 4-category set WITH full answers (from owner's source material).
export const packageFaqCategories: FaqCategory[] = [
  {
    category: "เกี่ยวกับตัวสินค้าและบริการ",
    items: [
      {
        question: "แพ็กเกจของท่านรวมอะไรบ้าง?",
        answer:
          `ทุกแพ็กเกจรวมเครื่อง AED และบริการหลังการขายตามแต่ละแพ็กเกจ เลือกเพิ่มตู้จัดเก็บมาตรฐานได้ — การอบรม: Safety Premium รวมอบรม CPR & AED สอนถึงที่ ส่วน Safety Care อบรมพนักงานตามระดับบริการ (${tierTraining}) — ระบบติดตาม GPS รวมอยู่ในแพ็กเช่าบริการ Safety Care ระดับ ${gpsTiers} ส่วนแพ็กซื้อขาด Safety Premium เลือกอัปเกรดเป็นรุ่น GPS ในตัวได้ (สอบถามราคา) — Safety Premium และ Safety Start ท่านจะได้เป็นเจ้าของอุปกรณ์ ส่วน Safety Care เป็นการเช่าบริการแบบครบวงจร`,
      },
      {
        question: "ทำไมต้องมี GPS คู่กับ AED?",
        answer:
          "GPS ไม่ได้มีไว้ติดตามตัวเครื่องอย่างเดียว แต่เป็นระบบบริหารความปลอดภัยที่สมบูรณ์ขึ้น — ติดตามตำแหน่งรถพยาบาล ยานพาหนะฉุกเฉิน หรือทีมงานนอกสถานที่ เพื่อส่งความช่วยเหลือได้เร็วขึ้นในวิกฤต และยังใช้บริหารทรัพย์สินขององค์กรได้ด้วย",
      },
      {
        question: "จำเป็นต้องฝึกอบรมเพื่อใช้ AED ไหม?",
        answer:
          `แนะนำอย่างยิ่ง แม้เครื่อง AED จะออกแบบให้ใช้งานง่ายด้วยคำแนะนำเสียง แต่การฝึกอบรมช่วยเพิ่มความมั่นใจ ลดความตื่นตระหนก และสอนเทคนิค CPR ที่จำเป็นควบคู่กับการใช้เครื่อง ซึ่งช่วยเพิ่มโอกาสรอดชีวิตได้อย่างมีนัยสำคัญ — แพ็กซื้อขาด Safety Premium จึงรวมอบรมสอนถึงที่ และแพ็กเช่าบริการ Safety Care มีอบรมทุกระดับ — ${tierTraining}`,
      },
    ],
  },
  {
    category: "ราคาและการชำระเงิน",
    items: [
      faqRentToOwnVsRental,
      {
        question: "มีค่าใช้จ่ายแอบแฝงหรือค่าบำรุงรักษาเพิ่มเติมไหม?",
        answer:
          "ราคาที่ประกาศคือราคาที่รวมบริการพื้นฐานแล้ว — Safety Premium & Start รวมการตรวจเช็คเบื้องต้นและประกันโรงงาน แต่อาจมีค่าวัสดุสิ้นเปลือง (แบตเตอรี่/แผ่นอิเล็กโทรด) เมื่อหมดอายุในปีต่อ ๆ ไป ส่วน Safety Care รวมทุกอย่างครบ ทั้งค่าบำรุงรักษา การเปลี่ยนอะไหล่สิ้นเปลือง และการอัปเดตซอฟต์แวร์ ไม่มีค่าใช้จ่ายเพิ่มระหว่างสัญญา",
      },
      {
        question: "มีบริการผ่อนชำระกับสถาบันการเงินไหม?",
        answer:
          "มี สำหรับแพ็กเกจ Safety Premium (ซื้อขาด) เราสามารถประสานงานกับสถาบันการเงินพันธมิตรเพื่อให้บริการผ่อนชำระได้ แจ้งทีมขายเพื่อรับข้อมูลและอัตราดอกเบี้ยที่เหมาะสม",
      },
    ],
  },
  {
    category: "การติดตั้ง ใช้งาน และบริการ",
    items: [
      {
        question: "ใช้เวลาเท่าไหร่ถึงจะเริ่มใช้บริการได้?",
        answer:
          "หลังตกลงและชำระเงิน สามารถนัดหมายการส่งมอบอุปกรณ์และการฝึกอบรมขั้นพื้นฐานได้ภายใน 3–5 วันทำการ สำหรับการติดตั้งตู้หรือระบบที่ซับซ้อนอาจพิจารณาเป็นกรณี",
      },
      {
        question: "หากอุปกรณ์มีปัญหา จะรับบริการอย่างไร?",
        answer:
          "มีบริการหลายช่องทาง — บริการทางโทรศัพท์สำหรับปัญหาเบื้องต้น, บริการ On-site สำหรับปัญหาที่ต้องตรวจสอบโดยช่าง, และบริการเปลี่ยนเครื่องสำรอง (ในแพ็กเกจ Safety Care) สำหรับกรณีเร่งด่วน รายละเอียดการรับประกันระบุชัดเจนในสัญญา",
      },
      {
        question: "ขอทดลองใช้หรือทดสอบเครื่องก่อนตัดสินใจได้ไหม?",
        answer:
          "ได้ เรามีบริการสาธิตและทดลองใช้สินค้า (Product Demonstration) ที่สำนักงานของเรา หรือนัดหมายไปยังสถานที่ของท่าน เพื่อให้เห็นคุณภาพและความเหมาะสมก่อนตัดสินใจ",
      },
    ],
  },
  {
    category: "เงื่อนไขสัญญาและอื่น ๆ",
    items: [
      faqMidContractCancel,
      {
        question: "มีประกันหรือการรับประกันอะไรบ้าง?",
        answer:
          `เครื่อง AED ใหม่ทุกเครื่อง${warrantyLine} ส่วนบริการของเราให้การรับประกันความพึงพอใจในบริการติดตั้งและฝึกอบรม รวมถึงมีการรับประกันความเสียหายจากภัยธรรมชาติหรือการโจรกรรมในบางแพ็กเกจ (โปรดดูรายละเอียดในสัญญา)`,
      },
      faqSwitchPackage,
    ],
  },
];

// 7-category subscription FAQ. SOURCE GAVE ONLY HEADERS — answers below are
// DRAFTED by us and need owner review/approval before launch.
// TODO(owner): review & approve all answers in subscriptionFaqCategories.
export const subscriptionFaqCategories: FaqCategory[] = [
  {
    category: "ข้อมูลทั่วไปเกี่ยวกับบริการเช่า AED",
    items: [
      {
        question: "บริการเช่า AED คืออะไร เหมาะกับใคร?",
        answer:
          "คือบริการที่องค์กรได้เครื่อง AED พร้อมระบบดูแลครบวงจร โดยจ่ายเป็นรายเดือนแทนการลงทุนซื้อก้อนใหญ่ เหมาะกับองค์กรที่ต้องการความพร้อมใช้งานตลอดเวลาโดยไม่ต้องดูแลอุปกรณ์เอง",
      },
    ],
  },
  {
    category: "ราคา สัญญา และความคุ้มค่า",
    items: [
      {
        question: "ค่าเช่าเริ่มต้นเท่าไหร่ และสัญญายาวแค่ไหน?",
        answer:
          `เริ่มต้นเฉลี่ย ${subscriptionTiers[0].pricePerMonth.toLocaleString("en-US")} บาท/เดือน (STANDARD ${subscriptionTiers[0].specialNote}) สัญญามาตรฐาน 1 ปี เลือกระดับบริการ ${subscriptionTiers.map((t) => t.name).join(" / ")} ได้ตามความเหมาะสมขององค์กร`,
      },
    ],
  },
  {
    category: "การติดตั้งและการดูแลเครื่อง AED",
    items: [
      {
        question: "ใครเป็นผู้ดูแลและตรวจสอบความพร้อมของเครื่อง?",
        answer:
          "ทีมงานของเราดูแลตามรอบ ทั้งการตรวจแบตเตอรี่ แผ่นอิเล็กโทรด และการทำงานของเครื่อง พร้อมเปลี่ยนวัสดุสิ้นเปลืองและเครื่องสำรองเมื่อจำเป็นตามระดับบริการ",
      },
    ],
  },
  {
    category: "กรณีฉุกเฉินและการใช้งานจริง",
    items: [
      {
        question: "ถ้าใช้เครื่องช่วยชีวิตจริงแล้วต้องทำอย่างไรต่อ?",
        answer:
          "หลังใช้งานจริงต้องเปลี่ยนแผ่นอิเล็กโทรดชุดใหม่ทุกครั้ง — แจ้งทีมงานเพื่อจัดเตรียมวัสดุทดแทนและตรวจสอบความพร้อมของเครื่องให้กลับมาใช้งานได้โดยเร็ว",
      },
    ],
  },
  {
    category: "ระบบหลังบ้านและการแจ้งเตือน",
    items: [
      {
        question: "ระบบ Dashboard และการแจ้งเตือนทำงานอย่างไร?",
        answer:
          "ระบบ Cloud Dashboard แสดงสถานะเครื่องหลายจุดในหน้าจอเดียว ตรวจสอบแบตเตอรี่/แผ่น/ผล Self-test แบบออนไลน์ และส่งการแจ้งเตือนอัตโนมัติเมื่ออุปกรณ์ใกล้หมดอายุหรือมีปัญหา (ขึ้นกับระดับบริการ)",
      },
    ],
  },
  {
    category: "การอบรมและการเตรียมความพร้อมบุคลากร",
    items: [
      {
        question: "มีการอบรมพนักงานหรือไม่ บ่อยแค่ไหน?",
        answer:
          `มี ทุกระดับบริการ — ${tierTraining} สอนโดยวิทยากรที่ผ่าน BLS Instructor Course และระดับ ELITE ยังช่วยสร้างผู้สอนภายในองค์กรได้`,
      },
    ],
  },
  {
    category: "กฎหมายและมาตรฐานความปลอดภัย",
    items: [
      {
        question: "เครื่องที่ให้เช่าได้มาตรฐานและถูกต้องตามกฎหมายไหม?",
        answer:
          "เครื่องที่ให้บริการเป็นเครื่องมือแพทย์ที่ขึ้นทะเบียน อย. และผ่านมาตรฐานสากล พร้อมเอกสารประกอบการจัดซื้อครบถ้วน — ทีมงานให้คำแนะนำการติดตั้งตามแนวทางความปลอดภัยที่เกี่ยวข้อง",
      },
    ],
  },
];
