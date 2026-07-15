# Google Ads Setup — JiaAED

> 🛑 **ด่วน — คำสั่งระงับโฆษณาจาก อย.:** แคมเปญ/โฆษณารุ่น Amoul i7 ต้องถูก **PAUSE ที่แพลตฟอร์ม Google Ads / Facebook Ads โดยตรง** ทันที (เจ้าของต้องเข้าไปกดหยุดเองในหน้าจัดการโฆษณา — การแก้โค้ด/เอกสารอย่างเดียว **ไม่หยุด** โฆษณาที่กำลังรันอยู่) เนื่องจาก อย. สั่งระงับการโฆษณา อย่ายิงโฆษณาแบบเสียเงินกับ AED ทุกรุ่นจนกว่าจะได้เลข ฆพ. ที่ถูกต้องของรุ่นปัจจุบัน

คู่มือเปิด Google Ads สำหรับ JiaAED โดยใช้ tracking ที่ติดไว้ใน landing page นี้แล้ว

## 1. Environment variables (Vercel)

ตั้งใน Vercel project → Settings → Environment Variables (ทั้ง Production + Preview):

| ตัวแปร | ตัวอย่าง | จำเป็น |
| --- | --- | --- |
| `NEXT_PUBLIC_GA4_ID` | `G-XXXXXXXXXX` | สำหรับ GA4 analytics |
| `NEXT_PUBLIC_GADS_ID` | `AW-1234567890` | สำหรับ Google Ads conversion |
| `NEXT_PUBLIC_GADS_CONVERSION_LABEL` | `AbC-D_efGhIjKlMn` | label `LINE Click` conversion |
| `NEXT_PUBLIC_GADS_LEAD_CONVERSION_LABEL` | `XyZ-W_uVwXyZaBc` | label `Lead Form Submit` conversion |
| `NEXT_PUBLIC_SITE_URL` | `https://jiaaed.vercel.app` | ใช้ใน Merchant Center feed |
| `RESEND_API_KEY` | `re_...` | ส่งอีเมลตอบกลับลูกค้า (จาก resend.com) |
| `RESEND_FROM_EMAIL` | `JiaAED <noreply@jiaaed.com>` | ต้อง verify domain ใน Resend |
| `RESEND_REPLY_TO` | `sales@jiaaed.com` | optional, default ใน code |
| `LEAD_IP_SALT` | `(สุ่ม 32 ตัวอักษร)` | salt สำหรับ hash IP ใน aed_leads |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | สำหรับ web chat widget (เจี่ย AI บน landing) |
| `AED_INTERNAL_API_KEY` | `(สุ่ม 32+ ตัวอักษร)` | bearer token สำหรับเรียก `/api/aed/google-ads/conversion` จาก server-to-server |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | `XXXXXXXXXXXXXXXX` | จาก ads.google.com → Tools → API Center (ขอ approval ครั้งแรก) |
| `GOOGLE_ADS_CUSTOMER_ID` | `1234567890` | customer ID (ไม่ต้องมีขีด) |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | `1234567890` | (optional) MCC manager account ID |
| `GOOGLE_ADS_CLIENT_ID` | `xxx.apps.googleusercontent.com` | OAuth2 client (Google Cloud → Credentials) |
| `GOOGLE_ADS_CLIENT_SECRET` | `GOCSPX-...` | OAuth2 client secret |
| `GOOGLE_ADS_REFRESH_TOKEN` | `1//...` | OAuth2 refresh token (ใช้ scope `https://www.googleapis.com/auth/adwords`) |
| `GOOGLE_ADS_CONVERSION_ACTION_ID` | `987654321` | numeric ID ของ "Sale Closed" conversion action (จาก URL) |

ถ้ายังไม่ใส่ค่า — gtag จะไม่โหลด ไม่กระทบ landing page  
หาก `GOOGLE_ADS_*` ไม่ครบ → `/api/aed/google-ads/conversion` จะ log ลง `aed_conversion_log` ด้วย status `skipped_no_creds` (ไม่ส่งจริง)

## 2. สร้างบัญชีและของพื้นฐาน

1. **Google Analytics 4**: analytics.google.com → สร้าง property → คัดลอก measurement ID `G-...`
2. **Google Ads**: ads.google.com → สร้าง account → ตั้ง billing → คัดลอก customer ID
3. **เชื่อม GA4 ↔ Google Ads** ใน Ads → Tools → Linked accounts
4. **Google Merchant Center**: merchants.google.com → claim domain → เชื่อมกับ Google Ads

