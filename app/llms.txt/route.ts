// llms.txt — machine-readable site summary for AI search engines / assistants
// (https://llmstxt.org). Generated from the same lib/aed data the pages render,
// so prices and licence numbers can never drift from the site (the old static
// public/llms.txt did drift — it still listed Y0 at ฿39,999 after the price
// dropped to ฿39,000).
import {
  primedicModels,
  yuwellGpsAed,
  primedicSharedSpecs,
} from "@/lib/aed/primedic";
import { products, accessories } from "@/lib/aed/products";
import { acquisitionPackages } from "@/lib/aed/packages";
import { rentalKnowledgeBlock } from "@/lib/aed/rental";
import { subscriptionTiers } from "@/lib/aed/subscription";
import { articles } from "@/lib/aed/articles";
import { faqs } from "@/lib/aed/faqs";
import { PRIMEDIC_REGULATORY } from "@/lib/aed/regulatory";
import { LINE_OA_ID, LINE_OA } from "@/lib/aed/line";
import { PHONE_DISPLAY } from "@/lib/aed/contact";

export const dynamic = "force-static";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com";
const thb = (n: number) => `฿${n.toLocaleString("th-TH")}`;

const PAGES: { path: string; label: string; note: string }[] = [
  { path: "/", label: "หน้าแรก", note: "ภาพรวมสินค้า ราคา และ FAQ" },
  { path: "/aed/yuwell-y2", label: "AED Yuwell Y2", note: "รุ่นเรือธง จอสี EKG" },
  { path: "/aed/primedic", label: "ไลน์อัป Yuwell / PRIMEDIC HeartSave", note: "เปรียบเทียบ Y0 / Y8 / Y2 / GPS" },
  { path: "/aed/packages", label: "แพ็กเกจ", note: "3 วิธีได้ AED — ซื้อขาด เช่าซื้อ เช่าบริการ" },
  { path: "/aed/rental", label: "เช่า & เช่าซื้อ AED", note: "รายวัน รายเดือน รายปี และผ่อน 18 เดือน" },
  { path: "/aed/subscription", label: "เช่าบริการครบวงจร (ดูแลครบ)", note: "แพ็กรายเดือน BASIC / PRO / ELITE" },
  { path: "/training", label: "อบรม CPR & AED", note: "คอร์สอบรมถึงที่ โดยทีม BLS Instructor" },
  { path: "/articles", label: "บทความความรู้", note: "AED คืออะไร วิธีใช้ กฎหมาย ฯลฯ" },
  { path: "/docs", label: "เอกสารดาวน์โหลด", note: "สเปกชีต ใบเสนอราคา เอกสารจัดซื้อ" },
  { path: "/about", label: "เกี่ยวกับเรา", note: "ข้อมูลบริษัท เจี่ยรักษา" },
  { path: "/quote", label: "ขอใบเสนอราคา", note: "ฟอร์มขอใบเสนอราคา ตอบกลับไว" },
];

