# รีวิวเว็บไซต์ jiaaed.com + แผนแก้ไข — 3 ก.ค. 2026

ผลตรวจสอบทั้งเว็บ (หน้าเว็บ/SEO/conversion + API/ความปลอดภัย/โค้ด) พร้อมแผนแก้ไขเรียงตามความสำคัญ

**สถานะพื้นฐาน: แข็งแรงดี** — `tsc` ผ่าน · `eslint` 0 errors (2 warnings) · test 37/37 ผ่าน · `next build` ผ่านทุกหน้า
ปัญหาที่พบเป็นระดับ "เนื้อหา/ความปลอดภัย/ความสม่ำเสมอ" ไม่ใช่เว็บพัง

---

## 🔴 P0 — ความปลอดภัย (ควรแก้ทันที)

### P0.1 Cron ทั้ง 8 ตัว "fail-open" ถ้าไม่ได้ตั้ง `CRON_SECRET`
ทุก cron route ใช้ guard เดียวกัน: `if (!secret) return true;` — แปลว่าถ้า env `CRON_SECRET` หายไป **ใครก็ยิง cron ได้จากภายนอก** ที่อันตรายสุดคือ `auto-optimize` และ `auto-optimize-headline` ซึ่ง**เปิด PR + auto-merge เข้า main + deploy production เอง** (`app/api/cron/auto-optimize/route.ts:519-523`)
- **แก้:** เปลี่ยนเป็น fail-closed (`if (!secret) return false`) + รวม helper เป็นไฟล์เดียว `lib/aed/cron-auth.ts` (ตอนนี้ copy-paste 8 ที่)
- ไฟล์: `app/api/cron/*/route.ts` ทั้ง 8 ไฟล์

### P0.2 `/api/aed/web-chat` เปิดโล่ง — ใครก็เรียก Claude ฟรีผ่านเว็บเราได้
`app/api/aed/web-chat/route.ts:35-80` ไม่มี auth, ไม่มี rate limit, ไม่เช็ก Origin — คนภายนอกใช้เป็น LLM proxy ฟรี → **บิล Anthropic บานได้ไม่จำกัด**
- **แก้:** เช็ก `Origin`/`Referer` ให้ตรงโดเมนเรา + rate limit ต่อ IP (เช่น Upstash หรือ in-memory ต่อ region) + จำกัดความยาว history เข้มขึ้น

### P0.3 ไม่มี rate limit บน public POST ทุกเส้น
`lead`, `lead-partial`, `track-visit`, `event`, `meta-lead` ยิงถล่มได้จน Supabase เต็ม / ข้อมูล analytics เพี้ยน
- **แก้:** rate limit กลางที่ middleware หรือต่อ route (ตัวที่แพงสุดคือ web-chat ตาม P0.2)

### P0.4 Auto-merge เนื้อหาที่ AI เขียน เข้า production โดยไม่มีคนตรวจ
`auto-optimize` / `auto-optimize-headline` merge ทันที (มีแค่ regex คุมคำโฆษณา) ขณะที่ `article-gap` เปิดเป็น draft PR ให้คนตรวจ — ควรใช้มาตรฐานเดียวกัน โดยเฉพาะเว็บเครื่องมือแพทย์ที่มีเรื่อง ฆพ./อย.
- **แก้ (เลือกอย่างใดอย่างหนึ่ง):** (ก) เปลี่ยนเป็น draft PR + แจ้ง LINE ให้เจ้าของกด merge เอง หรือ (ข) คง auto-merge แต่บังคับให้ CI รัน `npm test` + lint ก่อน merge จริง (ตอนนี้ยังไม่เห็น CI ใน repo)

