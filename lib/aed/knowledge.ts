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
- บันทึก ECG ได้ ≥ 8 ชั่วโมง · เหตุการณ์ ≥ 1,500 รายการ
- ดึงข้อมูลผ่าน USB · Wi-Fi · SIM 4G ได้ (ต้องเปิดใช้ AED Management Platform)

**ภาคฟื้นคืนคลื่นหัวใจ — Escalating Protocol (ตั้งค่าไม่ได้)**
- รูปคลื่น: Biphasic Truncated Exponential (BTE) — auto-compensation ตาม patient impedance 20-300 โอห์ม
- พลังงานสูงสุด: 360 Joules
- **ผู้ใหญ่ — 6 ระดับ:** Shock 1: 100J · 2: 150J · 3: 170J · 4: 200J · 5: 300J · 6: 360J · 7+: 360J (cap max)
- **เด็ก — 7 ระดับ (อายุ < 8 ปี หรือ < 25 กก.):** 1: 10J · 2: 15J · 3: 20J · 4: 30J · 5: 50J · 6: 70J · 7: 100J · 8+: 100J (cap max)
- ผู้ใช้ไม่สามารถ setting พลังงานเองได้ในรุ่น i7 — เครื่องเลือกตามลำดับช็อก และปรับเล็กน้อย (1-2 ขั้น) ตาม patient impedance
- ใช้ escalating protocol ตาม international guidelines (เริ่มต่ำเพื่อลด myocardial damage แล้วเพิ่มเมื่อจำเป็น)
- เวลาชาร์จจนพร้อม Shock: **< 7 วินาที**
- จำนวน Shock ต่อชาร์จ: **≥ 420 ครั้ง** ที่ 200J (ทดสอบมาตรฐาน)

**ตัวเครื่อง**
- น้ำหนัก: ประมาณ 2.0 กก. (รวมแบตเตอรี่)
- แบตเตอรี่: Lithium 4,500 mAh · 12V · แบบใช้แล้วทิ้ง (ชาร์จใหม่ไม่ได้)
- อายุแบตเตอรี่: ≥ 5 ปี (สแตนด์บายในเครื่อง) · ≥ 7 ปี (เก็บแยกในอุณหภูมิเหมาะสม)
- Self-test: อัตโนมัติ รายวัน / รายสัปดาห์ / รายเดือน
- มีหน้าต่างเฉพาะแสดงวันหมดอายุของแผ่นอิเล็กโทรด
- การเชื่อมต่อ: USB · Wi-Fi · SIM 4G (รุ่น i7 ยังไม่มี GPS tracking)
- เสียงแนะนำ 5 ภาษา: ไทย · อังกฤษ · จีน · สเปน · อิตาลี
- อุณหภูมิทำงาน: -25°C ถึง 60°C · เก็บรักษา -30°C ถึง 70°C · ความชื้น 0-95% RH
- ใช้ได้ทั้งผู้ใหญ่และเด็ก — สลับโหมดด้วยสวิตช์ที่ตัวเครื่อง
- เป็นไปตาม ILCOR/AHA Guidelines 2020-2025

**อุปกรณ์ในกล่อง** (Packing List ตาม Item Code โรงงาน)
1. Main Unit (2.215.00085)
2. Disposable AED Electrodes Adult/Ped (5.000.01239)
3. Battery (1.115.00084)
4. User Manual — English (1.601.00412)
5. Warranty Card (1.605.00178)

(ฉบับขายในไทยมีคู่มือภาษาไทยและกระเป๋าใส่เครื่องเพิ่ม)`,
  },
  {
    id: "operation-modes",
    title: "โหมดการทำงาน Standalone vs Connected",
    content: `เครื่อง AED Amoul i7 ทำงานแบบ standalone (ไม่ส่งข้อมูลเข้าส่วนกลาง) เป็นค่าเริ่มต้น — Connectivity จะใช้งานก็ต่อเมื่อลูกค้าเปิดใช้ AED Management Platform เอง

**โหมดที่ 1 — Standalone (ค่าเริ่มต้น)**
- เครื่องทำงานเดี่ยว ไม่เชื่อมต่อระบบใดๆ
- ลูกค้าไม่ต้องเข้า dashboard / ไม่ต้องสมัครอะไรเพิ่ม
- ไม่มีการส่งข้อมูลเข้าส่วนกลาง
- ใช้ช่วยชีวิตได้ปกติทุกอย่าง — Self-test รายวันก็ทำให้เอง
- ดึง event log ผ่าน USB ออกได้เมื่อตรวจสอบเครื่อง

**โหมดที่ 2 — Connected (เลือกเปิดเองเมื่อต้องการดู ECG แบบ real-time)**
ลูกค้าต้องทำเอง 3 ขั้นตอน:
1. เปิดใช้ AED Management Platform
2. ลงทะเบียนข้อมูลเครื่อง
3. เลือกช่องทาง: USB / Wi-Fi / SIM 4G
→ จึงจะเข้าถึงข้อมูลผ่าน dashboard ได้

**ช่องทางการเชื่อมต่อทั้ง 3**
- **USB:** ดาวน์โหลด event log ผ่าน USB ไม่ส่งอัตโนมัติ — ใช้ดึงข้อมูลเมื่อตรวจสอบหลังเหตุการณ์
- **Wi-Fi:** ส่งข้อมูลขึ้นแพลตฟอร์มแบบ real-time ในพื้นที่ที่ Wi-Fi ครอบคลุม
- **SIM 4G:** เชื่อมต่อ 4G cellular ส่งข้อมูล real-time — ในพื้นที่ห่างไกลที่ไม่มี Wi-Fi

**ข้อจำกัด:** รุ่น i7 ยังไม่มี GPS tracking (อยู่ระหว่างการพัฒนากับ supplier) · Wi-Fi/4G มีประโยชน์ก็ต่อเมื่อท่านเปิดใช้แพลตฟอร์ม`,
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

ดังนั้น escalating protocol ที่เริ่มจาก 100J (ผู้ใหญ่) ไม่ได้ "อ่อนแอ" — แต่ปลอดภัยกว่าและมีประสิทธิภาพเทียบเท่า fixed high energy ตามหลักฐานเชิงประจักษ์`,
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
