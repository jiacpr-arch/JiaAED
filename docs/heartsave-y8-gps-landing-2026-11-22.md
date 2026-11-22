# Landing page: JIA Yuwell HeartSave Y8 GPS 4G (เช่า) — 22 พ.ย. 2026

URL: `/aed/heartsave-y8-gps` · สถานะ: **PREVIEW (noindex, ไม่อยู่ใน sitemap, มีแถบ PREVIEW)**
เปิดเผยแพร่โดยเปลี่ยน `Y8_GPS_LANDING_PUBLISHED = true` ใน `lib/aed/y8-gps-landing.ts`
**หลัง** เจ้าของเซ็นผ่านทุกข้อในหัวข้อ "ต้องอนุมัติก่อนยิง Ads" ด้านล่าง

## โครงหน้า
| ส่วน | กลุ่ม | CTA | lead `source` / event `variant` |
|---|---|---|---|
| Hero | ทั้งสอง | ปุ่มแยก `#rent` / `#org` (`data-cta=y8gps_hero_rent/org`) | — |
| `#rent` | ลูกค้าเช่า | ราคาเริ่ม ฿1,830/เดือน (STANDARD รายปี) + เงื่อนไข, LINE (`data-line-cta=y8gps_rent_line`), โทร, ฟอร์มฝากเบอร์ | `y8gps_rent_form` / `y8gps_rent` |
| PRIMEDIC CLOUD | ทั้งสอง | snapshot 19 / 15 Normal / 4 Alert ป้าย "ภาพ ณ 23 พฤศจิกายน 2569 · ไม่ใช่ข้อมูลสด" | — |
| `#org` | องค์กร/ภาครัฐ | ฟอร์ม White Paper + ฟอร์มนัดเดโม (มีช่องชื่อหน่วยงาน) | `y8gps_org_form` / `y8gps_org_whitepaper`, `y8gps_org_demo` |
| Footnote | — | อย. + ฆพ.287/2567 (ใบที่ระบุ Y8) | — |

ภาพที่ใช้: `/images/yuwell-gps-aed.webp`, `/images/primedic-y8-open.png` (ภาพเครื่องจริงสีแดงที่อยู่บนเว็บแล้ว)
**ไม่ใช้** `/images/cloud-dashboard.png` (ภาพประกอบ ตัวเลข 24/20/3/1 ไม่ใช่ของจริง — มี test กันไว้)

## ภาพหน้าจอ PRIMEDIC CLOUD — ยังไม่ได้ใส่
ภาพที่ส่งในแชทอีกระบบไม่ได้ส่งต่อมาถึง repo/session นี้ และค้นใน Google Drive ไม่พบ ตอนนี้หน้าแสดง
เฉพาะตัวเลข snapshot เป็นข้อความ (ไม่มีข้อมูลส่วนบุคคล) ขั้นตอนเมื่อได้ไฟล์:

1. วางไฟล์ต้นฉบับไว้นอก repo (ห้าม commit ต้นฉบับ)
2. เขียน `boxes.json` ครอบ: ชื่อผู้ใช้ · อีเมล · เบอร์โทร · ชื่อลูกค้า · ที่อยู่ · Serial Number · หมุด GPS/พิกัดรายเครื่อง
   (รวมแผนที่ทั้งกรอบถ้ามีหมุดรายเครื่อง) · แถบ URL/แท็บเบราว์เซอร์ที่อาจมีชื่อบัญชี
3. `node scripts/redact-image.mjs ต้นฉบับ.png public/images/primedic-cloud-2026-11-23-redacted.png boxes.json`
   (ทาสีทึบลงพิกเซลแล้ว encode ใหม่ ไม่มี metadata — กู้ข้อมูลใต้กล่องไม่ได้)
4. เปิดดูไฟล์ผลลัพธ์ด้วยตาทั้งภาพ ซูมทุกมุม แล้วจึงตั้ง `CLOUD_SCREENSHOT` ใน `lib/aed/y8-gps-landing.ts`
   (test บังคับชื่อไฟล์ต้องมีคำว่า `redacted`)
5. ตรวจว่าตัวเลขบนภาพตรง 19/15/4 และวันที่ 23 พ.ย. 2569

## ต้องอนุมัติก่อนยิง Ads (เจ้าของ)
1. **ฆพ. ครอบคลุมข้อความใหม่หรือไม่ — ยังไม่ครอบคลุมเท่าที่ตรวจได้**
   - ฆพ.287/2567 อนุญาต "ตามเอกสารข้อความโฆษณาที่แนบท้าย จำนวน 1 หน้า" — repo มีเฉพาะหน้า 1 และ 3
     (`public/documents/khop-287-2567-y8.jpg`) ไม่มีหน้าข้อความที่อนุมัติ จึง **ยืนยันไม่ได้**
     ว่าคำว่า GPS / 4G / PRIMEDIC CLOUD / Dashboard / แจ้งเตือน / ราคาเช่า อยู่ในข้อความที่อนุญาต
   - ฆพ. ระบุสื่อ "เว็บไซต์ ชื่อ www.jia1669.com" — **ไม่ใช่ jiaaed.com** (ดู `docs/jia1669-domain-alignment-2026-07-17.md`)
     Ads ที่ final URL เป็น jiaaed.com ต้องยื่นแก้ไข/ขอ ฆพ. ใหม่ก่อน
   - ข้อความใหม่ที่น่าจะต้องยื่นขอ: GPS 4G · PRIMEDIC CLOUD · ตัวเลข snapshot 19/15/4 · "แจ้งเตือน" · "White Paper" · ราคาเช่า
   - ฆพ.287/2567 หมดอายุ **21 ก.พ. 2570** และ อย. 65-2-2-2-0013415 ใช้ได้ถึง **31 ธ.ค. 2569 (อีก ~5 สัปดาห์)**
     — แคมเปญที่ยิงข้ามวันนั้นต้องมีใบต่ออายุก่อน