## 3. Conversion action (คลิกไป LINE)

ใน Google Ads → Goals → Conversions → New conversion action → **Website**:

- Category: **Contact** (หรือ Lead)
- Conversion name: `LINE Click`
- Value: ใส่ค่า lead เฉลี่ย (เช่น 200 THB) หรือ Don't use
- Count: **One** (เพื่อไม่ให้ user คนเดียวคลิกหลายปุ่ม นับซ้ำ)
- Click-through window: 30 days
- Attribution: Data-driven

หลังสร้างเสร็จ → เลือก **Use Google tag** → คัดลอก:
- Conversion ID เช่น `AW-1234567890` → ใส่ `NEXT_PUBLIC_GADS_ID`
- Conversion label เช่น `AbC-D_efGhIjKlMn` → ใส่ `NEXT_PUBLIC_GADS_CONVERSION_LABEL`

โค้ดใน `app/components/LineClickTracker.tsx` จะยิง `gtag('event', 'conversion', { send_to: 'AW-XXX/LABEL' })` ทุกครั้งที่กดปุ่มที่มี `data-line-cta`

### สร้าง conversion action ตัวที่ 2 — `Lead Form Submit`

สร้างซ้ำขั้นเดียวกับด้านบน แต่:
- Conversion name: `Lead Form Submit`
- Category: **Submit lead form**
- Count: **One**
- คัดลอก label ใส่ `NEXT_PUBLIC_GADS_LEAD_CONVERSION_LABEL`

ตัว `app/components/LeadForm.tsx` จะยิง conversion event นี้เมื่อ user submit form สำเร็จ — ใช้ Conversion ID เดียวกัน (`NEXT_PUBLIC_GADS_ID`) แต่ label ต่างกัน

ทั้ง 2 conversion actions ใช้ใน:
- **Maximize conversions / Target CPA** bidding ของ Search/PMax
- ใน Search campaign สามารถ "include in Conversions" เฉพาะอันที่อยากให้ optimize (แนะนำให้เปิด Lead Form Submit เป็น primary และ LINE Click เป็น secondary เพราะ lead form มี contact info ส่งเข้าระบบจริง)

ทดสอบ: เปิดหน้าเว็บ → DevTools Network → กรอง `collect` หรือ `googleads.g.doubleclick.net` → คลิกปุ่ม LINE → ต้องเห็น request ส่งออก

## 4. Search Ads campaign

ใน Google Ads → Campaigns → New → **Sales** หรือ **Leads** → Search:

- Bidding: **Maximize conversions** (ถ้าเพิ่งเริ่ม) → switch เป็น **Target CPA** หลังได้ conversion 30+/30 วัน
- Networks: ❌ ปิด Display Network ❌ ปิด Search partners (รอบแรก)
- Locations: Thailand
- Languages: Thai + English
- Audience signals: in-market for medical equipment

### Ad groups & keywords (เริ่ม 3 groups)

**Group A — Brand/Generic AED**
```
[เครื่องกระตุกหัวใจ]
[เครื่อง AED]
[AED ราคา]
"ซื้อ AED"
"AED ติดตั้ง"
```

**Group B — Use cases**
```
"AED สำนักงาน"
"AED โรงเรียน"
"AED โรงงาน"
"AED ฟิตเนส"
"AED หมู่บ้าน"
```

**Group C — Brand-specific**
```
"Yuwell Y2"
"PRIMEDIC HeartSave"
[AED Yuwell Y2]
```

Negative keywords (ใส่ทั้งระดับ campaign):
```
ฟรี, มือสอง, ใช้แล้ว, เช่า, ยืม, รีวิว, วิธีใช้, ราคาถูก, จำลอง, ของเล่น
```

### Responsive Search Ads (RSA) — เตรียม headlines/descriptions

Headlines (15 ชิ้น, ≤ 30 ตัวอักษร):
- AED Yuwell Y2 อย. รับรอง
- เครื่องกระตุกหัวใจ Shock 7 วินาที
- ราคาเริ่ม 39,999 บาท
- เสียงแนะนำภาษาไทย
- IP65 กันน้ำกันฝุ่น
- อย. รับรองถูกต้อง
- บริการหลังการขายไทย
- พร้อมตู้/แท่นตั้งพื้น
- ใช้ได้ทั้งผู้ใหญ่และเด็ก
- ออกใบกำกับภาษีได้
- รองรับงานราชการ/รพ.
- ปรึกษาฟรีทาง LINE
- จัดส่งทั่วประเทศ
- เจี่ยรักษา ผู้นำเข้าตรง
- โหลด 360J · 200J ผู้ใหญ่