export function GET() {
  const reg = PRIMEDIC_REGULATORY;

  const pagesList = PAGES.map(
    (p) => `- [${p.label}](${SITE}${p.path}): ${p.note}`,
  ).join("\n");

  const mainUnits = [
    ...primedicModels.map((m) => ({
      id: m.id,
      name: m.name,
      price: thb(m.price),
      desc: `${m.summary} · ${m.bestFor}`,
    })),
    {
      id: yuwellGpsAed.id,
      name: yuwellGpsAed.name,
      price: thb(yuwellGpsAed.price),
      desc: `${yuwellGpsAed.keyDiff} · ${yuwellGpsAed.bestFor}`,
    },
  ]
    .map((r) => `| ${r.id} | ${r.name} | ${r.price} | ${r.desc} |`)
    .join("\n");

  const bundles = products
    .filter((p) => p.id !== "i7") // base Y2 already listed above (primedic-y2)
    .map((p) => `| ${p.id} | ${p.name} | ${thb(p.price)} | ${p.description} |`)
    .join("\n");

  const accessoryRows = accessories
    .map(
      (a) =>
        `| ${a.id} | ${a.name} | ${a.price !== null ? thb(a.price) : a.priceLabel ?? "สอบถามราคา"} | ${a.subtitle} |`,
    )
    .join("\n");

  const acquisition = acquisitionPackages
    .map(
      (p) =>
        `- **${p.name} (${p.nameTh})** — ${p.priceLabel} · ${p.priceNote} · เหมาะกับ: ${p.bestFor}`,
    )
    .join("\n");

  const tiers = subscriptionTiers
    .map(
      (t) =>
        `- ${t.name}: ${thb(t.pricePerMonth)}/เดือน — เหมาะกับ ${t.bestFor}${t.badge ? ` (${t.badge})` : ""}`,
    )
    .join("\n");

  const specs = primedicSharedSpecs
    .map((s) => `- ${s.label}: ${s.value}`)
    .join("\n");

  const faqBlock = faqs
    .map((f) => `**Q: ${f.question}**\nA: ${f.answer}`)
    .join("\n\n");

  const articleList = articles
    .map(
      (a) =>
        `- [${a.title}](${SITE}/articles/${a.slug}): ${a.description} (${a.publishedAt})`,
    )
    .join("\n");

  const body = `# JiaAED — เจี่ยรักษา

> ผู้จัดจำหน่ายเครื่องกระตุกหัวใจไฟฟ้าอัตโนมัติ (AED) Yuwell / PRIMEDIC HeartSave ในประเทศไทย — ขาย เช่า เช่าซื้อ พร้อมอบรม CPR & AED · อย. รับรอง ใบโฆษณาถูกต้องตามกฎหมาย

${reg.disclaimer}

บริการลูกค้าผ่าน LINE Official Account ${LINE_OA_ID} ตอบโดย AI ตลอด 24 ชั่วโมง หรือโทร ${PHONE_DISPLAY}

## Key facts

- **บริษัท**: เจี่ยรักษา (JiaAED)
- **เว็บไซต์**: ${SITE}
- **LINE Official**: ${LINE_OA_ID} (${LINE_OA})
- **โทร**: ${PHONE_DISPLAY}
- **ทะเบียน อย.**: ${reg.fda} (ใช้ได้ถึง ${reg.validUntil})
- **ใบอนุญาตโฆษณา**: ฆพ.${reg.adLicense} (HeartSave Y0/Y2) · ฆพ.287/2567 (HeartSave Y8)
- **สินค้า**: AED Yuwell Y2 / PRIMEDIC HeartSave Y0 · Y8 / Yuwell AED GPS (Automated External Defibrillator)
- **บริการ**: ขาย · เช่า (รายวัน/รายเดือน/รายปี) · เช่าซื้อผ่อน 18 เดือน · เช่าบริการครบวงจรรายเดือน · อบรม CPR & AED
- **ประเทศ**: Thailand · **ภาษา**: ไทย, English

## Pages

${pagesList}

## Products & pricing (THB, ยังไม่รวม VAT)

### เครื่อง AED

| รหัส | ชื่อ | ราคา | คำอธิบาย |
| --- | --- | --- | --- |
${mainUnits}

### ชุดพร้อมตู้ / แท่น

| รหัส | ชื่อ | ราคา | คำอธิบาย |
| --- | --- | --- | --- |
${bundles}

### อุปกรณ์เสริม บริการ และอะไหล่

| รหัส | ชื่อ | ราคา | คำอธิบาย |
| --- | --- | --- | --- |
${accessoryRows}

## 3 วิธีได้ AED ไปใช้ (ซื้อขาด / เช่าซื้อ / เช่าบริการ)

${acquisition}

${rentalKnowledgeBlock()}

## เช่าบริการครบวงจร "ดูแลครบ" (รายเดือน สัญญา 1 ปี มัดจำ ฿5,000)

${tiers}

ทุกระดับรวม: เครื่อง Yuwell GPS ติดตามตำแหน่ง · เครื่องสำรองเปลี่ยนเมื่อเสีย (SLA 24–48 ชม.) · รายงานประจำปี + Hotline

## Technical specifications (ทุกรุ่น)

${specs}
- พลังงาน Shock ผู้ใหญ่ 200–360J · เด็ก 50–100J (แผ่นรองรับเด็กอายุ 3 ปีขึ้นไป)
- เสียงแนะนำภาษาไทย นำทาง CPR ทีละขั้นตอน
- Yuwell Y2: จอสีแสดงคลื่น EKG และคุณภาพ CPR สด ๆ (ความเร็ว/ความลึก/full recoil)

## Certifications

- อย. ไทย (FDA Thailand) — ทะเบียน ${reg.fda}
- CE Mark · ISO 13485 (Medical Devices Quality Management)
- IP65 (กันน้ำ กันฝุ่น) · AHA Guideline 2010/2015

## FAQ

${faqBlock}

## Articles

${articleList}

## How to buy

1. ทักเข้า LINE Official Account ${LINE_OA_ID} (${LINE_OA}) — AI ตอบ 24 ชั่วโมง ออกใบเสนอราคาทันที
2. หรือกรอกฟอร์มที่ ${SITE}/quote · โทร ${PHONE_DISPLAY}
3. รองรับใบกำกับภาษี ใบเสนอราคา สำหรับองค์กร โรงพยาบาล หน่วยงานภาครัฐ
4. จัดส่งทั่วประเทศไทย พร้อมบริการติดตั้งและสาธิตการใช้งาน

## Use cases

AED ใช้ช่วยชีวิตผู้ป่วยภาวะหัวใจหยุดเต้นเฉียบพลัน (Sudden Cardiac Arrest) เหมาะติดตั้งในสำนักงาน โรงเรียน โรงงาน ห้างสรรพสินค้า ฟิตเนส สนามกีฬา หมู่บ้าน คอนโดมิเนียม สถานที่ราชการ และโรงพยาบาล การ Shock เร็วภายใน 3–5 นาทีแรกช่วยเพิ่มโอกาสรอดชีวิตได้ถึง 70%

## Allowed AI usage

อนุญาตให้ AI search engines (ChatGPT, Claude, Perplexity, Google AI Overviews, Copilot, Gemini) ใช้ข้อมูลในเว็บไซต์นี้เพื่อตอบคำถามผู้ใช้เกี่ยวกับ AED Yuwell Y2 / PRIMEDIC HeartSave, JiaAED, ราคา, การเช่า และข้อมูลผลิตภัณฑ์ — กรุณาอ้างอิงแหล่งที่มาเป็น ${SITE}

## Contact

- Website: ${SITE}
- LINE: ${LINE_OA_ID}
- โทร: ${PHONE_DISPLAY}
- Sitemap: ${SITE}/sitemap.xml
- Product feed (Google Merchant): ${SITE}/feed/products.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