### P0.5 ความปลอดภัยระดับกลางที่ควรตามแก้
- ไม่มี security headers เลย (`next.config.ts`) — เพิ่ม HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` (ยกเว้น `/embed/news` ที่ตั้งใจให้ embed)
- Admin ใช้ token เดี่ยวเก็บใน `localStorage` — ยอมรับได้ชั่วคราว แต่วางแผนย้ายไป cookie httpOnly + session
- Bearer compare ของ `google-ads/*` ไม่ constant-time (`conversion/route.ts:19-24`) — ใช้ `crypto.timingSafeEqual` แบบเดียวกับ LINE webhook
- `escape()` ใน `embed/news` ไม่กรอง scheme ของ URL — บังคับ `https?:` เท่านั้น

---

## 🟠 P1 — เนื้อหา/Conversion (กระทบยอดขายตรง ๆ)

### P1.1 ราคา i7 ขัดกันเองบนหน้าแรก: ฿39,900 vs ฿39,999
- Hero บอก ฿39,900 (`app/page.tsx:116`) + `lib/aed/packages.ts:82` บอก ฿39,900
- แต่การ์ดแบรนด์/FAQ/หน้า ads/products.ts บอก ฿39,999 (`lib/aed/products.ts:17`, `lib/aed/faqs.ts:10`)
- ⚠️ **หมายเหตุ:** PR #92 (draft ค้างอยู่) กำลังจะเปลี่ยนราคาเป็น ฿42,900 อยู่แล้ว — **ตัดสินใจ PR #92 ก่อน** แล้วค่อย sync ราคาให้เหลือแหล่งเดียว (single source of truth ใน `products.ts` แล้วให้ทุกหน้า import)

### P1.2 ลิงก์ anchor ตาย `/#products` หลายจุด
หน้าแรกไม่มี `id="products"` แล้ว แต่ยังถูกลิงก์จาก:
- `app/news/page.tsx:137` (ปุ่ม "ดูเครื่อง AED" พาไปหัวหน้าแรกเฉย ๆ)
- `lib/aed/articles.ts:53`
- JSON-LD ทุก Product ชี้ `offers.url` ไป `/#products` (`app/components/StructuredData.tsx:74,96,111`)
- `app/sitemap.ts:9` มี `#products`, `#features`, `#specs` ที่ไม่มีอยู่จริง
- **แก้:** ชี้ไป `/#brands` (หรือเพิ่ม `id="products"` กลับ) + ลบ fragment URLs ออกจาก sitemap ทั้งหมด (Google ไม่ใช้อยู่แล้ว)

### P1.3 JSON-LD Product+FAQ ฉีดทุกหน้าจาก layout
`app/layout.tsx:87` ทำให้หน้า `/quote`, `/docs`, `/news`, `/about` มี markup ที่ไม่ตรงเนื้อหาบนหน้า — เสี่ยงโดน Google เตือน/ตัดสิทธิ์ rich results
- **แก้:** ย้าย Product/FAQ JSON-LD ไปอยู่เฉพาะหน้าที่มีเนื้อหานั้นจริง (หน้าแรก, หน้า product) เหลือ Organization/LocalBusiness ไว้ที่ layout

### P1.4 Canonical ของหน้า ads ชี้ไป URL ที่ไม่มีจริง
`app/aed/amoul-i7/page.tsx:18` → `canonical: "/ads/aed-i7"` แต่ route นี้ไม่มี (404)
- **แก้:** เปลี่ยนเป็น `/aed/amoul-i7` หรือเอา canonical ออก (หน้าเป็น noindex อยู่แล้ว)

### P1.5 รวม LINE OA URL ให้เหลือที่เดียว
URL `https://line.me/R/oaMessage/@jiacpr/...` hardcode ซ้ำใน **24 ไฟล์** และข้อความ prefill เริ่ม drift แล้ว (ส่วนใหญ่ "สนใจ AED ครับ" แต่ `RentalSpotlight.tsx:5` ใช้ "สนใจเช่า AED")
- **แก้:** สร้าง `lib/aed/line.ts` export ฟังก์ชัน `lineOaUrl(prefill?)` แล้วให้ทุก component import — เปลี่ยน handle ครั้งหน้าแก้ที่เดียว

### P1.6 FAQ หน้า subscription ยังไม่ผ่านการอนุมัติจากเจ้าของ
`lib/aed/faqs.ts:167` มี `TODO(owner): review & approve` แต่คำตอบแสดงบน production แล้ว — **เจ้าของต้องรีวิว** (งานคน ไม่ใช่งานโค้ด)

### P1.7 คำโฆษณาเสี่ยงกับเว็บเครื่องมือแพทย์
"เร็วที่สุดในตลาด" (`amoul-i7/page.tsx:171`), "คุ้มที่สุด" (`page.tsx:257`), "ราคาพิเศษวันนี้" ขีดฆ่า ฿70,000 แบบไม่มีวันหมดเขต — superlative + fake urgency เสี่ยงเรื่อง ฆพ.
- **แก้:** ปรับเป็นข้อความมีหลักฐานอ้างอิง เช่น "Shock ภายใน 7 วินาที" เฉย ๆ / ใส่วันหมดเขตโปรจริง

---

## 🟡 P2 — SEO / Accessibility

- **P2.1 หน้า 6 หน้าไม่มี `<h1>` เลย** — `SectionHeading` render เป็น `<h2>` เสมอ (`SectionHeading.tsx:23`) ทำให้ `/aed/packages`, `/aed/subscription`, `/aed/primedic`, `/quote`, `/about`, `/training` เริ่มที่ h2 → เพิ่ม prop `as="h1"` ให้ heading แรกของแต่ละหน้า
- **P2.2 หน้า `/articles`, `/docs`, `/news` ไม่มี OG image** — เพิ่ม `openGraph.images` ให้ครบ (แชร์ใน LINE/FB แล้วไม่มีรูป)
- **P2.3 Title default ของ layout ยาว ~90 ตัวอักษร** — โดน Google ตัด ควรย่อเหลือ ~60
- **P2.4 alt text ปนแบรนด์** — flyer เดียวกันบางรูปเรียก "PRIMEDIC" บางรูป "Yuwell" (`app/aed/primedic/page.tsx:95`)
- **P2.5 รูป PRIMEDIC ใช้รูปเดียวกัน 4 SKU** — Y0/Y8/pad/battery ใช้ `primedic-open.png` หมด (มี TODO เจ้าของค้างอยู่ — ต้องรูปจริงจากเจ้าของ)
- **P2.6 บทความล่าสุดคือ พ.ย. 2025** (~8 เดือนแล้ว) — cron `article-gap` มีอยู่แล้ว ตรวจว่าทำไม draft PR บทความไม่ถูก merge / ไม่ถูกสร้าง

---

## 🟢 P3 — คุณภาพโค้ด / Ops (ทำเมื่อมีเวลา)

- **P3.1 โค้ดซ้ำ:** `isAuthorized` cron 8 สำเนา · `clean()`/`hashIp()` 3 สำเนา (เสี่ยง salt เพี้ยนถ้าแก้ไม่ครบ — `track-visit/route.ts:17`, `event/route.ts:47` vs `lead-validation.ts`) · `waitForChecks`/`healthCheck` ~80 บรรทัดซ้ำระหว่าง optimizer 2 ตัว → รวมเป็น lib กลาง
- **P3.2 LINE webhook:** `JSON.parse(body)` ไม่มี try/catch (`webhook/line/route.ts:59`) · `pushMessage` ไม่เช็ก `res.ok` (`:42-47`) — ตอบลูกค้าไม่สำเร็จแบบเงียบ ๆ
- **P3.3 `lead-partial` ไม่ validate `product_id`** ขณะที่ `lead` validate — ทำให้ค่ามั่วเข้า `aed_leads` ได้
- **P3.4 Host ไม่ตรงกัน:** cron hardcode `https://www.jiaaed.com` แต่ default ที่อื่นคือ `https://jiaaed.com` (ไม่มี www) — เลือก canonical host เดียว + ใช้ env ทุกที่
- **P3.5 ไม่มี `.env.example`** ทั้งที่ต้องใช้ env ~35 ตัว — สร้างไฟล์ documentation (`.gitignore` whitelist ไว้แล้ว)
- **P3.6 Cron ชนเวลากัน:** `auto-optimize` และ `ads-round2` รันจันทร์ 03:00 พร้อมกัน ทั้งคู่แตะ Google Ads + GitHub API — เหลื่อมเวลากัน
- **P3.7 เทสยังไม่คุม:** ไม่มีเทส LINE signature, ai-orchestrator, meta-capi, และ `buildNewHeroCtaFile` (ฟังก์ชันตัดต่อไฟล์ TSX ที่ผลลัพธ์ถูก auto-merge!) — อย่างน้อยเพิ่มเทสตัวหลังสุดก่อนเพราะเสี่ยงสุด
- **P3.8 lint warnings 2 ตัว:** unused vars ใน `auto-optimizer-headline.ts:173`, `tool-handlers.ts:6`

---

## เรื่องค้างที่ต้องตัดสินใจ (ไม่ใช่โค้ด)

| เรื่อง | สถานะ | ใครทำ |
|---|---|---|
| PR #92 ปรับราคาขึ้น ฿42,900 | draft ค้างตั้งแต่ 29 มิ.ย. | เจ้าของตัดสินใจ merge/ปิด — **บล็อก P1.1** |
| PR #91 ดันแบรนด์ Yuwell/PRIMEDIC บนหน้าแรก | draft ค้าง | เจ้าของตัดสินใจ (ทับซ้อนกับ #90 ที่ merge แล้ว) |
| PR #80 ราคา PAD/Battery | draft ค้างตั้งแต่ 18 มิ.ย. | น่าจะ stale — ปิดหรือ rebase |
| เลข ฆพ. PRIMEDIC/Yuwell | ยังไม่มี (`regulatory.ts: adLicense: null`) | เจ้าของยื่น/ตามเลข |
| รูปจริง PRIMEDIC Y0/Y8/อะไหล่ | ใช้รูป placeholder ร่วมกัน | เจ้าของส่งรูป |
| ทดสอบ FlowAccount ออกใบเสนอราคาจริง | ยังไม่เคยเทส end-to-end | เจ้าของเทส 1 รอบ |
| อนุมัติ FAQ หน้า subscription | ยังไม่รีวิว | เจ้าของรีวิว |

---

## ลำดับการลงมือ (เสนอ)

| รอบ | งาน | ขนาด |
|---|---|---|
| **รอบ 1 (security)** | P0.1 fail-closed cron + รวม cron-auth · P0.2/P0.3 กัน web-chat + rate limit · P0.5 security headers + timing-safe compare | ~1 วัน |
| **รอบ 2 (conversion/SEO)** | P1.2 ลิงก์ตาย + sitemap · P1.3 ย้าย JSON-LD · P1.4 canonical · P1.5 รวม LINE URL · P2.1 h1 · P2.2 OG images | ~1 วัน |
| **รอบ 3 (ราคา + นโยบาย)** | เคลียร์ PR #92/#91/#80 → P1.1 sync ราคา · P1.7 ปรับคำโฆษณา · P0.4 เปลี่ยน auto-merge เป็น draft PR | รอเจ้าของตัดสินใจ |
| **รอบ 4 (code health)** | P3.1–P3.8 ตามลำดับ | ทยอยทำ |

จุดแข็งที่ตรวจแล้วดี: ไม่มี secret หลุดใน repo · LINE webhook verify signature ถูกต้อง · Supabase เปิด RLS ทุกตาราง · ราคา/lead validation มีเทสคุม · robots บล็อก `/api/` ถูกต้อง