Descriptions (4 ชิ้น, ≤ 90):
- AED Yuwell Y2 เครื่องกระตุกหัวใจไฟฟ้าอัตโนมัติ Shock พร้อมใน 7 วินาที เสียงแนะนำภาษาไทย IP65
- ทะเบียน อย. 65-2-2-2-0013415 · ปรึกษาฟรีทาง LINE
- ราคาเริ่ม 39,999 บาท พร้อมส่ง · มีตู้ติดผนัง/แท่นตั้งพื้น · ออกใบเสนอราคาทันที
- เหมาะสำหรับสำนักงาน โรงเรียน โรงงาน ฟิตเนส และหน่วยงานภาครัฐ

Final URL: `https://jiaaed.vercel.app/?utm_source=google&utm_medium=cpc&utm_campaign={campaignname}&utm_term={keyword}&utm_content={creative}`

### Sitelinks/Callouts/Structured snippets
- Sitelinks: "ดูราคา 3 แพ็กเกจ" → `#products`, "สเปคเครื่อง" → `#specs`, "ทำไมเลือกเรา" → trust section, "คุยกับ AI ฟรี" → LINE
- Callouts: "อย. รับรอง" "ส่งฟรีทั่วประเทศ" "บริการหลังการขายไทย" "ออกใบกำกับภาษี"
- Structured snippet (Models): Yuwell Y2, Yuwell Y2+ตู้, Yuwell Y2+แท่นตั้ง

## 5. Performance Max campaign

ต้องมี Merchant Center feed ก่อน — ใช้:

```
https://jiaaed.vercel.app/feed/products.xml
```

ใน Merchant Center → Products → Feeds → Add primary feed → **Scheduled fetch** → URL ด้านบน → ทุก 24 ชม.

ใน Google Ads → New campaign → **Sales** → Performance Max:
- Conversion goal: LINE Click (ที่สร้างไว้ขั้น 3)
- Listing groups: All products
- Asset group:
  - 5+ headlines, 5+ long headlines, 5+ descriptions (re-use จาก RSA)
  - 4+ images (square + landscape) — ใช้ `/images/aed-floorstand.png`, `aed-wallcabinet.png`, `product-main.png`, `lifestyle-cpr.png`
  - 1+ logo
  - 1 video — ถ้าไม่มี Google จะ auto-gen (คุณภาพไม่ดี แนะนำอัด YouTube short 15s)
- Audience signal: customer list (ถ้ามี) + interests "Health/Medical equipment"
- Final URL expansion: **เปิด** (ให้ Google ส่งไปหน้าที่ relevant ที่สุด — ตอนนี้มีหน้าเดียวอยู่แล้ว)

## 6. Budget แนะนำ (เริ่มต้น)

| Campaign | Daily budget | หมายเหตุ |
| --- | --- | --- |
| Search — Generic AED | 300 บาท/วัน | คาดหวัง CPC 15-40 บาท |
| Search — Brand Yuwell/PRIMEDIC | 100 บาท/วัน | CPC ต่ำ คุ้มมาก |
| Performance Max | 300 บาท/วัน | ปล่อย learning 2-3 สัปดาห์ |

รวม ~700 บาท/วัน → ~21,000 บาท/เดือน
ตั้ง **Account-level budget cap** กันยิงเกิน

## 7. Validate tracking ก่อนเปิด ads

1. เปิด `https://jiaaed.vercel.app/?gclid=test123&utm_source=test`
2. F12 → Console → `localStorage.getItem('jiaaed_gclid')` → ต้องได้ `test123`
3. คลิกปุ่ม LINE ใดๆ
4. F12 → Network → ต้องเห็น request ไป `googleads.g.doubleclick.net/pagead/conversion/...`
5. Google Ads → Goals → Conversions → status ของ "LINE Click" จะเปลี่ยนเป็น **Recording conversions** ภายใน 24 ชม.

## 7.5 Lead form (alternative conversion path)

นอกจากปุ่ม LINE แล้ว landing page มี form ที่ `/#contact` ให้ user กรอก ชื่อ/เบอร์/อีเมล ส่งเข้า:

