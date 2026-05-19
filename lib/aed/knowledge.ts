/**
 * Authoritative knowledge base for the AI sales assistant.
 *
 * Content here is grounded in the real documents shipped under /public/documents:
 *  - คู่มือการใช้งาน AED i7/i9 ภาษาไทย (Rev.01)
 *  - คุณลักษณะเฉพาะ AED รุ่น i7 (Rev.2025 v1.1)
 *  - CE Mark Declaration of Conformity (2024-08-24)
 *  - ISO 13485:2016 Certificate (MD 743586, exp 2027-09-19)
 *  - EN 1789:2020 SGS Test Report (SZES231200758104)
 *
 * The AI may quote these facts verbatim — they are official.
 */

export type KnowledgeArticle = {
  id: string;
  title: string;
  content: string;
};

export const knowledgeArticles: KnowledgeArticle[] = [
  {
    id: "manufacturer",
    title: "ผู้ผลิตและที่มา",
    content: `เครื่อง AED Amoul i7 / i9 ผลิตโดย **Ambulanc (Shenzhen) Tech. Co., Ltd.** (深圳市安保医疗科技股份有限公司)
ที่ตั้งโรงงาน: Skyworth Innovation Industry Park, Tangtou 1st Road, Shiyan, Baoan District, Shenzhen 518108, China
ผู้แทนใน EU: Shanghai International Holding Corp. GmbH (Hamburg, Germany)
ผู้นำเข้า/จัดจำหน่ายในไทย: บริษัท เจี่ยรักษา จำกัด (jiaaed.com) — ทะเบียน อย. 68-2-2-2-0005243 · ใบโฆษณา ฆพ.743/2569`,
  },
  {
    id: "certifications",
    title: "ใบรับรองและมาตรฐาน",
    content: `เครื่อง AED Amoul i7 ผ่านการรับรองมาตรฐานสากลครบถ้วน:
- **CE Mark** ตาม Council Directive 93/42/EEC · Class IIb, Rule 9 · EC Certificate No. **705577** ออกโดย BSI Group The Netherlands B.V. (Notified Body 2797) · Start of CE-marking: 2020-09-03
- **ISO 13485:2016** Certificate No. **MD 743586** ออกโดย BSI · Effective 2024-09-13 หมดอายุ 2027-09-12
- **EN 1789:2020** ทดสอบโดย SGS-CSTC Shenzhen · Report No. SZES231200758104 (2024-04-24) — รับรองว่าใช้ในรถพยาบาลได้
- **IP65** ป้องกันฝุ่นและละอองน้ำ
- **อย. ไทย** ทะเบียน 68-2-2-2-0005243
ผู้ใช้สามารถดาวน์โหลดเอกสารทั้งหมดได้ที่หน้า [เอกสารดาวน์โหลด](/docs)`,
  },
  {
    id: "spec-overview",
    title: "สเปคทางเทคนิคหลัก (อ้างอิงเอกสาร TOR)",
    content: `**ภาควิเคราะห์คลื่นหัวใจ**
- รับสัญญาณ ECG ผ่านแผ่นกระตุ้นหัวใจ
- บันทึก ECG + CPR ได้ 8 ชั่วโมง · บันทึกเสียง 72 นาที
- ดึงข้อมูลผ่าน USB และ WiFi ได้

**ภาคฟื้นคืนคลื่นหัวใจ**
- รูปคลื่น: Biphasic Truncated Exponential (BTE) — auto-compensation ตาม patient impedance 20-300 โอห์ม
- พลังงานสูงสุด: 360 Joules
- **ผู้ใหญ่** — Shock 1: 200J (ปรับได้ 100/150/170/200/300/360) · Shock 2: 300J · Shock 3: 360J
- **เด็ก** — Shock 1: 50J (ปรับได้ 10/15/20/30/50/70/100) · Shock 2: 70J · Shock 3: 100J
- เวลาชาร์จจนพร้อม Shock: **< 7 วินาที**
- จำนวน Shock ต่อชาร์จ: **≥ 420 ครั้ง** ที่ 200J
- ใช้งานต่อเนื่อง: ≥ 16 ชั่วโมง

**ตัวเครื่อง**
- น้ำหนัก: 2 กก. (รวมแบตเตอรี่)
- แบตเตอรี่: Manganese Dioxide Lithium 4,500 mAh · อายุ **≥ 7 ปี**
- Self-test: Daily / Weekly / Monthly / Runtime
- มีหน้าต่างเฉพาะแสดงวันหมดอายุของแผ่นอิเล็กโทรด
- การเชื่อมต่อ: USB · SIM card slot · WiFi
- อุณหภูมิทำงาน: -25°C ถึง 60°C · เก็บรักษา -30°C ถึง 70°C · ความชื้น 0-95% RH
- ใช้ได้ทั้งผู้ใหญ่และเด็ก
- เป็นไปตาม AHA CPR Guideline 2015

**อุปกรณ์ในกล่อง** (Packing List ตาม Item Code โรงงาน)
1. Main Unit (2.215.00085)
2. Disposable AED Electrodes Adult/Ped (5.000.01239)
3. Battery (1.115.00084)
4. User Manual — English (1.601.00412)
5. Warranty Card (1.605.00178)

(ฉบับขายในไทยมีคู่มือภาษาไทยและกระเป๋าใส่เครื่องเพิ่ม)`,
  },
  {
    id: "warranty-service",
    title: "การรับประกันและบริการหลังการขาย",
    content: `- **รับประกัน 1 ปี** จากวันส่งมอบ (ครอบคลุมความผิดปกติของการผลิต ไม่ครอบคลุมอุบัติเหตุ การใช้ผิดวิธี)
- ห้ามให้บุคคลที่ไม่ได้รับการรับรองซ่อมเอง
- Global hotline ผู้ผลิต: +86-400-9969-120 (จันทร์-ศุกร์ 8:30-18:00)
- ฉุกเฉิน 24/7: +86-189 2746 5530 (มี WhatsApp)
- Email โรงงาน: service.intl@amoulmed.com
- บริการในไทย: ทีม เจี่ยรักษา รับเรื่องและประสานงาน — ทักไลน์ @273fzpzs หรือ [กรอกฟอร์ม](/#contact)`,
  },
  {
    id: "tor-government",
    title: "การจัดซื้อภาครัฐ / TOR",
    content: `สำหรับหน่วยงานราชการที่ต้องการจัดซื้อ:
- มีเอกสารคุณลักษณะเฉพาะ (TOR-ready spec) ดาวน์โหลดเป็น .docx ได้ที่ [/docs](/docs)
- มาตรฐานที่อ้างอิงในสเปค: AHA CPR Guideline 2015, CE Mark, IP65, ISO 13485, EN 1789:2020
- ผู้เสนอราคามีบุคลากรที่ผ่านการอบรม BLS จากสถาบันมาตรฐานสากล (เช่น ERTS Limited)
- ออกใบเสนอราคา ใบกำกับภาษี ใบส่งของในนามนิติบุคคล/ราชการได้
- ให้ส่วนลดสำหรับ order ≥ 5 เครื่อง — สอบถามทีมขายผ่าน LINE หรือ [ฟอร์ม](/#contact)`,
  },
  {
    id: "use-cases",
    title: "สถานที่ที่เหมาะกับการติดตั้ง",
    content: `- โรงพยาบาล คลินิก ศูนย์การแพทย์
- รถพยาบาล (รับรอง EN 1789:2020)
- สำนักงาน อาคารพาณิชย์ คอนโด
- โรงเรียน มหาวิทยาลัย
- โรงงาน โกดัง สถานประกอบการ
- ฟิตเนส สนามกีฬา สระว่ายน้ำ (IP65 กันน้ำ)
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
