import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MiniLeadForm } from "@/app/components/MiniLeadForm";
import { PriceViewTracker } from "@/app/components/PriceViewTracker";
import { LatestNews } from "@/app/components/LatestNews";
import { rentalPlans, rentalFaqs } from "@/lib/aed/rental";

export const revalidate = 3600;

const LINE_OA = "https://line.me/R/oaMessage/@jiacpr/?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%88+AED+%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A";

export const metadata: Metadata = {
  title: "เช่า AED เริ่ม ฿1,990/เดือน — ไม่ต้องลงทุนก้อนใหญ่ | JiaAED",
  description:
    "เช่า / เช่ายืม AED Amoul i7 รายวัน รายเดือน รายปี เริ่ม 1,990 บาท/เดือน — รวมส่ง+ติดตั้ง อบรมใช้งาน ดูแลแบต/แผ่น เปลี่ยนเครื่องสำรองถ้าเสีย · อย. รับรอง เหมาะกับออฟฟิศ โรงงาน ฟิตเนส และงานอีเวนต์",
  alternates: { canonical: "/aed/rental" },
  openGraph: {
    title: "เช่า AED เริ่ม ฿1,990/เดือน | JiaAED",
    description:
      "เช่า AED Amoul i7 รายวัน/เดือน/ปี พร้อมทีมดูแลครบวงจร อย. รับรอง — ไม่ต้องลงทุนก้อนใหญ่",
    url: "/aed/rental",
    images: ["/images/product-main.png"],
    type: "website",
  },
};

const painPoints = [
  { icon: "🔋", text: "แบตเตอรี่หมดโดยไม่รู้ตัว" },
  { icon: "🩹", text: "แผ่นแปะหมดอายุ ไม่มีใครเช็ก" },
  { icon: "📋", text: "ไม่มีรายงานตรวจสอบความพร้อม" },
];

const includedSteps = [
  { icon: "🚚", title: "ส่ง + ติดตั้งถึงที่", desc: "จัดส่งและติดตั้งให้พร้อมใช้ทั่วประเทศ" },
  { icon: "🎓", title: "อบรมใช้งาน", desc: "สอนทีมงานให้ใช้เป็นทุกคน ฟรี" },
  { icon: "🔧", title: "ดูแล + เช็กสภาพ", desc: "ตรวจแบต/แผ่น แจ้งเตือนก่อนหมดอายุ" },
  { icon: "♻️", title: "เครื่องสำรองถ้าเสีย", desc: "เปลี่ยนเครื่องให้ภายใน 24–48 ชม." },
];