- `aed_leads` table ใน Supabase (ต้อง run migration `supabase/aed_leads.sql` ก่อน)
- LINE push notify owner ทันที (ผ่าน `AED_LINE_CHANNEL_ACCESS_TOKEN` + `AED_OWNER_LINE_USER_ID`)
- Resend auto-reply email ไปยัง user (ถ้าตั้ง `RESEND_API_KEY` และ user กรอก email)

ก่อนเปิดใช้งาน:
1. ใน Supabase Dashboard → SQL Editor → run `supabase/aed_leads.sql`
2. ถ้าใช้ Resend: สมัครที่ resend.com → verify domain → เอา API key มาใส่ `RESEND_API_KEY`
3. (ถ้ายังไม่ได้ตั้ง) `AED_LINE_CHANNEL_ACCESS_TOKEN` + `AED_OWNER_LINE_USER_ID` เพื่อรับ notify ทาง LINE
4. ตั้ง `LEAD_IP_SALT` (สุ่ม) เพื่อ hash IP

### เพิ่มแอดมินรับ notify ทาง LINE หลายคน

notify ทุกชนิด (lead ใหม่, ใบเสนอราคา, ชำระเงิน, คนแอด LINE, รายงาน) จะส่งหา
`AED_OWNER_LINE_USER_ID` เสมอ ถ้าต้องการให้แอดมินคนอื่นได้รับด้วย ให้เพิ่ม env:

- `AED_ADMIN_LINE_USER_IDS` — LINE userId ของแอดมินคนอื่น ใส่หลายคนได้ คั่นด้วย
  คอมมา เช่น `Uaaaa...,Ubbbb...` (ระบบจะ merge กับ owner และตัด ID ซ้ำให้อัตโนมัติ)

**วิธีหา LINE userId ของแอดมินคนใหม่:** ให้แอดมินคนนั้นแอด LINE OA เป็นเพื่อน →
owner จะได้ notify `✅🎉 มีคนแอด LINE จริง!` ที่มีบรรทัด `🔗 LINE ID: U....` →
เอา ID นั้นไปใส่ `AED_ADMIN_LINE_USER_IDS` (ถ้าไม่เห็น notify ดูได้จาก log ของ
webhook `/api/aed/webhook/line` ตอน event `follow`) แล้ว redeploy

ทดสอบ:
- ไปที่ `/#contact` → กรอกชื่อ + เบอร์ + email → ส่ง
- ดู `aed_leads` table → row ใหม่
- รับ LINE push เป็น `🎯 Lead ใหม่`
- รับ email ตอบกลับ (ถ้าตั้ง Resend)
- DevTools Network เห็น request ไป `googleads.g.doubleclick.net` (สำหรับ Lead Form Submit conversion)

## 7.6 Web chat widget (เจี่ย AI บน landing page)

Floating chat bubble มุมขวาล่างของทุกหน้า — ใช้ Claude (claude-sonnet-4-6) ตอบคำถามแบบเดียวกับ LINE bot แต่ scope แคบกว่า:

- **ทำได้**: ตอบคำถามสเปค ราคาเริ่มต้น การติดตั้ง การรับประกัน FAQ
- **ทำไม่ได้** (จงใจ): ตกลงราคาสุดท้าย / ต่อรอง / สร้างใบเสนอราคา / ออกใบกำกับภาษี — ทั้งหมดให้ส่งไป LINE bot หรือ contact form

ก่อนเปิดใช้งาน:
- Vercel env: `ANTHROPIC_API_KEY` (จาก console.anthropic.com)
- ถ้าไม่ตั้ง → API ตอบ 503 และ widget แสดง error message สวยงาม (ไม่ทำให้หน้าเว็บพัง)

Tracking events ที่ติดมา (ส่งไป GA4):
- `web_chat_open` — user กดเปิด chat
- `web_chat_message_sent` — user ส่งข้อความ (พร้อม `turn` count)
- `web_chat_contact_click` — user กด "ขอใบเสนอราคา" จาก quick action ใน chat → scroll ไป #contact
- `web_chat_reset` — user กด "↻ ใหม่"
- `data-line-cta="web_chat_quick"` / `"web_chat_link"` — กดปุ่ม/ลิงก์ LINE จาก chat → ยิง LINE Click conversion ตามปกติ

