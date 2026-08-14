# เพิ่ม aed.jia1669.com เป็นทางเข้าเว็บอีกโดเมน (14 ส.ค. 2026)

**คำตอบ: ทำได้** และแทบไม่ต้องแก้โค้ดเลย — งานหลักอยู่ที่ Vercel Dashboard + DNS
ของ jia1669.com (checklist ด้านล่าง) โค้ดฝั่งเว็บรองรับอยู่แล้วเพราะ canonical URL
ทุกหน้าชี้ไป `https://jiaaed.com` เสมอ (`app/layout.tsx` → `metadataBase`)
จึงเปิดโดเมนที่สองได้โดยไม่เกิดปัญหา duplicate content กับ Google

> **หมายเหตุเรื่องสะกด:** คำขอเดิมพิมพ์ว่า `aed.ji1669.com` (ไม่มีตัว a) —
> ตรวจสอบแล้ว (14 ส.ค. 2026) `ji1669.com` **ไม่มี DNS record / ไม่ได้ถืออยู่**
> ส่วน `jia1669.com` เป็นโดเมนของบริษัท (ชี้ MakeWebEasy `27.254.137.5` ตาม
> `docs/jia1669-domain-alignment-2026-07-17.md`) เอกสารนี้จึงยึด **aed.jia1669.com**
> ถ้าตั้งใจจะใช้ `ji1669.com` จริง ๆ ต้องไปจดโดเมนใหม่ก่อน แล้วขั้นตอนที่เหลือเหมือนกัน

## แนวทางที่แนะนำ: เสิร์ฟเว็บตรง ๆ (ไม่ redirect)

ให้ `aed.jia1669.com` แสดงเว็บ JiaAED เต็ม ๆ เหมือน `jiaaed.com` ทุกหน้า:

- ผู้ใช้เข้าได้ทั้งสองโดเมน เนื้อหาเดียวกัน ไม่ต้อง maintain อะไรเพิ่ม
- SEO ปลอดภัย: ทุกหน้ามี `<link rel="canonical">` ชี้ jiaaed.com อยู่แล้ว
  Google จะ index เฉพาะ jiaaed.com ตามเดิม
- สอดคล้องกับแนวทางปม ฆพ. (ใบอนุญาตระบุสื่อ www.jia1669.com) — การมีเนื้อหาจริง
  อยู่ใต้ร่มโดเมน jia1669.com เป็นผลดี ไม่ใช่ผลเสีย

**ทางเลือก B — redirect:** ถ้าต้องการแค่ "ทางเข้าจำง่าย" เฉย ๆ ตอน Add domain
ใน Vercel เลือกให้ redirect ไป `jiaaed.com` ได้เลย (308) — ก็ไม่ต้องแก้โค้ดเช่นกัน

## Checklist การตั้งค่า (เจ้าของทำเอง ~10 นาที)

### 1. Vercel

- [ ] Vercel → โปรเจกต์ `jiaaed` → Settings → Domains → **Add `aed.jia1669.com`**
- [ ] เลือก **No Redirect** (เสิร์ฟตรง) หรือ Redirect → `jiaaed.com` ตามแนวทางที่เลือกข้างบน
- [ ] **อย่า** เพิ่มเข้าโปรเจกต์ `jia1669` (โปรเจกต์นั้นใช้ `subaed.jia1669.com` แยกต่างหาก)

### 2. DNS ของ jia1669.com

ตั้งที่ผู้ให้บริการ DNS เดิมของ jia1669.com (ที่เดียวกับที่เคยตั้ง `subaed`):

- [ ] `CNAME` record: `aed` → `cname.vercel-dns.com`
- [ ] รอ propagate แล้ว Vercel จะออก SSL ให้อัตโนมัติ (สถานะใน Domains ต้องเป็น Valid)

### 3. ทดสอบ

- [ ] เปิด `https://aed.jia1669.com` — ต้องเห็นหน้าเว็บ JiaAED ปกติ
- [ ] View source → `<link rel="canonical">` ต้องเป็น `https://jiaaed.com/...` (กัน SEO ซ้ำ)
- [ ] ทดสอบฟอร์มขอใบเสนอราคา + ปุ่ม LINE ว่าทำงานจากโดเมนนี้

### 4. เฉพาะถ้าจะใช้โดเมนนี้ยิงโฆษณา / ใช้งานจริงจัง (ไม่บังคับ)

- [ ] **Meta**: Business Manager → Domains — verify `jia1669.com` ไว้แล้วหรือยัง
      (verify ระดับ root ครอบคลุม subdomain) ถ้าจะใช้เป็น final URL ของ ads
- [ ] **Supabase Auth**: เพิ่ม `https://aed.jia1669.com/**` ใน Redirect URLs
      เฉพาะถ้าจะ login หน้า `/admin` จากโดเมนนี้
- [ ] **GA4 / Search Console**: ไม่ต้องทำอะไร — canonical ชี้ jiaaed.com อยู่แล้ว
      และ GA ใช้ Measurement ID เดิมได้ทุกโดเมน

## สิ่งที่ *ไม่ต้อง* ทำ

- ไม่ต้องแก้ `NEXT_PUBLIC_SITE_URL` — คงเป็น `https://jiaaed.com` (โดเมนหลัก/canonical เดิม)
- ไม่ต้องแตะ `proxy.ts`, `next.config.ts`, `robots.ts`, `sitemap.ts`
- ไม่ต้องแตะเว็บ MakeWebEasy (`www.jia1669.com`) และ iframe `/aed/yuwell-y2` ที่ฝังอยู่
- ไม่ต้องแจ้ง อย. เพิ่ม — โดเมนนี้เป็นแค่ทางเข้าเสริม เนื้อหา canonical ยังคงเป็น jiaaed.com
  (ถ้าจะใช้เป็นชื่อสื่อโฆษณาหลักในใบ ฆพ. ใบใหม่ ค่อยพิจารณาตามแนวทางใน
  `docs/jia1669-domain-alignment-2026-07-17.md`)
