# Ad creative assets — JiaAED (AED Yuwell Y2)

Use ONLY AED product images when building Meta/Google ad creatives for this
project. The copy is about the **AED Yuwell Y2 defibrillator** — the image must
show the AED, not another product.

> **Amoul i7 discontinued (ก.ค. 2026) + คำสั่งระงับโฆษณาจาก อย.** — Yuwell Y2
> replaced it as the site-wide featured product. `product-main.png` (below) is
> Amoul-only creative and is NOT used anywhere in the codebase anymore — the new
> hero photo is `yuwell-y2-main.jpg`. อย. สั่งระงับการโฆษณารุ่น Amoul: แคมเปญ/
> โฆษณาต้องถูก PAUSE ที่แพลตฟอร์ม Google/Facebook Ads โดยตรง (งานที่เจ้าของต้องทำ
> เอง) หน้า landing `/aed/amoul-i7` กำลังถูกลบและ redirect ไปหน้าแรก
> `scripts/build-promo-poster.mjs` ถูกรีแบรนด์เป็น Yuwell Y2 แล้ว ส่วนรูป Amoul เดิม
> (`aed-i7-poster.jpg`, `aed-i7-promo-39999.png`) เลิกใช้กับงานโฆษณาแล้ว

## ✅ AED creatives (safe to use)

| File | Content |
| --- | --- |
| `yuwell-y2-main.jpg` | AED Yuwell Y2 unit (open, current site-wide hero) |
| `primedic-y2-open.jpg` | AED Yuwell Y2 unit (alternate open shot) |
| `aed-poster.jpg` | AED poster |
| `aed-floorstand.png` | AED on floor stand |
| `aed-wallcabinet.png` | AED wall cabinet |
| `feature-grid.jpg` | AED feature grid |

## 🟡 Legacy creatives (retired — do NOT use in any live ad)

Former Amoul i7 assets. Kept only as historical files — the product is
discontinued and its advertising was suspended by อย. Do not use these in any
Meta/Google ad creative.

| File | Content |
| --- | --- |
| `product-main.png` | Legacy AED unit (front) — discontinued, retired |
| `aed-i7-2.jpg` | Legacy AED poster (MP Group) — retired |

## 🟢 AED rental campaign creatives (เช่า AED)

Pricing posters for the AED rental program (landing: `/aed/rental`). VAT not included on the posters.

| File | Content |
| --- | --- |
| `aed-rent-daily.jpg` | เช่ารายวัน/อีเวนต์ ฿1,500 วันแรก (วันถัดไป ฿900/วัน) |
| `aed-rent-monthly.jpg` | เช่ารายเดือน ฿1,990/เดือน (ขั้นต่ำ 3 เดือน) |
| `aed-rent-yearly.jpg` | เช่ารายปี ฿22,000/ปี (คุ้มที่สุด) |
| `aed-rent-all.jpg` | รวม 3 แพ็กเกจ (แนวนอน 3:2) |
| `aed-rent-all-portrait.jpg` | รวม 3 แพ็กเกจ (แนวตั้ง 3:4) |

## 🔴 PRIMEDIC / Yuwell assets

| File | Content |
| --- | --- |
| `primedic-y-open-pads.webp` | PRIMEDIC HeartSave เปิดฝา + แผ่น electrode ผู้ใหญ่/เด็ก บนพื้นขาว (product shot) |
| `primedic-features-infographic.png` | อินโฟกราฟิกฟีเจอร์ HeartSave โทนดำ/แดง (พลังงาน 200–360J, จอ 4.3"/7", ชุดอุปกรณ์, แบต 5 ปี, ประกัน 8 ปี) |

## ⛔ NOT an AED — do not use in AED ads

| File | Content |
| --- | --- |
| `caresens-air-cgms.jpg` | CareSens Air glucose monitor (CGMS) — a DIFFERENT product (MP Healthcare). Was previously misnamed `aed-i7-1.jpg`, which caused an AED ad to run with a glucose-monitor image. |