State เก็บใน localStorage key `jiaaed_web_chat_v1` (เก็บล่าสุด 30 ข้อความ)

## 7.7 Offline Conversion API (ส่ง "ปิดดีลจริง" → Google Ads)

ใช้ส่ง conversion event ตอนลูกค้าจ่ายเงินจริง (จาก LINE/Stripe webhook) → Google Ads ผ่าน `gclid` หรือ Enhanced Conversions for Leads (hash email/phone) เพื่อให้ algorithm optimize ตาม conversion จริง ไม่ใช่แค่ "click LINE"

### Components

- `supabase/aed_ad_visits.sql` — ตาราง `aed_ad_visits` (เก็บ gclid/utm/fingerprint จาก ad arrival) + `aed_conversion_log` (audit trail ของ conversion ที่ส่งหรือ skip)
- `app/components/GoogleTags.tsx` — beacon ยิง `POST /api/aed/track-visit` ครั้งแรกของ session (เก็บ gclid + utm + fingerprint UUID)
- `app/api/aed/track-visit/route.ts` — รับ beacon, เก็บลง `aed_ad_visits` (เฉพาะที่มี gclid/gbraid/wbraid/fingerprint)
- `app/api/aed/google-ads/conversion/route.ts` — server-to-server endpoint ส่ง click conversion ไป Google Ads API v17; ต้อง bearer token `AED_INTERNAL_API_KEY`
- `lib/aed/google-ads.ts` — OAuth2 (refresh_token → access_token) + `uploadClickConversions` REST call; รองรับทั้ง gclid/gbraid/wbraid และ Enhanced Conversions (hashed email/phone)

