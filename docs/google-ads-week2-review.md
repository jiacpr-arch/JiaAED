# JiaAED Google Ads — รีวิวรอบ 2 (Week 2)

ผลจริง 14 วัน (30 พ.ค. – 13 มิ.ย. 2026) ดึงจาก PostHog (`www.jiaaed.com`).

## 📊 Funnel จริง 14 วัน

| ขั้น | คน |
| --- | --- |
| คลิกปุ่ม LINE | 76 (192 คลิก) |
| ดูราคา (price_view) | 129 |
| เห็นฟอร์มลีด | 102 |
| เริ่มกรอกฟอร์ม | 5 |
| **ส่งฟอร์มจริง (lead_form_submit)** | **2** |

**จุดตาย = conversion ของหน้าเว็บ ไม่ใช่ตัว Google Ads.** ทราฟฟิกมา ดูราคา คลิก LINE เยอะ
แต่เห็นฟอร์ม 102 → ส่งจริง 2 คน (~1.5%).

## 🔍 Breakdown (จาก checklist รอบ 2)

- **Device:** Mobile 97% (74/76 คน) — desktop/tablet แทบไม่มี → mobile UX มาก่อน, ลด bid desktop ได้
- **พื้นที่:** กรุงเทพ 39 นำขาด, โคราช 4, ชลบุรี 3 → ลีดกระจุก กทม.+เมืองใหญ่
- **Foreign/ขยะ:** มีคลิกจาก US (2) + สวีเดน (2) → ตั้ง location exclude นอกไทย
- **Time of day:** คลิก ~34/76 อยู่ช่วงเที่ยงคืน–ตี 6 (ผิดปกติสำหรับ AED B2B)
  → กลิ่น Search Partners/traffic ขยะ → เช็ค Search Partners ถ้าแย่ปิด + พิจารณา ad schedule
- **Daily trend:** ทราฟฟิกไต่ขึ้น (10–12 คน/วันช่วงหลัง), ฟอร์มวิวสุขภาพดี, ปลายทางพัง

## 🧭 คำตัดสิน

CPL จริงต้องดึงจาก Google Ads (spend) — รัน `npm run report:ads` (ดู §7.8 ใน
`google-ads-setup.md`). แต่ลีดฟอร์มจริง = 2 ใน 14 วัน:

- ถ้า ~฿150/วัน × 14 ≈ ฿2,100 → CPL บนลีดฟอร์ม ≈ **฿1,050 → โซน "แย่" → ห้ามเพิ่มงบ**
- อย่านับคลิก LINE (76) เป็นลีด — มันทำให้ CPL ดูดีหลอกๆ (~฿28)

**สรุป: ยังไม่เข้าเงื่อนไข scale งบ. แก้ conversion ก่อนทุกอย่าง.**

## ✅ Action (เรียงตามผลกระทบ)

1. **อย่าเพิ่มงบ +20%** — ลีดจริงยังน้อย
2. **แก้ conversion หน้าเว็บ** (ROI สูงสุด) — _ทำแล้วใน PR นี้:_ ฟอร์ม phone-first +
   progressive disclosure (ซ่อน บริษัท/อีเมล/รุ่น/ข้อความ ไว้หลังปุ่ม) + เพิ่ม incentive
   ใบเสนอราคา → ให้ฟอร์มดูเป็น "5 วิ" ไม่ใช่แบบฟอร์มองค์กร
3. **ยืนยัน Lead Form Submit = primary conversion**, LINE Click = secondary (ดู §7.8)
4. **เช็ค Search Partners + ตั้ง ad schedule** ตัด traffic กลางดึก
5. **Exclude location นอกไทย** + ขุด negative keyword จาก `report:ads` (อันที่ 0 conv แต่กินงบ)

## 🛠️ เครื่องมือใหม่ใน PR นี้

- `scripts/google-ads-report.mjs` (`npm run report:ads`) — spend/CPL/search terms + คำตัดสินอัตโนมัติ
- `GET /api/aed/google-ads/report?days=14` — เวอร์ชัน endpoint (bearer `AED_INTERNAL_API_KEY`)
- `fetchAdsReport()` / `searchGaql()` ใน `lib/aed/google-ads.ts`
- ฟอร์ม `LeadForm.tsx` phone-first + progressive disclosure
