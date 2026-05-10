# Google Ads Setup — JiaAED

คู่มือเปิด Google Ads สำหรับ JiaAED โดยใช้ tracking ที่ติดไว้ใน landing page นี้แล้ว

## 1. Environment variables (Vercel)

ตั้งใน Vercel project → Settings → Environment Variables (ทั้ง Production + Preview):

| ตัวแปร | ตัวอย่าง | จำเป็น |
| --- | --- | --- |
| `NEXT_PUBLIC_GA4_ID` | `G-XXXXXXXXXX` | สำหรับ GA4 analytics |
| `NEXT_PUBLIC_GADS_ID` | `AW-1234567890` | สำหรับ Google Ads conversion |
| `NEXT_PUBLIC_GADS_CONVERSION_LABEL` | `AbC-D_efGhIjKlMn` | label จาก conversion action |
| `NEXT_PUBLIC_SITE_URL` | `https://jiaaed.vercel.app` | ใช้ใน Merchant Center feed |

ถ้ายังไม่ใส่ค่า — gtag จะไม่โหลด ไม่กระทบ landing page

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
"Amoul i7"
"AED Amoul"
[AED Amoul i7]
```

Negative keywords (ใส่ทั้งระดับ campaign):
```
ฟรี, มือสอง, ใช้แล้ว, เช่า, ยืม, รีวิว, วิธีใช้, ราคาถูก, จำลอง, ของเล่น
```

### Responsive Search Ads (RSA) — เตรียม headlines/descriptions

Headlines (15 ชิ้น, ≤ 30 ตัวอักษร):
- AED Amoul i7 อย. รับรอง
- เครื่องกระตุกหัวใจ Shock 7 วินาที
- ราคาเริ่ม 39,999 บาท
- เสียงแนะนำภาษาไทย
- IP65 กันน้ำกันฝุ่น
- ใบโฆษณา ฆพ.743/2569
- รับประกัน 1 ปีเต็ม
- พร้อมตู้/แท่นตั้งพื้น
- ใช้ได้ทั้งผู้ใหญ่และเด็ก
- ออกใบกำกับภาษีได้
- รองรับงานราชการ/รพ.
- ปรึกษาฟรีทาง LINE
- จัดส่งทั่วประเทศ
- เจี่ยรักษา ผู้นำเข้าตรง
- โหลด 360J · 200J ผู้ใหญ่

Descriptions (4 ชิ้น, ≤ 90):
- AED Amoul i7 เครื่องกระตุกหัวใจไฟฟ้าอัตโนมัติ Shock พร้อมใน 7 วินาที เสียงแนะนำภาษาไทย IP65
- ทะเบียน อย. 68-2-2-2-0005243 · ฆพ.743/2569 · รับประกัน 1 ปี · ปรึกษาฟรีทาง LINE
- ราคาเริ่ม 39,999 บาท พร้อมส่ง · มีตู้ติดผนัง/แท่นตั้งพื้น · ออกใบเสนอราคาทันที
- เหมาะสำหรับสำนักงาน โรงเรียน โรงงาน ฟิตเนส และหน่วยงานภาครัฐ

Final URL: `https://jiaaed.vercel.app/?utm_source=google&utm_medium=cpc&utm_campaign={campaignname}&utm_term={keyword}&utm_content={creative}`

### Sitelinks/Callouts/Structured snippets
- Sitelinks: "ดูราคา 3 แพ็กเกจ" → `#products`, "สเปคเครื่อง" → `#specs`, "ทำไมเลือกเรา" → trust section, "คุยกับ AI ฟรี" → LINE
- Callouts: "อย. รับรอง" "ส่งฟรีทั่วประเทศ" "รับประกัน 1 ปี" "ออกใบกำกับภาษี"
- Structured snippet (Models): Amoul i7, Amoul i7+ตู้, Amoul i7+แท่นตั้ง

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
| Search — Brand Amoul | 100 บาท/วัน | CPC ต่ำ คุ้มมาก |
| Performance Max | 300 บาท/วัน | ปล่อย learning 2-3 สัปดาห์ |

รวม ~700 บาท/วัน → ~21,000 บาท/เดือน
ตั้ง **Account-level budget cap** กันยิงเกิน

## 7. Validate tracking ก่อนเปิด ads

1. เปิด `https://jiaaed.vercel.app/?gclid=test123&utm_source=test`
2. F12 → Console → `localStorage.getItem('jiaaed_gclid')` → ต้องได้ `test123`
3. คลิกปุ่ม LINE ใดๆ
4. F12 → Network → ต้องเห็น request ไป `googleads.g.doubleclick.net/pagead/conversion/...`
5. Google Ads → Goals → Conversions → status ของ "LINE Click" จะเปลี่ยนเป็น **Recording conversions** ภายใน 24 ชม.

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