### สร้าง Google Ads OAuth credentials

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Desktop application)
2. คัดลอก client_id + client_secret
3. ใช้ [OAuth Playground](https://developers.google.com/oauthplayground/) → ตั้ง custom credentials → scope `https://www.googleapis.com/auth/adwords` → Authorize → Exchange → คัดลอก refresh_token
4. Google Ads → Tools → API Center → ขอ developer_token (Basic access ก็พอ ถ้ายังไม่ทำเชิง production)

### สร้าง conversion action ตัวที่ 3 — `Sale Closed`

ใน Google Ads → Goals → Conversions → New conversion action → **Import** → Other:
- Conversion name: `Sale Closed`
- Category: **Purchase**
- Value: ใช้ค่า dynamic จาก request
- Count: **One**
- Click-through window: 90 days
- Attribution: Data-driven

เปิด **Use enhanced conversions for leads** ถ้าจะใช้ email/phone matching

หลังสร้าง → ดู URL จะเห็น `ctId=987654321` — เลขนั้นคือ `GOOGLE_ADS_CONVERSION_ACTION_ID`

### ตัวอย่างการเรียกใช้

จาก server (เช่น LINE webhook handler ตอน `notifyPaymentReceived` หรือ Stripe webhook):

\`\`\`ts
await fetch(\`\${process.env.SITE_URL}/api/aed/google-ads/conversion\`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: \`Bearer \${process.env.AED_INTERNAL_API_KEY}\`,
  },
  body: JSON.stringify({
    orderId: deal.id,
    valueThb: deal.total_amount,
    // ทางเลือก attribution (ลำดับความสำคัญ: gclid > gbraid > wbraid > enhanced)
    gclid: adVisit?.gclid,           // ถ้า join ad_visit ได้
    email: customer.email,           // หรือใช้ enhanced conversions
    phone: customer.phone,
  }),
});
\`\`\`

### Stub mode

ถ้ายังไม่มี Google Ads credentials → endpoint จะ log ลง `aed_conversion_log` ด้วย status `skipped_no_creds` และคืน `{ ok: true, sent: false }` — ปลอดภัยที่จะเรียกได้เลยแม้ยังไม่มี Google Ads account จริง

### TODO (ยังไม่ทำใน PR นี้)

- Hook อัตโนมัติใน LINE webhook (`tool-handlers.ts → create_payment_link` หรือ `aed_deals.payment_status='paid'` trigger) → เรียก endpoint นี้
- Resolve gclid จาก `aed_ad_visits` ผ่าน `fingerprint` หรือ `ip_hash` lookup ก่อนจะ fallback เป็น enhanced conversions

## 7.8 Week-2 optimization report (CPL / search terms)

หลัง Learning Phase จบ (14 วัน) ใช้สคริปต์นี้ดึงผลจริงแทนการเดา:

```bash
node --env-file=.env.local scripts/google-ads-report.mjs        # 14 วัน
node --env-file=.env.local scripts/google-ads-report.mjs --days 30
# หรือ
npm run report:ads
```

พิมพ์ออกมา: spend / conversions / **CPL** ต่อ campaign, top search terms (พร้อม flag
อันที่จ่ายงบแต่ 0 conversion → ตัวเลือก negative keyword) และ **คำตัดสินรอบ 2 อัตโนมัติ**
ตามกติกา CPL ≤ ฿200 (ดี → Target CPA + เพิ่มงบ) / > ฿300 (แย่ → ห้ามเพิ่มงบ).

มี endpoint เทียบเท่าด้วย (bearer `AED_INTERNAL_API_KEY`):

```bash
curl -H "authorization: Bearer $AED_INTERNAL_API_KEY" \
  "https://www.jiaaed.com/api/aed/google-ads/report?days=14"
```

ทั้งสคริปต์และ endpoint ใช้ GAQL ผ่าน OAuth ชุดเดียวกับ Offline Conversion API (§7.7)
ถ้า `GOOGLE_ADS_*` ไม่ครบ → ตอบ `not_configured` (ไม่ error).

### ✅ Verify ว่า "Conversions" optimize ตามลีดจริง ไม่ใช่คลิก LINE

คลิกปุ่ม LINE **ไม่เท่ากับ** ลีดจริง (คนคลิกแล้วไม่ได้แอด/ทักก็มี) ถ้าให้ bid strategy
optimize ตาม LINE Click มันจะ scale traffic ที่คลิกเยอะแต่ไม่ปิดการขาย ตั้งค่าให้ถูก:

- **Lead Form Submit** = **Primary** ("Use for bidding" ✅) — ลีดที่มี contact จริงเข้า `aed_leads`
- **LINE Click** = **Secondary** ("Use for bidding" ❌, ดูเป็น observe อย่างเดียว)
- **Sale Closed** (offline, §7.7) = Primary เมื่อเริ่มส่งดีลปิดจริง

เช็คที่ Google Ads → Goals → Conversions → คอลัมน์ "Optimization" ของแต่ละ action

## 8. SEO + AEO (Answer Engine Optimization)

ติดมาให้แล้วในชุดนี้ — ไม่ต้องตั้งค่าเพิ่ม:

| สิ่งที่ติด | URL / file | ใช้สำหรับ |
| --- | --- | --- |
| JSON-LD: Organization, WebSite, FAQPage, Product × 3 | inline ใน `<head>` (`app/components/StructuredData.tsx`) | Google rich results, AI answer engines |
| FAQ section (10 คำถาม) | `/#faq` (`lib/aed/faqs.ts`) | AEO content + Google FAQ rich result |
| Sitemap | `/sitemap.xml` (`app/sitemap.ts`) | Submit ใน Google Search Console |
| robots.txt | `/robots.txt` (`app/robots.ts`) | Allow GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended |
| `llms.txt` (AEO standard) | `/llms.txt` (`public/llms.txt`) | Plaintext brief สำหรับ AI search engines |

ขั้นต่อไป:
1. Submit `/sitemap.xml` ใน [Search Console](https://search.google.com/search-console)
2. Submit ใน [Bing Webmaster](https://www.bing.com/webmasters) (Bing/ChatGPT search ใช้ index นี้)
3. Test rich results: https://search.google.com/test/rich-results?url=https://jiaaed.vercel.app
4. Validate sitemap/robots: เปิด `https://jiaaed.vercel.app/robots.txt` และ `/sitemap.xml`

## 9. ก้าวต่อไป (อนาคต)

- **Offline Conversion API**: ส่ง event "ลูกค้าซื้อจริง" จาก LINE webhook → Google Ads ผ่าน gclid ที่เก็บใน localStorage (ต้องเพิ่ม flow ฝั่ง LINE bot ถามให้ user ส่ง gclid หรือผูก LINE userId กับ session ผ่าน LIFF)
- **Customer Match**: upload เบอร์โทร/อีเมลของลูกค้าที่ปิดดีลแล้ว ใช้เป็น signal ใน PMax
- **Dynamic remarketing**: ผูก feed นี้กับ remarketing tag เพื่อยิงคนที่เข้าเว็บแต่ยังไม่ทัก LINE
