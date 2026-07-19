import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MiniLeadForm } from "@/app/components/MiniLeadForm";
import { PriceViewTracker } from "@/app/components/PriceViewTracker";
import { JiaAedLogo } from "@/app/components/JiaAedLogo";
import {
  primedicModels,
  primedicSharedSpecs,
  primedicCertifications,
} from "@/lib/aed/primedic";
import { acquisitionPackages } from "@/lib/aed/packages";
import { faqs } from "@/lib/aed/faqs";
import { PRIMEDIC_REGULATORY, regLine } from "@/lib/aed/regulatory";
import { FOOTER_GROUPS } from "@/lib/aed/nav";
import { lineOaUrl } from "@/lib/aed/line";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/aed/contact";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com";

// Single source of truth — price/copy comes from the catalog, never re-typed.
const y2 = primedicModels.find((m) => m.id === "primedic-y2")!;
const y2Installment = acquisitionPackages.find((p) => p.id === "pkg-start-y2")!;
const Y2_PRICE = `฿${y2.price.toLocaleString()}`;

const LINE_Y2 = lineOaUrl(`สนใจ AED Yuwell Y2 (จอสี EKG) ราคา ${Y2_PRICE} ขอใบเสนอราคาครับ`);
const LINE_Y2_GOV = lineOaUrl(
  "สนใจ AED Yuwell Y2 สำหรับจัดซื้อหน่วยงาน ขอชุดเอกสารจัดซื้อ (ใบเสนอราคา / สเปกชีต / อย.) ครับ",
);
const LINE_Y2_INSTALLMENT = lineOaUrl("สนใจ AED Yuwell Y2 แบบผ่อนชำระ 18 เดือน ขอรายละเอียดครับ");

