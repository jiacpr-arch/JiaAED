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

## ภาพหน้าจอ PRIMEDIC CLOUD (เจ้าของส่ง 22 พ.ย. 2026 — ปิดทับแล้ว)
| ไฟล์บนเว็บ | ต้นฉบับ | ปิดทับ | เก็บไว้ให้เห็น |
|---|---|---|---|
| `primedic-cloud-map-2026-11-23-redacted.png` | AED map (Streets) | เบอร์โทรบัญชี · หมุดเครื่องทุกจุด (เชียงราย ลำปาง กรุงเทพฯ/ปริมณฑล) · ตัดแถบเบราว์เซอร์ | ตัวนับ Normal 15 · Alert 4 · Non-IOT 0 |
| `primedic-cloud-device-2026-11-23-redacted.png` | Installation information (รายเครื่อง) | Device SN · Battery SN · ป้ายบาร์โค้ด/QR บนตัวเครื่อง · แผนที่ · พิกัด · ที่อยู่ (ตัดส่วน Location ทิ้ง) | รุ่น Y8 · วันผลิต · วันหมดอายุแผ่นอิเล็กโทรด/แบตเตอรี่ |

| `primedic-cloud-map-satellite-2026-11-23-redacted.png` | AED map (Satellite) — แกลเลอรีส่วนองค์กร | เหมือนแบบ Streets | ตัวนับ 15 / 4 / 0 |
| `primedic-cloud-installs-2026-11-23-redacted.png` | Device installation list — แกลเลอรีส่วนองค์กร | เบอร์บัญชี · คอลัมน์ Customer, Device location, Device SN ทั้งหมด | วันเวลาติดตั้ง · ปุ่มขั้นตอนติดตั้ง |

**ไม่ใช้:** Rescue History (เกือบทั้งหมดเป็น SN และเป็นเหตุใช้งานช่วยชีวิตจริง — คำกล่าวอ้างที่อ่อนไหวในโฆษณาเครื่องมือแพทย์)

ภาพชุดที่สอง (Device details ตาราง %แบต/อุณหภูมิ/Self-test, Customer list ที่มี 19 เครื่อง) ยังไม่ได้รับเป็นไฟล์
หากต้องการใช้ ตาราง Device details ต้องปิด Device SN + Battery SN, ส่วน Customer list ต้องปิดอีเมล ชื่อ และเบอร์ทั้งหมด

ทำซ้ำได้ด้วย `node scripts/redact-image.mjs <ต้นฉบับ> public/images/<ชื่อ>-redacted.png <boxes.json>` (รองรับ `crop`)
ต้นฉบับห้าม commit · test บังคับไฟล์ต้องลงท้าย `-redacted.png` และไม่มี metadata

## ฝังใน www.jia1669.com (เจ้าของเลือก 22 พ.ย. 2026)
ยิง Ads ไปที่หน้าบน **www.jia1669.com** (เว็บที่ ฆพ.287/2567 ระบุเป็นสื่อ) ซึ่งฝังหน้านี้เป็น iframe — แบบเดียวกับ Yuwell Y2
- route สำหรับฝัง: `/aed/heartsave-y8-gps/embed` — ไม่มี header/footer ของ jiaaed, noindex เสมอ, ลิงก์ออกนอกหน้าเปิดแท็บใหม่
- ให้ฝังได้เฉพาะ `https://jia1669.com` / `https://www.jia1669.com` (CSP `frame-ancestors` ใน `next.config.ts`) หน้า `/aed/heartsave-y8-gps` ปกติยังห้าม frame
- ซ่อนแถบ LINE/โทร/แชทลอยใน iframe (หน้ามี CTA ของตัวเอง) · แถบคุกกี้ย้ายไปอยู่บนสุดของกรอบให้เห็นทันที

