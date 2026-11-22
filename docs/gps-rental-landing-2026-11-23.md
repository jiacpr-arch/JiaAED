# Landing page: เช่า AED GPS 4G — `/aed/gps-rental` (23 พ.ย. 2569)

สร้างจาก MASTER CONTEXT v1.0 (JIA AED SMART NETWORK) · เนื้อหา/ตัวเลขทั้งหมดอยู่ที่ `lib/aed/gps-rental-page.ts`

## การตัดสินใจของเจ้าของ (22 พ.ย. 2026)
- ราคา **เริ่ม ฿1,830/เดือน** = แผนรายปี STANDARD (฿22,000/ปี) — ไม่ใช้ ฿1,990 ในเอกสาร เพราะไม่มีแผนรองรับ (test กันไว้)
- LINE ใช้บัญชีเดิมของเว็บ (แสดง @jiaaed) — @JIA1669 ยังไม่ได้ผูกบอท/การนับ follow
- ขึ้นเว็บจริงทันที (index + sitemap)

## ส่วนของหน้า (ตามเอกสาร)
1 Hero (navy/teal/orange, ภาพเครื่องจริง, CTA ใบเสนอราคา + LINE + ดูระบบ Monitoring, หมายเหตุราคา) ·
2 Pain points · 3 สินค้า (สเปกจาก `primedicSharedSpecs`; 4G/GPS ใช้ถ้อยคำ "ตามรุ่นและการตั้งค่า") ·
4 PRIMEDIC CLOUD (ภาพจริงเบลอแล้ว + 19/15/4 ป้าย "ภาพ ณ … ไม่ใช่สถานะ Live") · 5 GPS 4G สถานการณ์จำลอง + แผนภาพ + ข้อจำกัด + "โทร 1669 เริ่ม CPR" ·
6 แพ็กเกจ 3 แบบ · 7 บริการหลังการขาย (SLA/ตรวจหน้างานจาก tier matrix) · 8 อบรม (ตาม tier ไม่บอกว่าฟรีทุกแผน) ·
9 โครงการ ฿10,000 (ข้อความเดิมจาก `promotion.ts` ไม่มี case study) · 10 ภาครัฐ/องค์กร (ไม่ระบุชื่อหน่วยงานรัฐ ไม่มีตัวเลขจุด/งบ) ·
11 หลักฐาน (อย. + ฆพ.287/2567 แยกกัน, เงื่อนไขเช่า) · 12 ฟอร์ม · 13 FAQ 10 ข้อ (+ FAQPage JSON-LD)
- มือถือ: แถบล่าง = LINE + "ขอใบเสนอราคา" (แทนปุ่มโทร เฉพาะหน้านี้)
- ลิงก์เข้า: footer ทุกหน้า, ปุ่มใน hero ของ `/aed/rental`

## ฟอร์มและการวัดผล
- ฟิลด์: ต้องการ (เช่า/ซื้อ/ปรึกษา/สาธิต/เอกสารข้อเสนอ/โครงการ) · ชื่อ · องค์กร · เบอร์โทร* · LINE ID · จังหวัด · จำนวนเครื่อง · ยินยอม PDPA*
- บันทึก `aed_leads` (`source=gps_rental_form`, `product_id=yuwell-gps`, ความต้องการ/จังหวัด/LINE ID ใน `message`, UTM, gclid, page_url) → แจ้งทีมผ่านระบบเดิม (LINE/อีเมล) → หน้าขอบคุณ + ปุ่ม LINE
- Conversion ยิงเฉพาะเมื่อ server รับ lead แล้ว (ไม่ยิงตอนคลิก/ตอนกรอกไม่ครบ/honeypot): `generate_lead` (GA4) · Google Ads lead · Meta Lead (dedup กับ CAPI) · OpenAI `lead_created` — ต้องยินยอมคุกกี้
- เหตุการณ์หน้า: `view_rental_page`, `view_pricing`, `click_line` (GA4 เมื่อยินยอม + analytics ภายใน) — **ไม่ใช่ conversion**
- **GA4: ตั้ง `generate_lead` เป็น key event** (อย่าตั้ง `lead_form_submit` ซ้ำ จะนับสองครั้ง)
- ยังไม่มี: `qualified_lead`, `quotation_sent`, `rental_contract_signed`, `rental_payment_received` — ต้องมีสถานะ lead ใน admin ก่อน
  แล้วส่งสัญญา/การชำระจริงเข้า Google Ads ผ่าน `/api/aed/google-ads/conversion` (มีอยู่แล้ว ใช้ gclid ของ lead)

## UTM
`/aed/gps-rental?utm_source=google|facebook|openai&utm_medium=cpc|paid_social&utm_campaign=gps_rent_<yymm>&utm_content=<creative>`
ภาครัฐ: `utm_campaign=gps_gov_<yymm>` และลิงก์ตรง `#enterprise`

## ยังต้องทำก่อน/ระหว่างยิง Ads (Definition of Done ที่ยังไม่ครบ)
- **ฆพ.**: ฆพ.287/2567 (Y8) ระบุสื่อ www.jia1669.com และอนุญาตเฉพาะข้อความแนบท้าย — ยังไม่ได้ยืนยันว่าครอบคลุมข้อความในหน้านี้และ jiaaed.com · หมดอายุ 21 ก.พ. 2570
- **อย.** 65-2-2-2-0013415 ใช้ได้ถึง **31 ธ.ค. 2569**
- ภาพเครื่อง 4 มุมของเจ้าของ (ยังไม่ได้รับไฟล์ — ตอนนี้ใช้ภาพในแคตตาล็อกที่ระบุว่าเป็นรุ่นนี้), ภาพทีม/งานติดตั้งจริง, รีวิวลูกค้า, วิดีโอ field test
- เงื่อนไขแพ็กเกจตู้ (ราคา/ชนิด) และค่าส่ง-ติดตั้งต่างจังหวัด — ตอนนี้ "ตามใบเสนอราคา"
- สเปก 4G ยืนยันกับ Yuwell · สิทธิ์ใช้ภาพระบบ PRIMEDIC CLOUD เพื่อโฆษณา
- ทดสอบ GA4/Ads conversion บนเว็บจริงด้วย Tag Assistant หลังเปิด
