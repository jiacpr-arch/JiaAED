# ตรวจความพร้อม AI SEO — jiaaed.com (6 ส.ค. 2026)

คำถามจากเจ้าของ: เห็นโฆษณา Z.com ขายบริการ "ตรวจความพร้อม AI SEO ปรับโครงสร้างเว็บ
วิเคราะห์คีย์เวิร์ด/คู่แข่ง" — **เราทำเองได้ไหม?**

**คำตอบ: ทำเองได้ และส่วนใหญ่ทำไปแล้วก่อนหน้านี้** สิ่งที่บริการพวกนี้ขาย
(technical AI SEO) คือของที่อยู่ในเว็บเราอยู่แล้วเกือบครบ รอบนี้เก็บส่วนที่ขาด
ให้ครบ ส่วนที่เหลือเป็นงานต่อเนื่อง (คอนเทนต์/off-site) ไม่ใช่งานเทคนิค

## สิ่งที่มีอยู่แล้วก่อนตรวจ (ไม่ต้องจ้างใครทำ)

- ✅ `robots.txt` เปิดรับ AI crawlers หลัก (GPTBot, ClaudeBot, PerplexityBot, Google-Extended ฯลฯ)
- ✅ `llms.txt` สรุปธุรกิจ/สินค้า/ราคาให้ AI อ่าน
- ✅ `sitemap.xml` ครบทุกหน้า + บทความ
- ✅ JSON-LD: Organization, WebSite, Product (พร้อมราคา/อย.), FAQPage
- ✅ Metadata ครบทุกหน้า: title/description/canonical/OG image
- ✅ เนื้อหาแบบที่ AI ชอบอ้างอิง: FAQ ถาม-ตอบ, ตารางเปรียบเทียบรุ่น, ราคาโปร่งใส,
  บทความความรู้ 10 เรื่อง, เลขทะเบียน อย./ฆพ. ชัดเจน (E-E-A-T signals)

## สิ่งที่เพิ่มในรอบนี้

1. **llms.txt เปลี่ยนจากไฟล์ static เป็น generate จากข้อมูลจริง** (`app/llms.txt/route.ts`)
   - ไฟล์เดิมราคา drift แล้ว: เขียน Y0 = ฿39,999 แต่ราคาจริงบนเว็บคือ ฿39,000
   - ไฟล์เดิมไม่มีข้อมูล เช่า/เช่าซื้อ/ดูแลครบ ซึ่งเป็นบริการหลักตอนนี้
   - ตอนนี้ดึงจาก `lib/aed/*` ชุดเดียวกับหน้าเว็บ: ราคาเครื่อง, ชุดตู้, อะไหล่,
     แผนเช่า 3 แบบ, เช่าซื้อ 18 งวด, ดูแลครบ BASIC/PRO/ELITE, FAQ ทั้งชุด,
     รายชื่อบทความพร้อมลิงก์ — แก้ข้อมูลที่ lib แล้ว llms.txt อัปเดตเอง
2. **Article JSON-LD + รูป OG ในหน้าบทความ** (`/articles/[slug]`)
   - เดิมบทความไม่มี structured data เลย — AI/Google ไม่รู้วันเผยแพร่ ผู้เขียน สำนักพิมพ์
3. **BreadcrumbList JSON-LD** ในหน้า /aed/* ทุกหน้า, /training และหน้าบทความ
   - ช่วยให้ search/AI เข้าใจโครงสร้างเว็บ และแสดง breadcrumb ในผลค้นหา
4. **เพิ่ม AI crawlers รุ่นใหม่ใน robots**: Claude-User/Claude-SearchBot,
   Perplexity-User, Amazonbot (Alexa), DuckAssistBot, meta-externalagent,
   cohere-ai, MistralAI-User

## สิ่งที่เครื่องมือ/โค้ดทำให้ไม่ได้ (งานต่อเนื่อง)

| งาน | ทำไมสำคัญกับ AI search | ใครทำ |
| --- | --- | --- |
| Google Business Profile ให้ครบ (ที่อยู่ รูป รีวิว) | AI Overview ดึงข้อมูล local business จาก GBP บ่อยมาก | เจ้าของ (ฟรี) |
| รีวิวจริงจากลูกค้า (Google/Facebook) | AI ชอบอ้างแหล่งที่มี social proof | เจ้าของขอลูกค้า |
| เขียนบทความตอบคำถามที่คนถาม AI จริง ๆ ต่อเนื่อง | ระบบ article-gap cron มีอยู่แล้ว — ใช้ต่อ | ระบบ + เจ้าของ approve |
| ให้เว็บ/ข่าว/สมาคมอื่นลิงก์มาหาเรา (backlinks) | ความน่าเชื่อถือ off-site ยังเป็นปัจจัยหลัก | เจ้าของ/PR |

## วิธีเช็กผลด้วยตัวเอง (ฟรี)

- ถาม ChatGPT / Perplexity / Google AI Mode: "AED ราคาเท่าไหร่ ยี่ห้อไหนดี ประเทศไทย",
  "เช่า AED ที่ไหน" — ดูว่า jiaaed.com ถูกอ้างถึงไหม (ทำเดือนละครั้ง จดผลไว้)
- Google Search Console → Performance ดู impression จาก AI Overview
- ทดสอบ structured data: https://search.google.com/test/rich-results
- ดู llms.txt สด ๆ ที่ https://jiaaed.com/llms.txt

สรุป: ไม่จำเป็นต้องซื้อบริการ AI SEO ภายนอก — technical readiness ครบแล้ว
เงินเท่ากันเอาไปลง Google Ads / รูปถ่ายสินค้า / รีวิวลูกค้า คุ้มกว่า
