import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MiniLeadForm } from "@/app/components/MiniLeadForm";
import { PhotoStrip } from "@/app/components/PhotoStrip";
import { SiteFooter } from "@/app/components/SiteFooter";
import { PriceViewTracker } from "@/app/components/PriceViewTracker";
import { JiaAedLogo } from "@/app/components/JiaAedLogo";
import { LatestNews } from "@/app/components/LatestNews";
import { SectionHeading } from "@/app/components/SectionHeading";
import { PackageCard } from "@/app/components/PackageCard";
import { FaqAccordion } from "@/app/components/FaqAccordion";
import { AcquisitionCompareTable } from "@/app/components/AcquisitionCompareTable";
import { FaqStructuredData } from "@/app/components/StructuredData";
import {
  rentalPlans,
  eventPackages,
  multiUnitPricing,
  rentToOwnBreakdowns,
  rentToOwnTotal,
  rentalFaqCategories,
} from "@/lib/aed/rental";
import { acquisitionPackages } from "@/lib/aed/packages";
import { PRIMEDIC_REGULATORY, regLine } from "@/lib/aed/regulatory";

export const revalidate = 3600;

import { LINE_OA } from "@/lib/aed/line";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/aed/contact";

export const metadata: Metadata = {
  title: "เช่า & เช่าซื้อ AED — เริ่ม ฿1,990/เดือน · ผ่อน 18 เดือนเป็นเจ้าของ | JiaAED",
  description:
    "เช่า / เช่ายืม AED Yuwell/PRIMEDIC HeartSave แผนอีเวนต์ แผนยืดหยุ่น แผนรายปี เริ่ม 1,990 บาท/เดือน หรือเช่าซื้อ (Rent-to-Own) ผ่อนเริ่ม ฿2,600/เดือน × 18 เดือน ครบสัญญาเครื่องเป็นของคุณ — รวมส่ง+ติดตั้ง อบรมใช้งาน ดูแลแบต/แผ่น · อย. รับรอง",
  alternates: { canonical: "/aed/rental" },
  openGraph: {
    title: "เช่า & เช่าซื้อ AED — เริ่ม ฿1,990/เดือน | JiaAED",
    description:
      "เช่า AED แผนอีเวนต์/แผนยืดหยุ่น/แผนรายปี พร้อมทีมดูแลครบวงจร หรือเช่าซื้อผ่อน 18 เดือนเป็นเจ้าของ อย. รับรอง — ไม่ต้องลงทุนก้อนใหญ่",
    url: "/aed/rental",
    images: ["/images/primedic-y2-open.jpg"],
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
            <JiaAedLogo className="h-8 w-auto" />
          </Link>
          <a
            href={LINE_OA}
            target="_blank"
            rel="noopener noreferrer"
            data-line-cta="rental_navbar"
            data-product="rent-flex"
            className="bg-[#06C755] text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-[#05a847]"
          >
            💬 LINE
          </a>
        </div>
      </header>

      {/* Promo banner */}
      <div className="bg-yellow-400 text-yellow-900 text-center py-2 font-bold text-sm">
        💼 เช่า AED เริ่ม ฿1,990/เดือน · เช่าซื้อผ่อน 18 เดือนเป็นเจ้าของ
      </div>

      <section className="px-4 py-8 max-w-4xl mx-auto">
        {/* Hero — copy + CTAs left, product photo right on desktop */}
        <div className="grid md:grid-cols-[1fr_300px] gap-8 items-center mb-8">
          <div>
            <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">
              🏅 ทะเบียน อย. 65-2-2-2-0013415
            </div>

            <h1 className="text-3xl md:text-4xl font-black leading-tight mb-3">
              เช่า AED พร้อมใช้
              <br />
              <span className="text-yellow-400">เริ่ม ฿1,990/เดือน</span>
            </h1>

            <p className="text-gray-400 mb-4">
              แผนอีเวนต์ · แผนยืดหยุ่น · แผนรายปี — รวมส่ง ติดตั้ง อบรม และทีมดูแลครบวงจร
              ไม่ต้องลงทุนก้อนใหญ่ หรือ<span className="text-yellow-400 font-semibold">เช่าซื้อ
              (Rent-to-Own)</span> ผ่อนครบ 18 เดือน เครื่องเป็นของคุณ
            </p>

            {/* In-page nav — the page now covers both models */}
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { href: "#rental-price", label: "แผนเช่า" },
                { href: "#rent-to-own", label: "เช่าซื้อ ผ่อนเป็นเจ้าของ" },
                { href: "#compare", label: "เปรียบเทียบ" },
              ].map((a) => (
                <a
                  key={a.href}
                  href={a.href}
                  className="text-xs font-semibold text-gray-300 bg-gray-900 border border-gray-700 px-3 py-1.5 rounded-full hover:border-yellow-400/40 hover:text-yellow-400 transition-colors"
                >
                  {a.label} ↓
                </a>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3">
              <a
                href={LINE_OA}
                target="_blank"
                rel="noopener noreferrer"
                data-line-cta="rental_hero"
                data-product="rent-flex"
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
              <a
                href={PHONE_HREF}
                data-cta="tel_rental_hero"
                className="block border border-gray-600 hover:border-yellow-400 text-white font-bold text-lg px-8 py-4 rounded-full text-center transition-colors"
              >
                📞 โทรเลย {PHONE_DISPLAY}
              </a>
            </div>
          </div>

          {/* Product photo — inline on mobile (below CTAs), side column on md+ */}
          <a
            href={LINE_OA}
            target="_blank"
            rel="noopener noreferrer"
            data-line-cta="rental_product"
            data-product="rent-flex"
            className="block relative w-full h-56 sm:h-72 md:h-96"
          >
            <Image
              src="/images/primedic-y2-open.jpg"
              alt="เช่า AED Yuwell/PRIMEDIC HeartSave Y2"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </a>
        </div>

        {/* Pain points — real photo beside the problem list */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-8">
          <div className="grid md:grid-cols-[240px_1fr] gap-5 items-center">
            <div className="relative w-full h-40 md:h-full min-h-32 rounded-xl overflow-hidden">
              <Image
                src="/images/lifestyle-cpr.png"
                alt="สถานการณ์ฉุกเฉินที่ AED ต้องพร้อมใช้"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 240px"
              />
            </div>
            <div>
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
          </div>
        </div>

        {/* Rental plans */}
        <PriceViewTracker targetId="rental-price" />
        <h2 className="text-2xl font-bold text-center mb-2 text-white">เลือกแพลนเช่าที่ใช่</h2>
        <p className="text-center text-gray-500 text-sm mb-6">ราคายังไม่รวม VAT · ออกใบกำกับภาษีได้</p>
        <div id="rental-price" className="scroll-mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {rentalPlans.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-2xl border p-6 flex flex-col bg-gray-900 ${
                p.badge ? "border-yellow-400/60 shadow-lg shadow-yellow-400/10" : "border-gray-700"
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full">
                  {p.badge}
                </div>
              )}
              <div className="relative h-36 -mx-6 -mt-6 mb-4 rounded-t-2xl overflow-hidden">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
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
          * มัดจำคืนเต็มเมื่อคืนเครื่องครบสภาพ
        </p>

        {/* Event packages */}
        <div className="mb-8 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-1">แผนอีเวนต์ — เลือกระยะเวลา</h2>
          <p className="text-xs text-gray-500 mb-4">เหมาะกับงานวิ่ง คอนเสิร์ต แข่งกีฬา กองถ่าย · มัดจำบัตรเครดิต hold ฿30,000</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {eventPackages.map((pkg) => (
              <a
                key={pkg.id}
                href={LINE_OA}
                target="_blank"
                rel="noopener noreferrer"
                data-line-cta="rental_event_pkg"
                data-product={pkg.id}
                className="flex flex-col items-center bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-yellow-400/40 hover:bg-gray-750 transition-colors text-center"
              >
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">{pkg.name}</div>
                <div className="text-sm font-bold text-white mb-1">{pkg.nameTh}</div>
                <div className="text-xs text-gray-400 mb-2">{pkg.duration}</div>
                <div className="text-yellow-400 font-bold text-base">฿{pkg.price.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-0.5">{pkg.priceNote}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Multi-unit pricing */}
        <div className="mb-8 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-1">แผนรายปี (ANNUAL) — ราคาหลายเครื่อง</h2>
          <p className="text-xs text-gray-500 mb-4">สำหรับองค์กรที่ต้องการ AED มากกว่า 1 เครื่อง</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 font-semibold pb-2">จำนวน</th>
                  <th className="text-right text-gray-400 font-semibold pb-2">ราคา/เครื่อง/ปี</th>
                  <th className="text-right text-gray-400 font-semibold pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {multiUnitPricing.map((tier) => (
                  <tr key={tier.units} className="border-b border-gray-800 last:border-0">
                    <td className="py-3 text-gray-200">{tier.units}</td>
                    <td className="py-3 text-right text-yellow-400 font-bold">฿{tier.pricePerUnit.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      {tier.badge && (
                        <span className="bg-yellow-400/10 text-yellow-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-yellow-400/20">
                          {tier.badge}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── เช่าซื้อ (Rent-to-Own) ─────────────────────────────────────────── */}
        <div id="rent-to-own" className="scroll-mt-20 mb-10">
          <div className="mb-6">
            <SectionHeading
              badge="เช่าซื้อ · Rent-to-Own"
              title="เช่าแล้วได้ซื้อ — ผ่อนเบา ๆ ครบ 18 เดือน เครื่องเป็นของคุณ"
              subtitle="ไม่ต้องจ่ายก้อนใหญ่วันแรก มัดจำนับเป็นส่วนหนึ่งของค่าเครื่อง ครบสัญญาอุปกรณ์เป็นสินทรัพย์ขององค์กรทันที"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {acquisitionPackages
              .filter((p) => p.kind === "rent-to-own")
              .map((p) => (
                <PackageCard key={p.id} pkg={p} lineCta="rental_rto_card" />
              ))}
          </div>

          {/* Cost breakdown — totals derived from rentToOwnTotal, never re-typed */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-1">สรุปยอดผ่อนตลอดสัญญา</h3>
            <p className="text-xs text-gray-500 mb-4">
              มัดจำนับเป็นส่วนหนึ่งของค่าเครื่อง · ราคายังไม่รวม VAT · ออกใบกำกับภาษีได้
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 font-semibold pb-2">รุ่น</th>
                    <th className="text-right text-gray-400 font-semibold pb-2">มัดจำ</th>
                    <th className="text-right text-gray-400 font-semibold pb-2">ผ่อน/เดือน</th>
                    <th className="text-right text-gray-400 font-semibold pb-2">ระยะ</th>
                    <th className="text-right text-gray-400 font-semibold pb-2">รวมทั้งสัญญา</th>
                    <th className="text-right text-gray-400 font-semibold pb-2">เทียบซื้อสด</th>
                  </tr>
                </thead>
                <tbody>
                  {rentToOwnBreakdowns.map((b) => (
                    <tr key={b.packageId} className="border-b border-gray-800 last:border-0">
                      <td className="py-3 text-gray-200 font-semibold">{b.model}</td>
                      <td className="py-3 text-right text-gray-300">฿{b.deposit.toLocaleString()}</td>
                      <td className="py-3 text-right text-yellow-400 font-bold">
                        ฿{b.monthly.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-gray-300">{b.months} เดือน</td>
                      <td className="py-3 text-right text-white font-bold">
                        ฿{rentToOwnTotal(b).toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-gray-500">{b.cashPriceLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ownership + cancellation terms — full copy lives in the FAQ below */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-sm text-white font-semibold">กรรมสิทธิ์เมื่อครบสัญญา</div>
              <div className="text-xs text-gray-500 mt-0.5">
                ครบ 18 เดือน เครื่องเป็นของท่านโดยไม่มีค่าใช้จ่ายเพิ่ม
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-2xl mb-1">📄</div>
              <div className="text-sm text-white font-semibold">ยกเลิกกลางคัน</div>
              <div className="text-xs text-gray-500 mt-0.5">
                ค่ามัดจำถือเป็นค่าเสียหายและไม่คืน ส่วนอุปกรณ์ส่งคืนในสภาพดี — ดูรายละเอียดใน FAQ ด้านล่าง
              </div>
            </div>
          </div>
        </div>

        {/* ─── เปรียบเทียบ เช่า / เช่าซื้อ / ซื้อขาด ─────────────────────────── */}
        <div id="compare" className="scroll-mt-20 mb-10">
          <div className="mb-6">
            <SectionHeading title="เช่า vs เช่าซื้อ vs ซื้อขาด — แบบไหนเหมาะกับคุณ" />
          </div>
          <AcquisitionCompareTable />
          <div className="text-center mt-5">
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="rental_compare"
              data-product="rent-flex"
              className="inline-block bg-[#06C755] text-white font-bold px-8 py-3 rounded-full hover:bg-[#05a847]"
            >
              💬 ยังไม่แน่ใจ? ทัก LINE ให้ช่วยเลือก
            </a>
          </div>
        </div>

        <div className="text-center mb-10 rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-sm text-gray-300 mb-3">
            ต้องการใช้ระยะยาวพร้อมทีมดูแลครบวงจร (GPS · Dashboard · เปลี่ยนเครื่องสำรอง)?
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/aed/subscription"
              className="inline-block bg-yellow-400/10 text-yellow-400 font-bold px-5 py-2.5 rounded-full border border-yellow-400/30 hover:bg-yellow-400/20 text-sm"
            >
              ดูแพ็กเกจ ดูแลครบ (BASIC/PRO/ELITE) →
            </Link>
            <Link
              href="/aed/packages"
              className="inline-block bg-gray-800 text-gray-200 font-bold px-5 py-2.5 rounded-full border border-gray-700 hover:bg-gray-700 text-sm"
            >
              ดูแพ็กเกจทั้งหมด รวมซื้อขาด →
            </Link>
          </div>
        </div>

        {/* Real training photos — the service story shown, not just told */}
        <div className="mb-8">
          <PhotoStrip
            cols={3}
            heightClass="h-40 md:h-48"
            photos={[
              { src: "/images/training-bls-3.jpg", alt: "อบรมการใช้ AED ให้ทีมงาน", caption: "อบรมถึงที่ รวมในทุกแผนเช่า" },
              { src: "/images/training-bls-1.jpg", alt: "สาธิต CPR พร้อมเครื่อง AED", caption: "สาธิตการใช้งานจริง" },
              { src: "/images/training-bls-2.jpg", alt: "ทีมงานผ่านการอบรม CPR", caption: "ทีมงานใช้เป็นทุกคน" },
            ]}
          />
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
            { icon: "📜", title: "ISO 13485 · CE" },
            { icon: "🩹", title: "แผ่นอิเล็กโทรด 3 ปี" },
            { icon: "🧾", title: "ออกใบกำกับภาษี" },
          ].map((t) => (
            <div key={t.title} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="text-xs text-gray-300 font-semibold">{t.title}</div>
            </div>
          ))}
        </div>

        {/* ใบ อย. ตัวจริง — scanned certificate, click-through to the full PDF */}
        <div className="mb-10 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="grid md:grid-cols-[220px_1fr] gap-5 items-center">
            <a
              href="/documents/fda-yuwell-aed-65-2-2-2-0013415.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="block relative w-full h-64 md:h-72 rounded-xl overflow-hidden bg-white"
            >
              <Image
                src="/images/fda-cert-yuwell-aed.webp"
                alt="ใบรับแจ้งรายการละเอียดนำเข้าเครื่องมือแพทย์ อย. เลขที่ 65-2-2-2-0013415 — Yuwell AED"
                fill
                className="object-contain p-1"
                sizes="(max-width: 768px) 100vw, 220px"
              />
            </a>
            <div>
              <h2 className="font-bold text-lg text-white mb-1">
                🏅 ใบทะเบียน อย. ของจริง — ตรวจสอบได้
              </h2>
              <p className="text-sm text-yellow-400 font-semibold mb-2">
                {regLine(PRIMEDIC_REGULATORY)}
                {PRIMEDIC_REGULATORY.validUntil && ` · ใช้ได้ถึง ${PRIMEDIC_REGULATORY.validUntil}`}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                {PRIMEDIC_REGULATORY.disclaimer}
              </p>
              <a
                href="/documents/fda-yuwell-aed-65-2-2-2-0013415.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-yellow-400/10 text-yellow-400 text-sm font-bold px-5 py-2.5 rounded-full border border-yellow-400/30 hover:bg-yellow-400/20 transition-colors"
              >
                📄 เปิดดูใบ อย. ฉบับเต็ม (PDF)
              </a>
            </div>
          </div>
        </div>

        {/* FAQ — both models, schema markup mirrors exactly these items */}
        <h2 className="text-xl font-bold text-white mb-4">คำถามที่พบบ่อย — เช่า & เช่าซื้อ AED</h2>
        <div className="mb-10">
          <FaqAccordion categories={rentalFaqCategories} />
        </div>
        <FaqStructuredData items={rentalFaqCategories.flatMap((c) => c.items)} />

        {/* Latest curated news */}
        <LatestNews limit={3} compact />

        {/* Final CTA */}
        <div className="text-center py-6">
          <p className="text-gray-400 text-sm mb-4">สอบถามเงื่อนไขเช่า / เช่าซื้อ / ขอใบเสนอราคา / นัดดูเครื่อง</p>
          <a
            href={LINE_OA}
            target="_blank"
            rel="noopener noreferrer"
            data-line-cta="rental_footer"
            data-product="rent-flex"
            className="inline-block bg-[#06C755] text-white font-bold text-lg px-10 py-4 rounded-full hover:bg-[#05a847] shadow-2xl shadow-[#06C755]/40"
          >
            💬 ติดต่อทาง LINE ทันที
          </a>
          <p className="text-xs text-gray-500 mt-3">เจี่ยรักษา — นำเข้าเครื่องมือแพทย์โดยตรง</p>
        </div>
      </section>

      {/* Full sitemap footer — the landing page used to dead-end here */}
      <SiteFooter regNote={`Yuwell/PRIMEDIC HeartSave — ${regLine(PRIMEDIC_REGULATORY)}`} />
    </div>
  );
}