export default function AedRentalLanding() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Minimal top bar */}
      <header className="bg-gray-950 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">❤️</span>
            <span className="font-bold text-xl text-yellow-400">JiaAED</span>
          </Link>
          <a
            href={LINE_OA}
            target="_blank"
            rel="noopener noreferrer"
            data-line-cta="rental_navbar"
            data-product="rent-monthly"
            className="bg-[#06C755] text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-[#05a847]"
          >
            💬 LINE
          </a>
        </div>
      </header>

      {/* Promo banner */}
      <div className="bg-yellow-400 text-yellow-900 text-center py-2 font-bold text-sm">
        💼 เช่า AED พร้อมใช้ — ไม่ต้องลงทุนซื้อขาด เริ่ม ฿1,990/เดือน
      </div>

      <section className="px-4 py-8 max-w-4xl mx-auto">
        <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">
          🏅 ทะเบียน อย. 68-2-2-2-0005243 · ฆพ.743/2569
        </div>

        <h1 className="text-3xl md:text-4xl font-black leading-tight mb-3">
          เช่า AED พร้อมใช้
          <br />
          <span className="text-yellow-400">เริ่ม ฿1,990/เดือน</span>
        </h1>

        <p className="text-gray-400 mb-5">
          เช่ารายวัน · รายเดือน · รายปี — รวมส่ง ติดตั้ง อบรม และทีมดูแลครบวงจร
          ไม่ต้องลงทุนก้อนใหญ่
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3 mb-8">
          <a
            href={LINE_OA}
            target="_blank"
            rel="noopener noreferrer"
            data-line-cta="rental_hero"
            data-product="rent-monthly"
            className="block bg-[#06C755] text-white font-bold text-xl px-8 py-5 rounded-full hover:bg-[#05a847] text-center shadow-2xl shadow-[#06C755]/40 ring-4 ring-[#06C755]/20"
          >
            💬 สอบถาม / จองเช่าทาง LINE
          </a>
          <a
            href="#rental-quote"
            className="block bg-yellow-400/10 text-yellow-400 font-bold text-lg px-8 py-4 rounded-full border border-yellow-400/30 hover:bg-yellow-400/20 text-center transition-colors"
          >
            📋 ให้เจ้าหน้าที่ติดต่อกลับ (ไม่ต้องแชต)
          </a>
        </div>

        {/* Pain points */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-8">
          <h2 className="font-bold text-lg text-white mb-1">
            มีเครื่อง <span className="text-red-400">≠</span> เครื่องพร้อมใช้
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            ปัญหาที่เจอบ่อยเมื่อซื้อ AED มาเก็บไว้เอง
          </p>
          <ul className="space-y-2">
            {painPoints.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-sm text-gray-300">
                <span className="text-xl">{p.icon}</span>
                <span>
                  <span className="text-red-400 font-bold mr-1">✗</span>
                  {p.text}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-yellow-400 font-semibold mt-4 pt-3 border-t border-gray-800">
            เช่ากับเรา = มีทีมดูแลความพร้อมให้ตลอดสัญญา
          </p>
        </div>

        {/* Product image */}
        <a
          href={LINE_OA}
          target="_blank"
          rel="noopener noreferrer"
          data-line-cta="rental_product"
          data-product="rent-monthly"
          className="block relative w-full h-56 sm:h-72 mb-8"
        >
          <Image
            src="/images/product-main.png"
            alt="เช่า AED Amoul i7"
            fill
            className="object-contain drop-shadow-2xl"
            priority
          />
        </a>

        {/* Rental plans */}
        <PriceViewTracker targetId="rental-price" />
        <h2 className="text-2xl font-bold text-center mb-2 text-white">เลือกแพ็กเช่าที่ใช่</h2>
        <p className="text-center text-gray-500 text-sm mb-6">ราคายังไม่รวม VAT · ออกใบกำกับภาษีได้</p>
        <div id="rental-price" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {rentalPlans.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-2xl border p-6 flex flex-col bg-gray-900 ${
                p.badge ? "border-yellow-400/60 shadow-lg shadow-yellow-400/10" : "border-gray-700"
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full">
                  {p.badge}
                </div>
              )}
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{p.subtitle}</div>
              <h3 className="font-bold text-lg text-white mt-1 mb-3">{p.name}</h3>
              <div className="mb-3">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-yellow-400">฿{p.price.toLocaleString()}</span>
                  <span className="text-gray-500 text-sm mb-1">{p.unit}</span>
                </div>
              </div>
              <div className="text-gray-400 text-xs mb-4">มัดจำ {p.deposit}</div>
              <ul className="space-y-1 mb-6 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-yellow-400 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={LINE_OA}
                target="_blank"
                rel="noopener noreferrer"
                data-line-cta="rental_card"
                data-product={p.id}
                className={`text-center font-semibold py-3 rounded-full transition-colors ${
                  p.badge
                    ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-300"
                    : "bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700"
                }`}
              >
                สอบถาม / จองเช่า
              </a>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-600 text-sm mb-4">
          * มัดจำคืนเต็มเมื่อคืนเครื่องครบสภาพ · ราคาพิเศษสำหรับสัญญาระยะยาว/หลายเครื่อง
        </p>
        <div className="text-center mb-10 rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-sm text-gray-300 mb-3">
            ต้องการใช้ระยะยาวพร้อมทีมดูแลครบวงจร (GPS · Dashboard · เปลี่ยนเครื่องสำรอง)?
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/aed/subscription"
              className="inline-block bg-yellow-400/10 text-yellow-400 font-bold px-5 py-2.5 rounded-full border border-yellow-400/30 hover:bg-yellow-400/20 text-sm"
            >
              ดูแพ็กเกจเช่ารายเดือน (BASIC/PREMIUM/ULTIMATE) →
            </Link>
            <Link
              href="/aed/packages"
              className="inline-block bg-gray-800 text-gray-200 font-bold px-5 py-2.5 rounded-full border border-gray-700 hover:bg-gray-700 text-sm"
            >
              เปรียบเทียบ ซื้อขาด / เช่าได้ซื้อ →
            </Link>
          </div>
        </div>

        {/* What's included */}
        <h2 className="text-xl font-bold text-white mb-4">เช่ากับเราได้อะไรบ้าง</h2>
        <div className="grid grid-cols-2 gap-3 mb-10">
          {includedSteps.map((s) => (
            <div key={s.title} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-sm text-white font-semibold">{s.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Quick form */}
        <div id="rental-quote" className="mb-10 scroll-mt-20">
          <h2 className="text-xl font-bold text-white mb-1">ทิ้งเบอร์ไว้ เดี๋ยวติดต่อกลับ</h2>
          <p className="text-xs text-gray-500 mb-4">ทีมงานเจี่ยรักษาติดต่อกลับภายใน 24 ชม.</p>
          <MiniLeadForm variant="rental_mini" />
        </div>

        {/* Trust strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { icon: "🏅", title: "อย. รับรอง" },
            { icon: "🔋", title: "แบต ≥ 7 ปี · แผ่น 5 ปี" },
            { icon: "💧", title: "IP65 กันน้ำกันฝุ่น" },
            { icon: "🧾", title: "ออกใบกำกับภาษี" },
          ].map((t) => (
            <div key={t.title} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="text-xs text-gray-300 font-semibold">{t.title}</div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="text-xl font-bold text-white mb-4">คำถามที่พบบ่อย — เช่า AED</h2>
        <div className="space-y-3 mb-10">
          {rentalFaqs.map((f) => (
            <details key={f.question} className="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
              <summary className="font-semibold text-sm text-white cursor-pointer list-none flex justify-between items-center">
                {f.question}
                <span className="text-yellow-400 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-sm text-gray-400 mt-3 leading-relaxed">{f.answer}</p>
            </details>
          ))}
        </div>

        {/* Latest curated news */}
        <LatestNews limit={3} compact />

        {/* Final CTA */}
        <div className="text-center py-6">
          <p className="text-gray-400 text-sm mb-4">สอบถามเงื่อนไขเช่า / ขอใบเสนอราคา / นัดดูเครื่อง</p>
          <a
            href={LINE_OA}
            target="_blank"
            rel="noopener noreferrer"
            data-line-cta="rental_footer"
            data-product="rent-monthly"
            className="inline-block bg-[#06C755] text-white font-bold text-lg px-10 py-4 rounded-full hover:bg-[#05a847] shadow-2xl shadow-[#06C755]/40"
          >
            💬 ติดต่อทาง LINE ทันที
          </a>
          <p className="text-xs text-gray-500 mt-3">เจี่ยรักษา — นำเข้าเครื่องมือแพทย์โดยตรง</p>
        </div>
      </section>
    </div>
  );
}
