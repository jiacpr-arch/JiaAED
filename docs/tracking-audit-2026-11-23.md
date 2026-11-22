# ตรวจ GTM / GA4 / Meta Pixel — jiaaed.com (23 พ.ย. 2569)

## สิ่งที่ติดตั้งบนเว็บ
| ระบบ | ID | โหลดเมื่อ |
|---|---|---|
| GTM | **ไม่มี** — ใช้ gtag.js ตรง (`app/components/GoogleTags.tsx`) | – |
| GA4 | `G-4PZZC620E2` | หลังกด "ยอมรับ" คุกกี้ (Consent Mode v2 default denied จาก `public/jia-consent.js`) |
| Google Ads | `AW-10780588709` (loader) · conversions ส่งไป `AW-873507669` | หลังยอมรับ |
| Meta Pixel + CAPI | dataset `1103064446544207` (พิกเซลของ Garnam Jia — ใช้ร่วมกับ www.jia1669.com) | หลังยอมรับ / CAPI ฝั่ง server เมื่อยอมรับ |
| OpenAI Ads pixel | `8Qwm1bqunw9i9Ad4LXxZeX` | หลังยอมรับ |

**ไม่แนะนำให้เพิ่ม GTM ตอนนี้** — แท็กทั้งหมดติดในโค้ดแล้วพร้อม consent gating; ถ้าใส่ GTM ที่มี GA4/Pixel ซ้ำจะนับซ้ำสองเท่า

## ผลทดสอบในเบราว์เซอร์ (/aed/gps-rental, ใช้โค้ดเดียวกับ production)
| ขั้น | GA4 | Google Ads | Meta |
|---|---|---|---|
| ก่อนยอมรับคุกกี้ | ไม่ส่งอะไร ✓ | ไม่ส่ง ✓ | ไม่ส่ง ✓ |
| ยอมรับ | page_view, `view_rental_page` | – | PageView |
| เลื่อนถึงราคา | `view_pricing` | – | – |
| คลิก LINE | `click_to_line`, `click_line` | conversion "ไลน์" (฿494.8) | **`Lead`** ⚠️ |
| ส่งฟอร์มสำเร็จ | `lead_form_submit`, `generate_lead` | conversion "Lead Form Submit" (฿0) | `Lead` (+ CAPI, dedup event_id) |

แก้แล้ว: `view_rental_page` เดิมยิงก่อนมี consent จึงไม่ถึง GA4 → ตอนนี้ส่งหลังยอมรับ

## Meta (ข้อมูลจริงจาก Events Manager, 26 ต.ค.–22 พ.ย.)
- jiaaed.com ส่งเข้า dataset นี้จริง (2–58 events/วัน) · Lead: Event Match Quality **9.3/10**, CAPI coverage 80.6%, dedup ด้วย event_id 89%
- ad set "TH กว้าง 20+ — Lead (Pixel) — หน้าเช่า" optimize ด้วย Lead (spend ช่วงนี้ ฿0)
- ⚠️ **คลิก LINE ยิง Meta `Lead`** (พฤติกรรมเดิมของเว็บ, `LineClickTracker`) → Lead ใน Meta = ฟอร์ม + คลิก LINE ปนกัน
  ซึ่งขัดกับ brief ("ห้ามนับการคลิก LINE เป็นยอดขาย/lead") — **รอเจ้าของตัดสินใจ** ทางเลือก: เปลี่ยนคลิก LINE เป็น `Contact`
  แล้วให้ ad set optimize ด้วย Lead (ฟอร์มจริง) — กระทบการเรียนรู้ของ ad set ที่ใช้ Lead อยู่

## ต้องทำใน GA4 / Google Ads (ทำจากหน้าเว็บของ Google เท่านั้น)
1. GA4 → Admin → Events → ทำเครื่องหมาย **`generate_lead` เป็น Key event** (อย่าทำ `lead_form_submit` ซ้ำ)
2. GA4 → Admin → Custom definitions: เพิ่ม event-scoped dimension `lead_source`, `location`, `page` (ถ้าต้องการแยกรายงาน)
3. Google Ads: conversion "ไลน์" ตั้งเป็น **Secondary** (ไม่ใช้ประมูล) · "Lead Form Submit" เป็น Primary สำหรับแคมเปญเช่า
4. Google Ads: สร้าง Import conversion "Rental contract signed" → ใส่ ID ใน Vercel `GOOGLE_ADS_CONTRACT_ACTION_ID` (ดู `docs/lead-pipeline-2026-11-23.md`)
5. ทดสอบจริงด้วย Tag Assistant / GA4 DebugView บน https://jiaaed.com/aed/gps-rental (จากเครื่องนี้ต่อ Google ไม่ได้)
