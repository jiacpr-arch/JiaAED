# Domain Migration: jiaaed.vercel.app → jiaaed.com

Domain ซื้อจาก **Z.com (GMO)**. Primary domain คือ `https://jiaaed.com` (ไม่มี www)

## Code changes (เสร็จแล้ว)

- รวม env var ของ site URL เป็น `NEXT_PUBLIC_SITE_URL` ตัวเดียว (เลิกใช้ `NEXT_PUBLIC_APP_URL`)
- ลบ hardcoded `https://jiaaed.vercel.app` ทุกที่ ใช้ env var + fallback `https://jiaaed.com` แทน
- ไฟล์ที่แก้:
  - `app/layout.tsx` (metadataBase, openGraph url)
  - `app/robots.ts`
  - `app/sitemap.ts`
  - `app/components/StructuredData.tsx`
  - `app/feed/products.xml/route.ts`
  - `lib/aed/tool-handlers.ts` (Stripe redirect)

## Checklist หลัง deploy

### 1. Vercel
- [ ] Settings → Domains → Add `jiaaed.com` (primary) และ `www.jiaaed.com` (redirect → root)
- [ ] Environment Variables → ตั้ง `NEXT_PUBLIC_SITE_URL=https://jiaaed.com` (Production)
- [ ] Preview / Development ไม่ต้องตั้ง — fallback จะใช้ `https://jiaaed.com` (หรือใช้ deploy URL ของ preview ก็ได้)
- [ ] Redeploy หลังตั้ง env var

### 2. Z.com DNS
ตั้ง DNS records ตามที่ Vercel แนะนำ:
- [ ] `A` record: `@` → `76.76.21.21`
- [ ] `CNAME` record: `www` → `cname.vercel-dns.com`
- [ ] (ไม่บังคับ) `CAA` record สำหรับ Let's Encrypt: `0 issue "letsencrypt.org"`
- [ ] รอ DNS propagate (~ไม่กี่นาที - 48 ชม.) เช็คด้วย `dig jiaaed.com`

### 3. Resend (Email)
- [ ] Resend Dashboard → Domains → Add `jiaaed.com`
- [ ] เพิ่ม DNS records ที่ Resend ให้: `SPF` (TXT), `DKIM` (TXT × 3), `DMARC` (TXT)
- [ ] รอ verify status เป็น Verified
- [ ] ทดสอบส่งอีเมลจาก `noreply@jiaaed.com` และ `sales@jiaaed.com`

### 4. Supabase
- [ ] Authentication → URL Configuration
  - [ ] Site URL: `https://jiaaed.com`
  - [ ] Redirect URLs: เพิ่ม `https://jiaaed.com/**`, `https://www.jiaaed.com/**`
  - [ ] อย่าเพิ่งลบ `https://jiaaed.vercel.app/**` จนกว่าจะ test เสร็จ
- [ ] CORS: ถ้าใช้ Edge Functions ต้องเพิ่ม origin ใหม่

### 5. Stripe
- [ ] Webhooks → ถ้ามี webhook → อัปเดต endpoint URL เป็น `https://jiaaed.com/api/...`
- [ ] Customer portal / branding ถ้าตั้ง URL ไว้

### 6. Google
- [ ] **GA4**: Admin → Data Streams → แก้ Stream URL เป็น `https://jiaaed.com` (หรือสร้างใหม่)
- [ ] **Google Ads**: Conversion tracking ยังใช้ Measurement ID เดิมได้ ตรวจให้ทำงานในโดเมนใหม่
- [ ] **Google Search Console**: เพิ่ม property `jiaaed.com` (Domain property แนะนำ)
- [ ] Submit `https://jiaaed.com/sitemap.xml`
- [ ] Merchant Center: อัปเดต website URL + verify ใหม่
- [ ] (ถ้ามี) ใช้ Change of Address tool: `jiaaed.vercel.app` → `jiaaed.com`

### 7. Facebook / Meta
- [ ] Business Manager → Brand Safety → Domains → Add + Verify `jiaaed.com`
  - Verify ด้วย DNS TXT record ที่ Z.com
- [ ] Events Manager → Pixel → ตรวจว่า event ยิงมาจาก domain ใหม่
- [ ] Aggregated Event Measurement: ตั้ง 8 events priority ใหม่
- [ ] OAuth (ถ้ามี FB Login): App Settings → Valid OAuth Redirect URIs + App Domains

### 8. LINE Official Account
- [ ] LINE Developers Console → Webhook URL → ถ้าตั้งไว้เป็น vercel.app ให้แก้เป็น `https://jiaaed.com/api/aed/webhook/line`
- [ ] Verify webhook

### 9. FlowAccount
- [ ] ถ้ามี callback / webhook ตั้งไว้กับ vercel.app → แก้เป็น `https://jiaaed.com`

### 10. Sharing / SEO
- [ ] Facebook Sharing Debugger: scrape `https://jiaaed.com` เพื่อ refresh OG cache
- [ ] LINE Open Chat / Twitter: ทดสอบ preview
- [ ] ตรวจ `robots.txt` และ `sitemap.xml` ที่ domain ใหม่

## Test plan (ก่อนสลับ primary)

- [ ] เปิด `https://jiaaed.com` → โหลดได้, SSL เขียว
- [ ] เปิด `https://www.jiaaed.com` → redirect ไป root
- [ ] ทดสอบ lead form → submit ได้, owner ได้รับแจ้ง LINE
- [ ] ทดสอบ web-chat → ตอบกลับได้
- [ ] ทดสอบ Stripe payment link → redirect กลับ `jiaaed.com/payment/success` ถูก
- [ ] ทดสอบ email → ส่งออกได้ ไม่ติด spam
- [ ] เช็ค GA4 realtime users
- [ ] เช็ค FB Pixel test events

## Rollback plan

หากมีปัญหารุนแรง:
1. Vercel → Settings → Domains → ตั้ง `jiaaed.vercel.app` เป็น primary อีกครั้ง
2. แก้ env var `NEXT_PUBLIC_SITE_URL` กลับเป็น `https://jiaaed.vercel.app` แล้ว redeploy
3. แจ้งผู้ใช้ผ่าน LINE OA

## Cleanup (หลังนิ่งแล้ว 2 สัปดาห์)

- [ ] ลบ `jiaaed.vercel.app` ออกจาก Supabase redirect URLs
- [ ] ลบ vercel.app ออกจาก FB / Google authorized URLs
- [ ] เก็บ domain `jiaaed.com` ต่ออายุอัตโนมัติที่ Z.com
