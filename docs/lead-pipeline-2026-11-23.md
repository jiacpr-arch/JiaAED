# สถานะ Lead ในหลังบ้าน — `/admin/leads` (23 พ.ย. 2569)

ใช้วัดผลโฆษณาถึงยอดขายจริง (brief landing page §14): ฟอร์มคือ lead ไม่ใช่รายได้ · คลิก LINE ไม่ใช่ยอดขาย ·
รายได้นับเฉพาะ "เซ็นสัญญา" และ "รับชำระเงิน"

## สถานะ (ลำดับ funnel)
| สถานะ (DB) | หน้าจอ | ต้องกรอก | ส่ง Google Ads |
|---|---|---|---|
| `new` | ใหม่ | – | – |
| `contacted` | ติดต่อแล้ว | – | – |
| `qualified_lead` | ลูกค้ามีคุณภาพ | – | – |
| `quotation_sent` | ส่งใบเสนอราคาแล้ว | ยอดใบเสนอราคา (ไม่บังคับ) | – |
| `contract_signed` | เซ็นสัญญา/ปิดการขาย | **มูลค่าสัญญา** | ✓ `GOOGLE_ADS_CONTRACT_ACTION_ID` หรือ `GOOGLE_ADS_CONVERSION_ACTION_ID` |
| `payment_received` | รับชำระเงินแล้ว | **ยอดที่รับ** | ✓ เฉพาะเมื่อตั้ง `GOOGLE_ADS_PAYMENT_ACTION_ID` แยก (กันนับซ้ำ) |
| `lost` | ไม่ได้งาน | **เหตุผล** | – |
| `spam` | สแปม/ทดสอบ | – | – (ไม่นับเป็น lead ในรายงาน) |

- ทุกการเปลี่ยนสถานะบันทึกใน `aed_lead_events` (จาก → ไป, ยอด, บันทึก, ผลส่ง Ads)
- ส่ง Google Ads ครั้งเดียวต่อ lead ต่อขั้น (`orderId = lead:<id>:<stage>`), ใช้เฉพาะ gclid (มีเมื่อผู้ใช้ยินยอมคุกกี้) — ไม่ส่งเบอร์/อีเมล
- ผลการส่งจริงอยู่ใน `aed_conversion_log` · ถ้ายังไม่ตั้ง Google Ads API/Action ID ระบบบันทึกไว้เฉย ๆ ไม่พัง
- รายงาน: funnel รวม + แยกแคมเปญ (utm_source / utm_campaign) พร้อมมูลค่าสัญญาและเงินที่รับ → ROAS = รับเงิน ÷ ค่าโฆษณาแคมเปญนั้น
- ไม่รวมแชต LINE (อยู่ใน `aed_deals` ของบอท) และไม่รวมฟอร์มที่กรอกไม่จบ (`source` ขึ้นต้น `partial`)

## ฐานข้อมูล
`supabase/aed_leads_pipeline.sql` — **รันบน production แล้ว (22 พ.ย. 2026)** ผ่าน Supabase: 6 คอลัมน์ใหม่ใน `aed_leads`,
CHECK constraint ของสถานะ, ตาราง `aed_lead_events` (RLS service_role) · leads เดิมทั้งหมดเป็น `new`

## ตั้งค่า (ทำทีหลังได้)
- Google Ads: สร้าง conversion action แบบ Import → "Rental contract signed" (และถ้าต้องการ "Rental payment received") แล้วตั้ง
  `GOOGLE_ADS_CONTRACT_ACTION_ID` / `GOOGLE_ADS_PAYMENT_ACTION_ID` ใน Vercel · ต้องมี `GOOGLE_ADS_*` API credentials (ดู `docs/google-ads-setup.md`)
- ยังไม่มี: ส่งขั้นเหล่านี้เข้า GA4 (ต้องใช้ Measurement Protocol API secret) และ Meta offline events
