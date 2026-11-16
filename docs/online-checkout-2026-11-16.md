# ซื้อออนไลน์ผ่าน Stripe + ราคาเดิมขีดฆ่า — 16 พ.ย. 2026

## สำรวจราคาตลาด (ก่อน VAT, ราคาจากหน้าเว็บร้าน, 16 พ.ย. 2026)
| รุ่น | ราคาขายในตลาด | "ราคาเต็ม" ที่ร้านอื่นขีด | เรา |
|---|---|---|---|
| Yuwell Y0 | 39,900 (Siam Medical Import, Now Oxygen) | 49,900–55,000 | 39,999 |
| Yuwell Y8 | 45,900–49,900 | 78,900 (Vennoxy) | งดจำหน่าย |
| Yuwell Y2 | แทบไม่มีร้านอื่น · Jia1669 69,999 | 99,000 | 49,900 |
| Philips FRx | 55,490–67,500 | 80,000 | – |
| Zoll AED Plus | 59,900–69,999 | 120,000 | – |
| Mindray C2 (จอสี) | 79,500 | – | – |
| Zoll AED 3 (จอสี) | 79,990–87,300 | 150,000 | – |

## ราคาขีดฆ่า — กติกา
- ขีดได้เฉพาะ **ราคาที่เว็บเราเคยขายจริง** (ห้ามใช้ราคาเต็มตลาด/ราคาร้านอื่น) — ใส่ใน `previousPrice` ของรุ่นใน `lib/aed/primedic.ts`
  พร้อมช่วงที่เคยขาย และ `showUntil` ไม่เกิน ~90 วันหลังเลิกขายราคานั้น (มีเทสต์บังคับ)
- Y2: ราคาเดิม ฿59,999 (ขาย 26 ก.ย.–13 พ.ย. 2026) → แสดงถึง 13 ก.พ. 2027
- Y0: ไม่มีราคาเดิมที่สูงกว่า (39,000 → 39,999) — ถ้าจะขีดต้องได้ "ราคาตั้ง" เป็นลายลักษณ์อักษรจาก Yuwell ก่อน

## ซื้อออนไลน์
- ขายเฉพาะ 1 เครื่อง รุ่นที่ลิสต์บนเว็บ (Y2, Y0) — ราคาเว็บ + VAT 7% (Y2 = ฿53,393, Y0 = ฿42,798.93)
- หลายเครื่อง / ภาครัฐ / เช่าซื้อ / GPS → ใบเสนอราคาทาง LINE เหมือนเดิม
- ปุ่ม "ซื้อออนไลน์" → `/api/checkout` → หน้า Stripe (บัตร + PromptPay, เก็บที่อยู่จัดส่ง, เบอร์, เลขผู้เสียภาษี/ชื่อบริษัท/สาขา)
- จ่ายแล้ว → `/api/stripe/webhook` บันทึก `aed_orders` + แจ้ง LINE แอดมิน → ลูกค้าเห็นหน้า `/aed/checkout/success`

## ขั้นตอนเปิดใช้ (เจ้าของ)
1. Supabase SQL Editor: รัน `supabase/aed_orders.sql`
2. Stripe Dashboard → Settings → Payment methods: เปิด **PromptPay** (และ Cards)
3. Stripe → Developers → Webhooks: แก้ endpoint เดิม `https://www.jiaaed.com/api/stripe/webhook`
   ให้ฟัง `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` → คัดลอก Signing secret
4. Vercel env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (ทดสอบด้วย `sk_test_…` ก่อน แล้วค่อยเปลี่ยนเป็น live) → redeploy
5. (ไม่บังคับ) `STRIPE_PAYMENT_METHODS=promptpay` ถ้าไม่รับบัตร · `CHECKOUT_DISABLED=1` เพื่อซ่อนปุ่มชั่วคราว
6. Stripe → Settings → Customer emails: เปิด "Successful payments" ให้ลูกค้าได้ใบเสร็จอัตโนมัติ

ยังไม่ตั้ง `STRIPE_SECRET_KEY` = ปุ่มซื้อออนไลน์ไม่แสดง เว็บทำงานเหมือนเดิม (แต่ราคาเดิมขีดฆ่าของ Y2 แสดงทันที)
