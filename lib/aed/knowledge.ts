import { LINE_OA_ID } from "./line";
import { warrantyLine } from "./primedic";
import { PRIMEDIC_REGULATORY, adLicensesLine, fdaLine } from "./regulatory";
/**
 * Authoritative knowledge base for the AI sales assistant.
 *
 * Content here is grounded in the documents shipped under /public/documents
 * (Y2 spec sheet, the อย. notification) and lib/aed/regulatory.ts. The old
 * Amoul i7 manual/certificates (incl. EN 1789) were removed with the product,
 * so their claims must not come back here.
 *
 * The AI may quote these facts verbatim — they are official.
 */

export type KnowledgeArticle = {
  id: string;
  title: string;
  content: string;
};

const reg = PRIMEDIC_REGULATORY;

// Registration lines follow the `published` gate — while unpublished the bots
// get the pending note instead of a number.
const registrationLines = reg.published
  ? `- **อย. ไทย** ${fdaLine(reg, "ทะเบียน ")} นำเข้าโดย ${reg.importer}
- **ใบอนุญาตโฆษณา** ${adLicensesLine(reg)} โดย ${reg.advertiser}`
  : `- **อย./ใบอนุญาตโฆษณา:** ${reg.pendingNote}`;

export const knowledgeArticles: KnowledgeArticle[] = [
  {
    id: "certifications",
    title: "ใบรับรองและมาตรฐาน",
    content: `เครื่อง AED Yuwell / PRIMEDIC HeartSave ที่จำหน่ายอยู่:
${registrationLines}
- **ISO 13485** ระบบคุณภาพเครื่องมือแพทย์
- **CE** มาตรฐานความปลอดภัยยุโรป
ผู้ใช้สามารถดาวน์โหลดเอกสารได้ที่หน้า [เอกสารดาวน์โหลด](/docs)`,
  },
  {
    id: "medical-evidence",
    title: "หลักฐานทางการแพทย์ — Escalating Energy",
    content: `**Guidelines ที่อ้างอิง**
- ILCOR/AHA Guidelines 2020-2025: ทั้ง escalating energy และ fixed high energy เป็น acceptable strategy — มี outcome ใกล้เคียงกัน
- ILCOR 2025 Update: แนะนำ Initial 120-200J biphasic · Subsequent equal or higher · 360J เป็น max

**Key Studies**
1. **BIPHASIC Trial (2007):** Escalating energy ≈ fixed high energy — termination rates ใกล้เคียง
2. **AHA 2020 Guidelines:** ทั้ง 2 strategies ถูก recommended อย่างเท่าเทียม ไม่มี clear superiority
3. **ILCOR 2025 Update:** First shock 120-200J biphasic, subsequent เท่ากันหรือสูงกว่า, cap ที่ 360J

**First Shock Success Rates (Biphasic)**
- 100J biphasic: 70-80%
- 150J biphasic: 80-90%
- 200J biphasic: 85-90%

**After 3 shocks:** cumulative success > 95% — ส่วนใหญ่ไม่ต้องถึง 360J

เครื่องที่เราจำหน่าย (Yuwell / PRIMEDIC HeartSave) ใช้ escalating protocol ผู้ใหญ่ 200 → 300 → 360 J (โหมดเด็ก 50 → 70 → 100 J) ตั้งค่าไว้จากโรงงาน ผู้ใช้ปรับเองไม่ได้ — สอดคล้องกับคำแนะนำ ILCOR (ช็อกแรก 120–200J biphasic ครั้งต่อไปเท่ากันหรือสูงกว่า สูงสุด 360J)`,
  },
  {
    id: "warranty-service",
    title: "การรับประกันและบริการหลังการขาย",
    content: `- **ระยะเวลาการรับประกัน:** ${warrantyLine} — รายละเอียดเงื่อนไขสอบถามทีมขายเจี่ยรักษา ทักไลน์ ${LINE_OA_ID} หรือ [กรอกฟอร์ม](/#contact)
- ครอบคลุมความผิดปกติจากการผลิต ไม่ครอบคลุมอุบัติเหตุหรือการใช้ผิดวิธี
- ห้ามให้บุคคลที่ไม่ได้รับการรับรองซ่อมเอง
- บริการในไทย: ทีม เจี่ยรักษา รับเรื่องและประสานงาน — ทักไลน์ ${LINE_OA_ID} หรือ [กรอกฟอร์ม](/#contact)`,
  },
  {
    id: "tor-government",
    title: "การจัดซื้อภาครัฐ / TOR",
    content: `สำหรับหน่วยงานราชการที่ต้องการจัดซื้อ:
- มีเอกสารคุณลักษณะเฉพาะ (TOR-ready spec) ดาวน์โหลดเป็น .docx ได้ที่ [/docs](/docs)
- มาตรฐานที่อ้างอิงในสเปค: AHA CPR Guideline 2010/2015, CE, ISO 13485
- ผู้เสนอราคามีบุคลากรที่ผ่านการอบรม BLS จากสถาบันมาตรฐานสากล (เช่น ERTS Limited)
- ออกใบเสนอราคา ใบกำกับภาษี ใบส่งของในนามนิติบุคคล/ราชการได้
- ให้ส่วนลดสำหรับ order ≥ 5 เครื่อง — สอบถามทีมขายผ่าน LINE หรือ [ฟอร์ม](/#contact)`,
  },
  {
    id: "use-cases",
    title: "สถานที่ที่เหมาะกับการติดตั้ง",
    content: `- โรงพยาบาล คลินิก ศูนย์การแพทย์
- สำนักงาน อาคารพาณิชย์ คอนโด
- โรงเรียน มหาวิทยาลัย
- โรงงาน โกดัง สถานประกอบการ
- ฟิตเนส สนามกีฬา สระว่ายน้ำ (IP55 กันละอองน้ำและฝุ่น)
- โรงแรม รีสอร์ต ร้านอาหาร
- ห้างสรรพสินค้า สนามบิน สถานีรถไฟ
- หน่วยงานราชการ องค์การปกครองส่วนท้องถิ่น`,
  },
];

export function knowledgeBlock(): string {
  return knowledgeArticles
    .map((a) => `### ${a.title}\n${a.content}`)
    .join("\n\n");
}