**ขั้นตอนใน MakeWebEasy:** สร้างหน้าใหม่ (เช่น `www.jia1669.com/aed-gps-rental`) → ใส่บล็อก HTML/โค้ดฝัง → วางโค้ดนี้ทั้งก้อน:
```html
<div id="jiaaed-y8gps"></div>
<script>
(function () {
  var box = document.getElementById("jiaaed-y8gps");
  var f = document.createElement("iframe");
  f.src = "https://jiaaed.com/aed/heartsave-y8-gps/embed" + window.location.search;
  f.title = "เช่า AED HeartSave Y8 GPS";
  f.style.cssText = "display:block;width:100%;border:0;min-height:2600px";
  f.setAttribute("allow", "clipboard-write");
  box.appendChild(f);
  window.addEventListener("message", function (e) {
    if (["https://jiaaed.com","https://www.jiaaed.com"].indexOf(e.origin) < 0) return;
    var d = e.data || {};
    if (d.type === "jiaaed:height" && d.height > 0) { f.style.minHeight = "0"; f.style.height = d.height + "px"; }
    if (d.type === "jiaaed:scroll") window.scrollTo({ top: f.getBoundingClientRect().top + window.scrollY + d.top, behavior: "smooth" });
  });
})();
</script>
<noscript><a href="https://jiaaed.com/aed/heartsave-y8-gps">เช่า AED HeartSave Y8 GPS</a></noscript>
```
โค้ดนี้ส่ง query ของหน้า jia1669 (utm_*, gclid, fbclid) ต่อเข้า iframe, ปรับความสูงกรอบตามเนื้อหา และเลื่อนหน้าเมื่อกดปุ่ม #rent / #org
ถ้า MakeWebEasy ไม่ยอมรับ `<script>` ให้ใช้ iframe ธรรมดาแทน (จะเสีย UTM/gclid และความสูงคงที่):
`<iframe src="https://jiaaed.com/aed/heartsave-y8-gps/embed" style="width:100%;height:5400px;border:0"></iframe>`

**ข้อจำกัดการวัดผลใน iframe**
- GA4/Ads tag/Meta Pixel ทำงานใน iframe ของ jiaaed.com หลังผู้ใช้กด "ยอมรับ" — Safari/iOS และ Chrome ที่ปิด third-party cookie
  จะบล็อกคุกกี้ของ tag ใน iframe ตัวเลขฝั่งเบราว์เซอร์ (GA4 session, Ads conversion tag, Pixel) **จะต่ำกว่าจริง**
- แหล่งที่เชื่อถือได้กว่า: แถว `aed_leads` (source / utm_* / gclid / page_url ที่มี query เต็ม) และอัปโหลด conversion
  สัญญาเช่าจริงย้อนกลับเข้า Google Ads ด้วย gclid ผ่าน endpoint offline conversion ที่มีอยู่ ส่วน Meta ใช้ CAPI ฝั่ง server (เมื่อยินยอม)
- แนะนำให้ติด GA4/Pixel บนหน้า jia1669.com เองด้วย (ระดับหน้า) เพื่อนับ landing view ของแคมเปญ
- ฆพ.: การยิงไป jia1669.com แก้ปัญหา "ชื่อสื่อ" แต่ **ข้อความในหน้า (GPS 4G, PRIMEDIC CLOUD, ราคาเช่า, 19/15/4) ยังต้องอยู่ในข้อความที่ได้รับอนุญาต** — ข้อ 1 ด้านล่างยังค้าง

## ต้องอนุมัติก่อนยิง Ads (เจ้าของ)
1. **ฆพ. ครอบคลุมข้อความใหม่หรือไม่ — ยังไม่ครอบคลุมเท่าที่ตรวจได้**
   - ฆพ.287/2567 อนุญาต "ตามเอกสารข้อความโฆษณาที่แนบท้าย จำนวน 1 หน้า" — repo มีเฉพาะหน้า 1 และ 3
     (`public/documents/khop-287-2567-y8.jpg`) ไม่มีหน้าข้อความที่อนุมัติ จึง **ยืนยันไม่ได้**
     ว่าคำว่า GPS / 4G / PRIMEDIC CLOUD / Dashboard / แจ้งเตือน / ราคาเช่า อยู่ในข้อความที่อนุญาต
   - ฆพ. ระบุสื่อ "เว็บไซต์ ชื่อ www.jia1669.com" — **ไม่ใช่ jiaaed.com** (ดู `docs/jia1669-domain-alignment-2026-07-17.md`)
     → เจ้าของเลือกยิงไปหน้าบน jia1669.com ที่ฝัง iframe (ดูหัวข้อด้านบน) — ไม่ยิง Ads ไป jiaaed.com ตรง
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
www.jia1669.com/<หน้า>?utm_source=facebook|google&utm_medium=paid_social|cpc&utm_campaign=y8gps_rent_2611&utm_content=<creative>
www.jia1669.com/<หน้า>?utm_source=google|facebook&utm_medium=cpc|paid_social&utm_campaign=y8gps_gov_2611&utm_content=whitepaper|demo
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