2. ~~ราคา ฿1,990~~ → **เจ้าของเลือกใช้ STANDARD ฿1,830/เดือน (22 พ.ย. 2026)** = ฿22,000/ปี ÷ 12, 1 เครื่อง,
   มัดจำ ฿5,000 (ยกเว้นได้ถ้ามี PO) — ดึงจาก `lib/aed/rental-prices.ts` อัตโนมัติ ตรงกับหน้า `/aed/rental`
   (ครีเอทีฟ Ads ทุกชิ้นต้องเปลี่ยนเป็น ฿1,830 และระบุ "เฉลี่ย/เดือน ชำระรายปี ไม่รวม VAT" ด้วย)
3. **LINE @JIA1669**: เว็บใช้ OA `@273fzpzs` (แสดงเป็น @jiaaed) ซึ่งผูก webhook/บอท/การนับ follow ไว้ หน้านี้จึงใช้ OA เดิม
   ถ้าต้องการ @JIA1669 จริง ต้องตั้งค่า Messaging API ของ OA นั้นก่อน แล้วเปลี่ยนที่ `lib/aed/line.ts` ที่เดียว
4. **"4G"** ยังไม่มีในข้อมูลสินค้าใดใน repo — ยืนยันสเปกโมดูลกับ Yuwell
5. **Y8 งดจำหน่าย** (15 พ.ย. 2026) — หน้านี้ขายเฉพาะ "เช่า" ไม่มีราคาซื้อ ตรงกับฮาร์ดแวร์ fleet เช่า (Y8 + GPS)
6. **White Paper** ยังไม่มีไฟล์ — ฟอร์มเก็บ lead แล้วทีมงานส่งเอกสารเอง ต้องเตรียมเอกสารก่อนยิงแคมเปญภาครัฐ
7. Cloud Dashboard ให้ลูกค้าเข้าดูเองเฉพาะ ELITE (`subscriptionMatrix`) — หน้าระบุไว้แล้ว อย่าให้แอดเคลมเกิน

## UTM (ใช้ตามนี้เพื่อแยกสองกลุ่ม)
```
?utm_source=facebook|google&utm_medium=paid_social|cpc&utm_campaign=y8gps_rent_2611&utm_content=<creative>
?utm_source=google|facebook&utm_medium=cpc|paid_social&utm_campaign=y8gps_gov_2611&utm_content=whitepaper|demo
```
- UTM/gclid เก็บลง localStorage หลังผู้ใช้กด "ยอมรับ" คุกกี้ (พฤติกรรมเดิมของเว็บ) และติดไปกับ lead (`aed_leads.utm_*`)
- `aed_leads.page_url` เก็บ URL เต็มพร้อม query เสมอ แม้ไม่ยอมรับคุกกี้

## การวัดผล
- **GA4 / Google Ads / Meta**: ใช้ conversion เดิมของ `MiniLeadForm` (`lead_form_submit` + Ads lead conversion + Meta Lead, ทำงานเมื่อยอมรับคุกกี้)
  และ `line_click` (`location=y8gps_rent_line`, `y8gps_*_form_alt`) — แยกกลุ่มด้วย `variant`
- **Lead**: `aed_leads.source in ('y8gps_rent_form','y8gps_org_form')`, `product_id='yuwell-gps'`, `message` ขึ้นต้น `[เช่า Y8 GPS]` / `[องค์กร/ภาครัฐ Y8 GPS]`
- **สัญญาเช่าจริง**: ตาราง `aed_rental_billing` ไม่มี lead_id — จับคู่ด้วยเบอร์โทร (read-only):
```sql
select l.source, l.utm_campaign, count(distinct l.id) leads, count(distinct b.id) contracts,
       sum(b.monthly_total_thb) mrr_thb
from aed_leads l
left join aed_rental_billing b
  on regexp_replace(b.customer_phone,'\D','','g') = regexp_replace(l.phone,'\D','','g')
 and b.created_at >= l.created_at
where l.source in ('y8gps_rent_form','y8gps_org_form') and l.created_at >= '2026-11-22'
group by 1,2 order by 1,2;
```
  สัญญาภาครัฐที่ทำนอก Stripe (PO/ใบสั่งซื้อ) ต้องบันทึกในชีตแยกพร้อมเบอร์/ชื่อหน่วยงานของ lead