export const metadata: Metadata = {
  title: `AED Yuwell Y2 ราคา ${Y2_PRICE} — จอสี EKG ตรงสเปกจัดซื้อภาครัฐ`,
  description:
    `AED Yuwell Y2 (You Too) รุ่นเรือธง จอสี EKG ดูคุณภาพ CPR สด ๆ ราคา ${Y2_PRICE} (ยังไม่รวม VAT) ` +
    "หรือผ่อน ฿3,400/เดือน × 18 เดือน · สเปกตรงเอกสารจัดซื้อภาครัฐ · อย. รับรอง · CE / ISO 13485 · " +
    "โทร 090-979-1212 หรือ LINE @jiacpr",
  alternates: { canonical: "/aed/yuwell-y2" },
  robots: { index: PRIMEDIC_REGULATORY.published, follow: true },
  openGraph: {
    title: `AED Yuwell Y2 ราคา ${Y2_PRICE} — จอสี EKG · ซื้อสดหรือผ่อนได้`,
    description:
      "รุ่นเรือธง จอสี EKG ดูคุณภาพ CPR สด ๆ สเปกตรงเอกสารจัดซื้อภาครัฐ อย. รับรอง — ผ่อน ฿3,400/เดือน × 18 เดือน",
    url: "/aed/yuwell-y2",
    images: [{ url: "/images/primedic-y2-open.jpg", width: 1254, height: 1254 }],
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

// เอกสารสเปกจัดซื้อ อปท. (เจ้าของยืนยันครบทุกข้อ ก.ค. 2026) ↔ สเปกจริงของ Y2
// จาก primedicSharedSpecs — ห้ามเคลมเกินข้อมูลใน lib/aed/primedic.ts
const govSpecChecklist: { spec: string; evidence: string }[] = [
  {
    spec: "ตัวเครื่องรวมแบตเตอรี่ทำจากวัสดุแข็งแรง มีหูหิ้วในตัว ขนาดกะทัดรัด น้ำหนักไม่เกิน 3 กิโลกรัม",
    evidence: "น้ำหนัก ~2.5 กก. (รวมโมดูลพลังงานและแผ่น) · 22 × 9.7 × 29.6 ซม. · มีหูหิ้วในตัว",
  },
  {
    spec: "ใช้กระตุกหัวใจได้ทั้งเด็กและผู้ใหญ่",
    evidence: "ปุ่มเลือกโหมดเด็ก — เด็ก 50→70→100J / ผู้ใหญ่ 200→300→360J · แผ่นรองรับเด็กอายุ 3 ปีขึ้นไป",
  },
  {
    spec: "วิเคราะห์คลื่นไฟฟ้าหัวใจและแนะนำการช็อกด้วยไฟฟ้าแบบอัตโนมัติ พร้อมระบบแนะนำการปฏิบัติงานด้วยเสียง",
    evidence: "Single Channel ECG วิเคราะห์จังหวะหัวใจอัตโนมัติ · เสียงนำทาง CPR ทีละขั้นตอน · ปุ่ม Shock กึ่งอัตโนมัติ",
  },
  {
    spec: "มีระบบทดสอบความพร้อมของเครื่องแบบอัตโนมัติ (Self-Test) ทุก 24 ชั่วโมง",
    evidence: "Self-test อัตโนมัติทุก 24 ชั่วโมง · บันทึกผลได้ถึง 3,650 ครั้ง",
  },
  {
    spec: "ให้คำแนะนำการปฏิบัติงานตามแนวทางปฏิบัติล่าสุดเป็นเสียงภาษาไทย",
    evidence: "เสียงนำทางภาษาไทย (เลือกได้ 4 ภาษา: ไทย / อังกฤษ / จีน / เยอรมัน)",
  },
  {
    spec: "ผ่านมาตรฐานสากล FDA หรือ CE และใช้งานตามแนวทาง AHA Guideline 2010/2015 ว่าด้วยกระบวนการช่วยชีวิต (CPR)",
    evidence: "CE · ISO 13485 · อย. 65-2-2-2-0013415 · ทำงานตาม AHA Guideline 2010/2015",
  },
  {
    spec: "หน้าจอ Backlight แสดงผลดิจิตอล ใช้งานง่ายแม้ในที่มืด",
    evidence: "จอสี Backlight แสดงคลื่น EKG + คุณภาพ CPR สด ๆ อ่านง่ายแม้ในที่มืด",
  },
  {
    spec: "เปลี่ยนแบตเตอรี่ได้ พร้อมปุ่มเปิดเครื่องและดูค่าการทำงานย้อนหลัง",
    evidence: "แบตเตอรี่เปลี่ยนได้ (LiMnO₂ มีอะไหล่แท้) · บันทึกข้อมูลย้อนหลังใน SD card 16GB ดึงผ่าน USB",
  },
];

const keyFeatures: { icon: string; title: string; desc: string }[] = [
  {
    icon: "🖥️",
    title: "จอสี EKG — ดูคุณภาพ CPR สด ๆ",
    desc: "แสดงความเร็ว / ความลึก / การปล่อยสุด (full recoil) และคลื่น EKG เรียลไทม์ ปรับท่าปั๊มได้ทันที",
  },
  {
    icon: "🗣️",
    title: "เสียงนำทางภาษาไทย",
    desc: "แนะนำทีละขั้นตอน คนไม่เคยฝึกก็ใช้ได้ (เลือกได้ 4 ภาษา)",
  },
  {
    icon: "⚡",
    title: "วิเคราะห์เร็ว พร้อมช็อกใน ≤ 5 วินาที",
    desc: "วิเคราะห์คลื่นหัวใจถึงชาร์จ 200J พร้อมช็อกภายใน ≤ 5 วินาที — ทุกวินาทีคือชีวิต",
  },
  {
    icon: "👨‍👩‍👧",
    title: "ใช้ได้ทั้งเด็กและผู้ใหญ่",
    desc: "ปุ่มสลับโหมดเด็กในตัว — เด็ก 50–100J / ผู้ใหญ่ 200–360J",
  },
];

const gallery: { src: string; alt: string }[] = [
  { src: "/images/primedic-y2-open.jpg", alt: "Yuwell Y2 — เปิดฝาแสดงจอ EKG พร้อมแผ่นอิเล็กโทรด (รุ่นเรือธง)" },
  { src: "/images/primedic-y2-flyer-khop.jpg", alt: "Yuwell Y2 — ใบปลิวทางการ พร้อมเลขใบอนุญาตโฆษณา ฆพ.2475/2569" },
  { src: "/images/primedic-y2-electrodes.jpg", alt: "Yuwell Y2 — แผ่นอิเล็กโทรดในช่องเก็บด้านในฝาเครื่อง" },
  // primedic-y2-vital-launch.webp ถูกถอดออกชั่วคราว — โปสเตอร์ฝังราคาเก่า ฿59,000
  // ใส่กลับเมื่อเจ้าของทำเวอร์ชันราคา ฿59,999
  { src: "/images/yuwell-y2-features.webp", alt: "Yuwell Y2 — สรุปจุดเด่น หน้าจอสี วิเคราะห์และช็อกได้รวดเร็ว ใช้ได้ทุกวัย" },
  { src: "/images/yuwell-y2-main.jpg", alt: "Yuwell Y2 — ตัวเครื่องเปิดฝาพร้อมใช้งาน" },
];

// Y2-only Product JSON-LD — do NOT reuse ProductStructuredData (it emits the
// whole PRIMEDIC lineup, which doesn't appear on this page).
function Y2StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: y2.name,
    description: `${y2.summary} ${y2.keyDiff}`,
    image: `${SITE}${y2.image}`,
    brand: { "@type": "Brand", name: "Yuwell" },
    sku: y2.id,
    category: "Medical Equipment / AED / Defibrillator",
    offers: {
      "@type": "Offer",
      url: `${SITE}/aed/yuwell-y2`,
      priceCurrency: "THB",
      price: y2.price,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "JiaAED" },
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function YuwellY2Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {PRIMEDIC_REGULATORY.published && <Y2StructuredData />}

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <JiaAedLogo className="h-8 w-auto" variant="dark" />
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={PHONE_HREF}
              data-cta="tel_y2_navbar"
              className="hidden sm:block text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-2"
            >
              📞 {PHONE_DISPLAY}
            </a>
            <a
              href={LINE_Y2}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="y2_navbar"
              data-product="primedic-y2"
              className="bg-[#06C755] text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-[#05a847]"
            >
              💬 LINE
            </a>
          </div>
        </div>
      </header>

      {/* Reassurance strip */}
      <div className="bg-gray-50 border-b border-gray-200 text-center py-2 px-4 text-xs text-gray-600">
        🏅 รุ่นเรือธง · อย. {PRIMEDIC_REGULATORY.fda} · CE / ISO 13485 · ออกใบกำกับภาษีได้ · รองรับจัดซื้อภาครัฐ
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <div className="inline-block bg-red-50 text-red-700 border border-red-100 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              เรือธง · จอสี EKG · You Too
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">
              AED Yuwell Y2
              <br />
              <span className="text-red-600">เครื่องกระตุกหัวใจไฟฟ้าอัตโนมัติ</span>
            </h1>
            <p className="text-gray-600 mb-6">
              {y2.keyDiff} — สเปกตรงเอกสารจัดซื้อภาครัฐ พร้อมเอกสารครบ ใบเสนอราคา / สเปกชีต / อย.
            </p>

            <div className="mb-6">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-gray-900">{Y2_PRICE}</span>
                <span className="text-sm text-gray-500 mb-2">ยังไม่รวม VAT</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                หรือ <span className="font-bold text-red-600">ผ่อน {y2Installment.priceLabel}</span> × 18 เดือน
                (มัดจำ ฿22,000) แล้วเป็นเจ้าของ
              </p>
            </div>

            <div className="flex flex-col gap-3 max-w-md">
              <a
                href={LINE_Y2}
                target="_blank"
                rel="noopener noreferrer"
                data-line-cta="y2_hero"
                data-product="primedic-y2"
                className="block bg-[#06C755] text-white font-bold text-xl px-8 py-4 rounded-full hover:bg-[#05a847] text-center shadow-lg shadow-[#06C755]/30"
              >
                💬 สอบถาม / ขอใบเสนอราคาทาง LINE
              </a>
              <a
                href={PHONE_HREF}
                data-cta="tel_y2_hero"
                className="block border-2 border-gray-300 hover:border-gray-900 text-gray-900 font-bold text-lg px-8 py-3.5 rounded-full text-center transition-colors"
              >
                📞 โทรเลย {PHONE_DISPLAY}
              </a>
            </div>
          </div>

          <div className="relative w-full h-72 sm:h-96 md:h-[28rem] bg-gray-50 rounded-3xl border border-gray-100">
            <Image
              src="/images/primedic-y2-open.jpg"
              alt="AED Yuwell Y2 เปิดฝาแสดงจอสี EKG พร้อมแผ่นอิเล็กโทรด"
              fill
              className="object-contain p-6"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </section>

      {/* Key features */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            ทำไมต้อง <span className="text-red-600">Yuwell Y2</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {keyFeatures.map((f) => (
              <div key={f.title} className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">รูปสินค้าจริง</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {gallery.map((img) => (
            <div
              key={img.src}
              className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-white"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Government procurement spec checklist */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="inline-block bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              🏛️ สำหรับหน่วยงานราชการ / อปท. / โรงพยาบาล
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">
              ตรงสเปกจัดซื้อภาครัฐ <span className="text-green-600">ครบทุกข้อ</span>
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              เทียบกับรายละเอียดคุณลักษณะทั่วไปในเอกสารจัดซื้ออุปกรณ์ช่วยชีวิตขั้นพื้นฐาน (AED)
              เครื่องฟื้นคืนคลื่นหัวใจด้วยไฟฟ้าชนิดอัตโนมัติ
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
            {govSpecChecklist.map((row) => (
              <div key={row.spec} className="flex items-start gap-4 p-4 md:p-5">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold">
                  ✓
                </span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm md:text-base">{row.spec}</p>
                  <p className="text-sm text-gray-500 mt-0.5">Yuwell Y2: {row.evidence}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <a
              href={LINE_Y2_GOV}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="y2_gov"
              data-product="primedic-y2"
              className="inline-block bg-[#06C755] text-white font-bold px-8 py-3.5 rounded-full hover:bg-[#05a847]"
            >
              📋 ขอชุดเอกสารจัดซื้อ (ใบเสนอราคา / สเปกชีต / อย.)
            </a>
          </div>
        </div>
      </section>

      {/* Detailed spec table */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">ข้อมูลจำเพาะ (Technical Data)</h2>
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {primedicSharedSpecs.map((s) => (
                <tr key={s.label}>
                  <td className="py-3 px-4 md:px-5 text-gray-500 w-1/2 align-top">{s.label}</td>
                  <td className="py-3 px-4 md:px-5 text-gray-900 font-medium">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Price & installment */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <PriceViewTracker targetId="y2-price" />
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">เลือกวิธีชำระที่สะดวก</h2>
          <p className="text-center text-gray-500 text-sm mb-8">
            ราคายังไม่รวม VAT · ออกใบกำกับภาษีได้ · รองรับจัดซื้อภาครัฐ
          </p>

          <div id="y2-price" className="grid md:grid-cols-2 gap-5">
            {/* Cash */}
            <div className="bg-white border-2 border-gray-900 rounded-2xl p-6 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-4 py-1 rounded-full">
                คุ้มที่สุด
              </div>
              <h3 className="font-bold text-lg mt-2 mb-1">ซื้อสด</h3>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-black text-gray-900">{Y2_PRICE}</span>
                <span className="text-sm text-gray-500 mb-1.5">ยังไม่รวม VAT</span>
              </div>
              <ul className="space-y-1.5 my-4 flex-1 text-sm text-gray-700">
                <li className="flex gap-2"><span className="text-green-600">✓</span> เป็นเจ้าของทันที จบในครั้งเดียว</li>
                <li className="flex gap-2"><span className="text-green-600">✓</span> ออกใบกำกับภาษี / ใบเสนอราคา</li>
                <li className="flex gap-2"><span className="text-green-600">✓</span> อบรม CPR &amp; AED สอนถึงที่</li>
                <li className="flex gap-2"><span className="text-green-600">✓</span> ราคาพิเศษสำหรับหน่วยงาน / ซื้อหลายเครื่อง</li>
              </ul>
              <a
                href={LINE_Y2}
                target="_blank"
                rel="noopener noreferrer"
                data-line-cta="y2_price_cash"
                data-product="primedic-y2"
                className="block bg-gray-900 text-white font-bold text-center py-3 rounded-full hover:bg-gray-700 transition-colors"
              >
                สอบถาม / ขอใบเสนอราคา
              </a>
            </div>

            {/* Installment (rent-to-own) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                {y2Installment.badge}
              </div>
              <h3 className="font-bold text-lg mt-2 mb-1">{y2Installment.nameTh}</h3>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-black text-red-600">{y2Installment.priceLabel}</span>
              </div>
              <p className="text-xs text-gray-500 mb-1">{y2Installment.priceNote}</p>
              <ul className="space-y-1.5 my-4 flex-1 text-sm text-gray-700">
                {y2Installment.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-green-600">✓</span> {f}
                  </li>
                ))}
              </ul>
              <a
                href={LINE_Y2_INSTALLMENT}
                target="_blank"
                rel="noopener noreferrer"
                data-line-cta="y2_price_installment"
                data-product="primedic-y2"
                className="block bg-red-600 text-white font-bold text-center py-3 rounded-full hover:bg-red-500 transition-colors"
              >
                สอบถามผ่อนชำระ
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">มาตรฐานและการรับรอง</h2>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {primedicCertifications.map((c) => (
            <div key={c.label} className="border border-gray-200 rounded-2xl px-3 py-5 text-center">
              <div className="text-xl md:text-2xl font-extrabold text-gray-900">{c.label}</div>
              <div className="text-[11px] md:text-xs text-gray-500 mt-1">{c.sub}</div>
            </div>
          ))}
        </div>
        {PRIMEDIC_REGULATORY.disclaimer && (
          <p className="text-xs text-gray-400 text-center mt-4">{PRIMEDIC_REGULATORY.disclaimer}</p>
        )}
        <div className="text-center mt-4">
          <a
            href="/documents/khop-2475-2569-y0-y2.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-red-600 hover:text-red-700 font-semibold underline"
          >
            📄 ดูใบอนุญาตโฆษณาเครื่องมือแพทย์ ฆพ.2475/2569 ฉบับเต็ม (สำหรับหน่วยงานจัดซื้อ)
          </a>
        </div>
      </section>

      {/* Lead form */}
      <section className="max-w-2xl mx-auto px-4 pb-12">
        <MiniLeadForm
          variant="y2_mini"
          theme="light"
          title="📞 ฝากเบอร์ไว้ รับใบเสนอราคา Yuwell Y2"
          subtitle="ทีมงานเจี่ยรักษาติดต่อกลับภายใน 24 ชม."
        />
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">คำถามที่พบบ่อย</h2>
        <div className="space-y-3">
          {faqs.slice(0, 7).map((f) => (
            <details key={f.question} className="border border-gray-200 rounded-xl p-4 group">
              <summary className="font-semibold text-sm text-gray-900 cursor-pointer list-none flex justify-between items-center gap-3">
                {f.question}
                <span className="text-red-600 group-open:rotate-45 transition-transform flex-shrink-0">+</span>
              </summary>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            พร้อมส่ง พร้อมเอกสารครบ — สอบถามได้เลย
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            ใบเสนอราคา / สเปกชีต / เอกสาร อย. สำหรับจัดซื้อหน่วยงาน · นัดดูเครื่องจริงได้
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={LINE_Y2}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="y2_footer"
              data-product="primedic-y2"
              className="inline-block bg-[#06C755] text-white font-bold text-lg px-10 py-4 rounded-full hover:bg-[#05a847] shadow-lg shadow-[#06C755]/30"
            >
              💬 ทัก LINE @jiacpr
            </a>
            <a
              href={PHONE_HREF}
              data-cta="tel_y2_footer"
              className="inline-block border-2 border-gray-300 hover:border-gray-900 text-gray-900 font-bold text-lg px-10 py-4 rounded-full transition-colors"
            >
              📞 {PHONE_DISPLAY}
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-6">
            {regLine(PRIMEDIC_REGULATORY)} · เจี่ยรักษา — นำเข้าเครื่องมือแพทย์โดยตรง
          </p>
        </div>
      </section>

      {/* Light-theme sitemap footer — SiteFooter is dark and this page is also
          iframe-embedded on jia1669.com, so it gets its own white variant. */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-10 text-sm text-gray-600">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-8 mb-8">
            {FOOTER_GROUPS.map((g) => (
              <div key={g.title}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  {g.title}
                </h3>
                <ul className="space-y-2">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="hover:text-red-600 transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} JiaAED · เจี่ยรักษา — นำเข้าและจัดจำหน่ายเครื่องมือแพทย์โดยตรง
          </p>
        </div>
      </footer>
    </div>
  );
}
