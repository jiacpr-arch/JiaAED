# Meta (Facebook/Instagram) Ads Setup — JiaAED

คู่มือเปิด Meta Ads สำหรับ JiaAED โดยใช้ Pixel + Conversions API ที่ติดไว้ใน landing page นี้แล้ว
(คู่กับ `docs/google-ads-setup.md`) — เป้าหมายคือ **Lead บนเว็บ** วัด conversion จริงผ่าน `Lead` event

## สถาปัตยกรรม conversion (เหมือนฝั่ง Google: 2 ขา)

| ขา | ยิงจาก | ไฟล์ | กัน event หาย |
| --- | --- | --- | --- |
| **Browser Pixel** | `fbq('track','Lead', …, {eventID})` | `app/components/MetaPixel.tsx` + `lib/aed/fb-tracking.ts` | — |
| **Conversions API (server)** | `POST graph.facebook.com/<pixel>/events` | `lib/aed/meta-capi.ts` (เรียกจาก `app/api/aed/lead/route.ts`) | ✅ รอด iOS/ad-blocker |

ทั้งสองขาส่ง **`event_id` เดียวกัน** → Meta dedupe นับเป็น 1 lead (ไม่นับซ้ำ)
คลิกปุ่ม LINE **ไม่ถูกนับเป็น conversion** โดยตั้งใจ (เหมือนฝั่ง Google) — นับเฉพาะ lead form submit จริง

## 1. Environment variables (Vercel)

ตั้งใน Vercel project → Settings → Environment Variables (Production + Preview):

| ตัวแปร | ตัวอย่าง | จำเป็น |
| --- | --- | --- |
| `NEXT_PUBLIC_META_PIXEL_ID` | `1103064446544207` | ✅ เปิด Pixel ฝั่ง browser |
| `META_CAPI_TOKEN` | `EAAG...` | ✅ Conversions API access token |
| `META_TEST_EVENT_CODE` | `TEST12345` | optional — เฉพาะตอน debug ใน Test Events |

ถ้ายังไม่ใส่ค่า → Pixel ไม่โหลด, CAPI เป็น no-op (ไม่กระทบ landing page)

## 2. หา Pixel ID + CAPI token

1. **Pixel ID**: Meta Events Manager → เลือก dataset/pixel → Settings → คัดลอก Dataset ID
   - ของ business "Jiacpr" ที่มีอยู่: `พิกเซลของ Garnam Jia` = `1103064446544207` (เก่า/trust สูง) หรือสร้าง dataset ใหม่ชื่อ `JiaAED` ก็ได้
2. **CAPI token**: Events Manager → dataset → Settings → **Conversions API → Generate access token** → คัดลอกใส่ `META_CAPI_TOKEN`
3. รัน DB migration: Supabase → SQL Editor → run `supabase/aed_leads_fbclid.sql` (เพิ่มคอลัมน์ `fbclid`)
4. Redeploy ใน Vercel

## 3. Verify domain + Aggregated Event Measurement

1. **Business Settings → Brand Safety → Domains** → Add `jiaaed.com` → verify ด้วย DNS TXT ที่ Z.com
   (ดู `docs/domain-migration.md` §7)
2. **Events Manager → Aggregated Event Measurement** → ตั้ง `Lead` เป็น event อันดับ 1
3. เพจที่ใช้ยิง: **Jia Training Center - อบรม CPR & AED** (on-brand กับเครื่องมือแพทย์)

## 4. Validate tracking ก่อนเปิด ads

1. เปิด `https://jiaaed.com/?fbclid=test123`
2. F12 → Console → `localStorage.getItem('jiaaed_fbclid')` → ต้องได้ `test123`
3. กรอก lead form → ส่ง
4. **Events Manager → Test Events** (ใส่ `META_TEST_EVENT_CODE` ก่อน) → ต้องเห็น `Lead`
   - เห็นทั้ง **Browser** และ **Server** ที่ dedupe เป็น event เดียว = ถูกต้อง
5. Network tab → เห็น request ไป `facebook.com/tr` (browser) และ row ใน `aed_leads` มี `fbclid`

## 5. Campaign (สร้างผ่าน Ads MCP ได้)

- **Objective**: Leads (Sales/Conversions) → optimize for `Lead`
- **Ad Set**: location ไทย · งบเริ่ม 200–300 บาท/วัน · กลุ่ม in-market medical / safety / HR / เจ้าของกิจการ · placement Advantage+
- **Creative**: รูปจาก `/public/images/` (aed-floorstand, aed-wallcabinet, product-main, lifestyle-cpr) + headline/copy รีไซเคิลจาก RSA ใน `google-ads-setup.md` (อย. / ฆพ.743/2569 / รับประกัน / ราคาเริ่ม 39,999)
- **Ad URL**: `https://jiaaed.com/?utm_source=facebook&utm_medium=cpc&utm_campaign=<name>`

> ⚠️ AED = เครื่องมือแพทย์ — เตรียม อย. `68-2-2-2-0005243` + ใบโฆษณา `ฆพ.743/2569` ไว้ เผื่อ ad review ขอ
> สร้างแคมเปญผ่าน MCP ให้เป็น **PAUSED** ก่อน → รีวิว preview → ค่อย activate (เงินเริ่มเดินตอน activate)
