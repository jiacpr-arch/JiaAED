# JiaAED

เว็บขายและให้เช่าเครื่อง AED (Yuwell / PRIMEDIC HeartSave) ของ บริษัท เจี่ยรักษา จำกัด — jiaaed.com

นอกจากหน้าเว็บสินค้า ระบบนี้ยังรวม:

- **ฟอร์มขอใบเสนอราคา** → บันทึกลง Supabase, แจ้งทีมทาง LINE + อีเมล, ส่ง conversion ให้ Google Ads / Meta (เฉพาะผู้ที่ยอมรับคุกกี้)
- **แชท AI บนเว็บ** (`/api/aed/web-chat`) และ **LINE bot** (`/api/aed/webhook/line`) ที่คำนวณราคาและออกใบเสนอราคาใน FlowAccount ได้
- **หน้า admin** (`/admin/*`) — analytics, ข่าว, เอกสารดาวน์โหลด, ทะเบียนเครื่องลูกค้า
- **cron** สรุปรายงาน/แจ้งเตือนทาง LINE (ดู `vercel.json`)

## Stack

Next.js 16 (App Router) · React 19 · Tailwind 4 · Supabase · Vercel · Anthropic Claude · LINE Messaging API · Resend · FlowAccount

> Next.js เวอร์ชันนี้มี breaking changes จากที่หลายคนคุ้น — อ่าน guide ใน `node_modules/next/dist/docs/` ก่อนเขียนโค้ด (ดู `AGENTS.md`)

## เริ่มต้น

```bash
npm ci
cp .env.example .env.local   # ใส่ค่าตามคำอธิบายในไฟล์
npm run dev                  # http://localhost:3000
```

ก่อนเปิด PR (CI รันชุดเดียวกันนี้):

```bash
npx tsc --noEmit
npm run lint
npm test
```

## โครงสร้าง

| Path | เนื้อหา |
| --- | --- |
| `app/` | หน้าเว็บ, API routes (`app/api/aed/*` สาธารณะ, `app/api/admin/*` ต้อง login, `app/api/cron/*` สำหรับ Vercel Cron) |
| `lib/aed/` | business logic — ราคา (`pricing.ts`, `packages.ts`, `rental.ts`), เลขทะเบียน อย./ฆพ. (`regulatory.ts` — แหล่งเดียว ห้ามพิมพ์เลขซ้ำที่อื่น), prompt ของบอท, การแจ้งเตือน |
| `supabase/` | SQL schema — รันเองใน Supabase SQL Editor ตามลำดับใน `supabase/README.md` |
| `docs/` | คู่มือการตลาด/ปฏิบัติงานสำหรับเจ้าของ |
| `growth-hub/`, `growth-kit/` | ชุดเครื่องมือแยกสำหรับแบรนด์อื่น — แอปนี้ไม่ได้ import และไม่ถูก typecheck รวมกับแอป |

## ข้อควรรู้

- **repo นี้เป็น public** และถูก mirror ไป GitLab — ห้าม commit ข้อมูลลูกค้า, token หรือ secret ใด ๆ
- **ราคาและเลขทะเบียน** ต้องมาจากโมดูลข้อมูลเท่านั้น (`lib/aed/catalog-consistency.test.ts` ช่วยจับกรณีพิมพ์ซ้ำ/ไม่ตรงกัน)
- **PDPA:** tracker และการส่งข้อมูลให้แพลตฟอร์มโฆษณา (รวม Meta CAPI / Google enhanced conversions ฝั่ง server) ทำงานเฉพาะเมื่อผู้ใช้กด "ยอมรับทั้งหมด" — ใช้ `hasMarketingConsent()` จาก `lib/aed/consent.ts`
- **cron** ทุกตัวต้องผ่าน `isCronAuthorized` (ปฏิเสธเมื่อไม่ได้ตั้ง `CRON_SECRET`) และใช้ `claimDailyCronRun` กันการส่งซ้ำ
- **หน้า admin** login ด้วย `ADMIN_TOKEN` ครั้งเดียว ระบบเก็บเป็น session cookie แบบ HttpOnly อายุ 7 วัน
