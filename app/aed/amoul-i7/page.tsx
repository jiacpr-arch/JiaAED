import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MiniLeadForm } from "@/app/components/MiniLeadForm";
import { PriceViewTracker } from "@/app/components/PriceViewTracker";
import { YouTubeLite } from "@/app/components/YouTubeLite";
import { LatestNews } from "@/app/components/LatestNews";

export const revalidate = 3600;

const LINE_OA = "https://line.me/R/ti/p/@273fzpzs";

export const metadata: Metadata = {
  title: "AED Amoul i7 — รับส่วนลด + ใบเสนอราคาฟรี | JiaAED",
  description:
    "เครื่องกระตุกหัวใจไฟฟ้า AED Amoul i7 — Shock 7 วินาที · เสียงไทย · IP65 · อย. รับรอง · รับประกัน 1 ปี · ฟรีค่าจัดส่ง",
  robots: { index: false, follow: false },
  alternates: { canonical: "/ads/aed-i7" },
};

export default function AdsLandingI7() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Minimal top bar — only logo and LINE CTA */}
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
            data-line-cta="ads_navbar"
            data-product="i7-standard"
            className="bg-[#06C755] text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-[#05a847]"
          >
            💬 LINE
          </a>
        </div>
      </header>

      {/* Promo banner */}
      <div className="bg-yellow-400 text-yellow-900 text-center py-2 font-bold text-sm">
        🎁 ลด 2,000 บาท + ส่งฟรีทั่วประเทศ — เฉพาะลูกค้าจาก Google
      </div>

      {/* Hero — single column, mobile first */}
      <section className="px-4 py-8 max-w-4xl mx-auto">
        <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">
          🏅 ทะเบียน อย. 68-2-2-2-0005243 · ฆพ.743/2569
        </div>

        <h1 className="text-3xl md:text-4xl font-black leading-tight mb-3">
          AED Amoul i7
          <br />
          <span className="text-yellow-400">เครื่องกระตุกหัวใจไฟฟ้า</span>
        </h1>

        <p className="text-gray-400 mb-5">
          Shock พร้อมใน <strong className="text-white">7 วินาที</strong> · เสียงแนะนำภาษาไทย · IP65 กันน้ำ
        </p>

        {/* Price */}
        <PriceViewTracker targetId="ads-price" />
        <div id="ads-price" className="bg-gradient-to-r from-yellow-400/10 to-transparent border border-yellow-400/40 rounded-2xl p-5 mb-5">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-xs text-gray-400">ราคาพิเศษวันนี้</span>
            <span className="text-gray-500 line-through text-base">฿41,900</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-yellow-400">฿39,999</span>
            <span className="text-sm text-gray-500">+ ส่งฟรี</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">ก่อน VAT · ออกใบกำกับภาษีได้</p>
          {/* Trust signals directly under the price — reassurance right where the price anxiety is */}
          <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-yellow-400/20 text-xs text-gray-300">
            <li className="flex items-center gap-1.5"><span className="text-green-400">✓</span> ส่งฟรีทั่วประเทศ</li>
            <li className="flex items-center gap-1.5"><span className="text-green-400">✓</span> ออกใบเสนอราคา / ใบกำกับภาษีได้</li>
            <li className="flex items-center gap-1.5"><span className="text-green-400">✓</span> อบรม / สาธิตการใช้งานฟรีถึงที่</li>
          </ul>
        </div>

        {/* Product image */}
        <a
          href={LINE_OA}
          target="_blank"
          rel="noopener noreferrer"
          data-line-cta="ads_product"
          data-product="i7-standard"
          className="block relative w-full h-64 sm:h-80 mb-5"
        >
          <Image
            src="/images/product-main.png"
            alt="AED Amoul i7"
            fill
            className="object-contain drop-shadow-2xl"
            priority
          />
        </a>

        {/* CTAs */}
        <div className="flex flex-col gap-3 mb-6">
          <a
            href={LINE_OA}
            target="_blank"
            rel="noopener noreferrer"
            data-line-cta="ads_hero"
            data-product="i7-standard"
            className="block bg-[#06C755] text-white font-bold text-xl px-8 py-5 rounded-full hover:bg-[#05a847] text-center shadow-2xl shadow-[#06C755]/40 ring-4 ring-[#06C755]/20"
          >
            💬 แชท LINE รับส่วนลดเลย!
          </a>
          {/* Low-friction alternative — request a quote without having to chat first */}
          <a
            href="#ads-quote"
            className="block bg-yellow-400/10 text-yellow-400 font-bold text-lg px-8 py-4 rounded-full border border-yellow-400/30 hover:bg-yellow-400/20 text-center transition-colors"
          >
            📋 ขอใบเสนอราคา (ไม่ต้องแชต)
          </a>
        </div>

        {/* Quick form */}
        <div id="ads-quote" className="mb-8 scroll-mt-20">
          <MiniLeadForm variant="ads_mini" />
        </div>

        {/* Trust strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: "🏅", title: "อย. รับรอง" },
            { icon: "🛡️", title: "รับประกัน 1 ปี" },
            { icon: "🚚", title: "ส่งฟรีทั่วประเทศ" },
            { icon: "🧾", title: "ออกใบกำกับภาษี" },
          ].map((t) => (
            <div key={t.title} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="text-xs text-gray-300 font-semibold">{t.title}</div>
            </div>
          ))}
        </div>

        {/* Demo video */}
        <div className="mb-8">
          <div className="mb-3">
            <h2 className="font-bold text-lg text-white">🎬 ดูวิธีการใช้งาน</h2>
            <p className="text-xs text-gray-500">วิดีโอสาธิตทีละขั้นตอน</p>
          </div>
          <YouTubeLite videoId="ayov6IVgW7w" title="วิธีการใช้งาน AED Amoul i7" />
        </div>

        {/* Key specs */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <h2 className="font-bold text-lg text-white mb-3">⚡ จุดเด่น</h2>
          <ul className="space-y-2 text-sm">
            {[
              "Shock พร้อมใน 7 วินาที (เร็วที่สุดในตลาด)",
              "เสียงแนะนำภาษาไทย ใช้ได้ทันที ไม่ต้องอบรม",
              "ใช้ได้ทั้งผู้ใหญ่และเด็ก (ปรับพลังงานได้)",
              "IP65 กันน้ำ กันฝุ่น ใช้กลางแจ้งได้",
              "Self-test อัตโนมัติทุกวัน รู้ทันทีถ้ามีปัญหา",
              "แบตเตอรี่อายุ ≥ 7 ปี · electrode 5 ปี",
              "มีบริการสาธิตการใช้งานฟรีถึงที่",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-gray-300">
                <span className="text-yellow-400 font-bold mt-0.5">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Latest curated news — renders nothing until items exist */}
        <LatestNews limit={3} compact />

        {/* Final CTA */}
        <div className="text-center py-6">
          <p className="text-gray-400 text-sm mb-4">สอบถามเพิ่มเติม / ขอใบเสนอราคา / นัดสาธิต</p>
          <a
            href={LINE_OA}
            target="_blank"
            rel="noopener noreferrer"
            data-line-cta="ads_footer"
            data-product="i7-standard"
            className="inline-block bg-[#06C755] text-white font-bold text-lg px-10 py-4 rounded-full hover:bg-[#05a847] shadow-2xl shadow-[#06C755]/40"
          >
            💬 ติดต่อทาง LINE ทันที
          </a>
          <p className="text-xs text-gray-500 mt-3">เจี่ยรักษา — นำเข้าโดยตรง ราคาตรงจากผู้นำเข้า</p>
        </div>
      </section>
    </div>
  );
}
