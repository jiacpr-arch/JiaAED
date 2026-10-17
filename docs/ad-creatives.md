# Ad creative assets — JiaAED (Yuwell / PRIMEDIC HeartSave)

Internal guide (moved out of `public/` so it is no longer served on the site).
Image files live in `public/images/`.

Use ONLY images of the AED models we currently sell (Yuwell Y2 / PRIMEDIC
HeartSave Y0 · Y8 / Yuwell GPS) when building Meta/Google ad creatives. The copy
is about those defibrillators — the image must show them, not another product.

> **Amoul i7 — suspended by อย. order (ก.ค. 2026).** Its advertising was ordered
> stopped, so it must not appear in ads or on the site again. The `/aed/amoul-i7`
> landing page is gone — `proxy.ts` 301-redirects that path to `/` — and its
> promo poster (`aed-i7-promo-39999.png`) and the script that built it were
> deleted. The remaining Amoul files listed below are kept only until the owner
> confirms nothing external still links to them; never use them in new creatives.

## ✅ AED creatives (safe to use)

| File | Content |
| --- | --- |
| `yuwell-y2-main.jpg` | AED Yuwell Y2 unit (open, current site-wide hero) |
| `primedic-y2-open.jpg` | AED Yuwell Y2 unit (alternate open shot) |
| `aed-poster.jpg` | AED poster |
| `aed-floorstand.png` | AED on floor stand |
| `aed-wallcabinet.png` | AED wall cabinet |
| `feature-grid.jpg` | AED feature grid |

## ⛔ Amoul i7 files (suspended product — do NOT use)

| File | Content |
| --- | --- |
Deleted from `public/images/` (Oct 2026) so they're no longer served from
jiaaed.com: `product-main.png` (Amoul i7 unit, front), `aed-i7-poster.jpg`,
`aed-i7-2.jpg` (Amoul i7 posters) and the Amoul version of
`aed-rent-all-portrait.jpg`. Recover them from git history only for records.

## 🟢 AED rental campaign creatives (เช่า AED — Yuwell/PRIMEDIC)

Pricing posters for the AED rental program (landing: `/aed/rental`). VAT not included on the posters.
2026-07-30: replaced the Amoul-device versions with the owner's Yuwell/PRIMEDIC poster
(`rentaed2.png` from Drive) — per-plan cards are column crops of the same poster.
Usable in paid ads (matches ฆพ.2475/2569); the old Amoul versions must NOT be re-used.
The prices baked into these images must match `RENTAL_PRICES` in `lib/aed/rental.ts` —
re-export the posters if a rental price changes.

| File | Content |
| --- | --- |
| `aed-rent-daily.jpg` | เช่ารายวัน/อีเวนต์ ฿1,500 วันแรก (วันถัดไป ฿900/วัน) — Yuwell/PRIMEDIC |
| `aed-rent-monthly.jpg` | เช่ารายเดือน ฿1,990/เดือน (ขั้นต่ำ 3 เดือน) — Yuwell/PRIMEDIC |
| `aed-rent-yearly.jpg` | เช่ารายปี ฿22,000/ปี (คุ้มที่สุด) — Yuwell/PRIMEDIC |
| `aed-rent-all.jpg` / `aed-rent-all.webp` | รวม 3 แพ็กเกจ (แนวนอน 3:2) — Yuwell/PRIMEDIC |

## 🔴 PRIMEDIC / Yuwell assets

| File | Content |
| --- | --- |
| `primedic-y-open-pads.webp` | PRIMEDIC HeartSave เปิดฝา + แผ่น electrode ผู้ใหญ่/เด็ก บนพื้นขาว (product shot) |
| `primedic-features-infographic.png` | อินโฟกราฟิกฟีเจอร์ HeartSave จากผู้ผลิต โทนดำ/แดง (พลังงาน 200–360J, จอ 4.3"/7", ชุดอุปกรณ์, แบต/แผ่น "up to 5 years", ประกัน 8 ปี) — ⚠️ ตัวเลขอายุแบต/แผ่นและประกันในภาพเป็นของผู้ผลิต: เว็บ/บอทใช้ "ไม่น้อยกว่า 4 ปี" ตามสเปกชีต Y2 และให้สอบถามเงื่อนไขประกันกับทีมขาย — ยืนยันกับเจ้าของก่อนใช้ภาพนี้ยิงโฆษณา |

## ⛔ NOT an AED — do not use in AED ads

| File | Content |
| --- | --- |
| `caresens-air-cgms.jpg` | CareSens Air glucose monitor (CGMS) — a DIFFERENT product (MP Healthcare). Was previously misnamed `aed-i7-1.jpg`, which caused an AED ad to run with a glucose-monitor image. |
