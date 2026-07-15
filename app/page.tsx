import Image from "next/image";
import Link from "next/link";
import { accessories } from "@/lib/aed/products";
import { homepageTiers } from "@/lib/aed/lineup";
import { faqs } from "@/lib/aed/faqs";
import { PRIMEDIC_REGULATORY, regLine } from "@/lib/aed/regulatory";
import { LeadForm } from "./components/LeadForm";
import { QuickContact } from "./components/QuickContact";
import { HeroCta } from "./components/HeroCta";
import { HeroHeadline } from "./components/HeroHeadline";
import { LineupProductCard } from "./components/LineupProductCard";
import { SpecComparisonTable } from "./components/SpecComparisonTable";
import { RentVsBuyTable } from "./components/RentVsBuyTable";
import { YouTubeLite } from "./components/YouTubeLite";
import { PriceViewTracker } from "./components/PriceViewTracker";
import { LatestNews } from "./components/LatestNews";
import { PackageCard } from "./components/PackageCard";
import { TrustStats } from "./components/TrustStats";
import { PromoBanner } from "./components/PromoBanner";
import { RentalSpotlight } from "./components/RentalSpotlight";
import { JiaAedLogo } from "./components/JiaAedLogo";
import { PhotoStrip } from "./components/PhotoStrip";
import { SplitFeature } from "./components/SplitFeature";
import { acquisitionPackages } from "@/lib/aed/packages";
import { survivorReward } from "@/lib/aed/promotion";

export const revalidate = 3600;

import { LINE_OA, lineOaUrl } from "@/lib/aed/line";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/aed/contact";
import { rentalPlans } from "@/lib/aed/rental";
import { ProductStructuredData } from "./components/StructuredData";

// Hero renders rent and buy as two equal offers; prices come from the same data
// the plan/package sections use, so the hero can never drift from them.
const RENT_FLEX = rentalPlans.find((p) => p.id === "rent-flex")!;
const RENT_ANNUAL = rentalPlans.find((p) => p.id === "rent-annual")!;
const BUY_PKG = acquisitionPackages.find((p) => p.id === "pkg-premium")!;
const ANNUAL_PER_MONTH = Math.round(RENT_ANNUAL.price / 12 / 10) * 10;
const LINE_RENT_HERO = lineOaUrl("สนใจเช่า AED");
const LINE_BUY_HERO = lineOaUrl(`สนใจซื้อ AED ${BUY_PKG.priceLabel}`);
const LINE_RENT_TABLE = lineOaUrl("สนใจเช่า AED ขอรายละเอียดแผนเช่า");
const LINE_BUY_TABLE = lineOaUrl("สนใจซื้อ AED ขอใบเสนอราคา");

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <ProductStructuredData />

      {/* Navbar — trimmed to the few links a buyer actually needs */}
      <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <JiaAedLogo className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <a href="#brands" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden md:block">เลือกยี่ห้อ</a>
            <a href="#tech" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden md:block">อุปกรณ์เสริม</a>
            {/* เช่า/ซื้อ as one segmented pair, visible at every width — the two
                offers carry equal weight from the very first glance. */}
            <div className="flex items-center">
              <a
                href="#rent"
                data-cta="nav_rent"
                className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 text-sm font-semibold px-3 sm:px-4 py-2 rounded-l-full hover:bg-yellow-400/20 transition-colors"
              >
                เช่า
              </a>
              <a
                href="#how"
                data-cta="nav_buy"
                className="bg-white/5 text-gray-200 border border-l-0 border-gray-500/40 text-sm font-semibold px-3 sm:px-4 py-2 rounded-r-full hover:bg-white/10 transition-colors"
              >
                ซื้อ
              </a>
            </div>
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="navbar"
              className="bg-[#06C755] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#05a847] transition-colors"
            >
              💬 ถามราคา
            </a>
          </div>
        </div>
      </nav>

      {/* Hero — one clear message, one price, two next steps */}
      <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-yellow-950 py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full border border-yellow-400/20 mb-4">
              ✅ อย. รับรอง · เช่าหรือซื้อขาดก็ได้ · ออกใบกำกับภาษีได้
            </span>
            <HeroHeadline />
            <p className="text-gray-400 text-lg mb-4">
              <strong className="text-white">เช่า AED พร้อมใช้</strong> — รวมส่ง ติดตั้ง อบรม และทีมดูแลครบวงจร<br />
              เสียงแนะนำภาษาไทย · ใช้ได้ทั้งผู้ใหญ่และเด็ก
            </p>
            {/* Rent and buy side by side at equal weight — rent keeps the yellow
                identity, buy gets the white/silver "ownership" treatment. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/5 p-5 flex flex-col">
                <span className="text-xs font-bold text-yellow-400">เช่า — ไม่ต้องลงทุนก้อนใหญ่</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-3xl md:text-4xl font-black text-yellow-400">
                    ฿{RENT_FLEX.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-400 font-semibold">/เดือน</span>
                </div>
                <span className="text-xs text-gray-500 mt-1 mb-4">
                  ก่อน VAT · แผนรายปีเฉลี่ย ~฿{ANNUAL_PER_MONTH.toLocaleString()}/เดือน
                </span>
                <a
                  href={LINE_RENT_HERO}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-line-cta="hero_rent_card"
                  data-product="rent-flex"
                  className="mt-auto bg-[#06C755] text-white font-bold text-sm px-4 py-2.5 rounded-full hover:bg-[#05a847] transition-colors text-center"
                >
                  💬 สนใจเช่า — ทัก LINE
                </a>
                <a
                  href="#rent"
                  className="text-center text-xs text-yellow-400/80 hover:text-yellow-300 font-medium mt-2"
                >
                  ดูแผนเช่า →
                </a>
              </div>
              <div className="rounded-2xl border border-gray-400/40 bg-white/5 p-5 flex flex-col">
                <span className="text-xs font-bold text-gray-200">ซื้อขาด — เป็นเจ้าของเต็มตัว</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-3xl md:text-4xl font-black text-white">
                    {BUY_PKG.priceLabel.replace(/^เงินสด\s*/, "")}
                  </span>
                  {BUY_PKG.listPriceLabel && (
                    <span className="text-sm text-gray-500 line-through">{BUY_PKG.listPriceLabel}</span>
                  )}
                </div>
                <span className="text-xs text-gray-500 mt-1 mb-4">
                  ราคาเงินสด · ออกใบกำกับภาษีได้
                </span>
                <a
                  href={LINE_BUY_HERO}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-line-cta="hero_buy_card"
                  data-product="pkg-premium"
                  className="mt-auto bg-[#06C755] text-white font-bold text-sm px-4 py-2.5 rounded-full hover:bg-[#05a847] transition-colors text-center"
                >
                  💬 สนใจซื้อ — ทัก LINE
                </a>
                <a
                  href="#how"
                  className="text-center text-xs text-gray-300 hover:text-white font-medium mt-2"
                >
                  เทียบ 3 วิธี →
                </a>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <HeroCta />
            </div>
            <p className="text-gray-500 text-sm">ตอบทันที 24 ชั่วโมง • ออกใบเสนอราคา/ใบกำกับภาษีได้เลย</p>
          </div>
          {/* Yuwell/PRIMEDIC is the featured brand (owner decision): red machine
              first with the แนะนำ badge; Yuwell Y2 (เรือธง) spotlighted alongside
              it. Amoul i7 discontinued (ก.ค. 2026) — this slot used to be its
              secondary option. The featured image links to the brand page, not
              LINE — image taps are inspection intent, not chat intent (weekly
              review 14 Jun). */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/aed/primedic"
              data-cta="hero_image_primedic"
              data-product="primedic-y8"
              className="relative flex flex-col items-center group cursor-pointer"
              aria-label="Yuwell / PRIMEDIC HeartSave — ดูรุ่นและสเปก"
            >
              <div className="relative w-full h-56 md:h-64 rounded-xl overflow-hidden bg-white ring-2 ring-red-500/50">
                <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  ⭐ แนะนำ
                </span>
                <Image
                  src="/images/primedic-heartsave.png"
                  alt="Yuwell PRIMEDIC HeartSave AED"
                  fill
                  className="object-contain p-3 transition-transform group-hover:scale-105"
                  priority
                />
              </div>
              <span className="mt-2 text-xs font-semibold text-red-400">Yuwell · PRIMEDIC HeartSave</span>
            </Link>
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="hero_image_y2"
              data-product="primedic-y2"
              className="relative flex flex-col items-center group cursor-pointer"
              aria-label="Yuwell Y2 — คลิกเพื่อสอบถามทาง LINE"
            >
              <div className="relative w-full h-56 md:h-64">
                <Image
                  src="/images/yuwell-y2-main.jpg"
                  alt="AED Yuwell Y2"
                  fill
                  className="object-contain drop-shadow-2xl transition-transform group-hover:scale-105"
                  priority
                />
              </div>
              <span className="mt-2 text-xs font-semibold text-gray-400">Yuwell Y2 — รุ่นเรือธง จอสี EKG</span>
            </a>
          </div>
        </div>
      </section>

      {/* Quick contact bar — LINE-first (visitors prefer LINE over the form) */}
      <section className="bg-gray-900 border-y border-gray-800 py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <QuickContact />
        </div>
      </section>

      {/* ═══ RENTAL SPOTLIGHT — the primary offer, shown before buy/own ═══ */}
      <RentalSpotlight />

      {/* ═══ DECISION 1: how to get an AED — rent / rent-to-own / buy ═══ */}
      <PriceViewTracker />
      <section id="how" className="py-16 px-4 bg-gray-950 border-t border-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-3">
            <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">
              ① เลือกวิธีได้เครื่อง
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">อยากได้ AED แบบไหน? เลือกได้ 3 ทาง</h2>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
              เช่าบริการครบวงจร · เช่าแล้วได้ซื้อ (ผ่อนแล้วได้เครื่อง) · ซื้อขาด — เลือกแบบที่เหมาะกับงบและการใช้งานของคุณ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {acquisitionPackages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>

          {/* Rental is one door: managed rental as primary, short-term as opt-in */}
          <p className="text-center text-gray-500 text-sm mt-6">
            อยากเช่าระยะสั้น (รายวัน / อีเวนต์ / รายเดือน)?{" "}
            <Link href="/aed/rental" className="text-yellow-400 hover:text-yellow-300 underline font-medium">
              ดูแผนเช่าระยะสั้น →
            </Link>
          </p>

          {/* Decision helper — rent vs buy, shown in full: this is the single
              most decision-critical content on the page, so no accordion. */}
          <div className="mt-10 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-white text-center mb-5">
              เช่า vs ซื้อ — อันไหนคุ้มกว่าสำหรับคุณ?
            </h3>
            <RentVsBuyTable />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
              <a
                href={LINE_RENT_TABLE}
                target="_blank"
                rel="noopener noreferrer"
                data-line-cta="rent_vs_buy_rent"
                data-product="pkg-care"
                className="bg-[#06C755] text-white font-bold px-6 py-3 rounded-full hover:bg-[#05a847] transition-colors text-center"
              >
                💬 สนใจเช่า — คุยทาง LINE
              </a>
              <a
                href={LINE_BUY_TABLE}
                target="_blank"
                rel="noopener noreferrer"
                data-line-cta="rent_vs_buy_buy"
                data-product="pkg-premium"
                className="bg-[#06C755] text-white font-bold px-6 py-3 rounded-full hover:bg-[#05a847] transition-colors text-center"
              >
                💬 สนใจซื้อ — คุยทาง LINE
              </a>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/aed/packages"
              className="inline-block bg-yellow-400 text-yellow-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-300"
            >
              ดูรายละเอียดทั้ง 3 วิธี →
            </Link>
          </div>

          {/* ฿10,000 survivor-reward promotion */}
          <div className="mt-10">
            <PromoBanner promo={survivorReward} />
          </div>
        </div>
      </section>

      {/* ═══ DECISION 2: which brand — Amoul vs PRIMEDIC, with a recommendation ═══ */}
      <section id="brands" className="py-16 px-4 bg-gray-950 border-t border-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-3">
            <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">
              ② เลือกยี่ห้อ
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">2 ยี่ห้อให้เลือก — เลือกอันไหนดี?</h2>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
              ทั้งสองยี่ห้อ อย. รับรอง เสียงไทย ใช้ช่วยชีวิตได้จริง — ต่างกันที่สไตล์การใช้งานและฟีเจอร์เสริม
            </p>
          </div>

          {/* "Which one for me" recommendation — PRIMEDIC (featured brand) leads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mt-6 mb-10">
            <div className="rounded-2xl border-2 border-red-500/60 bg-red-500/10 p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-400 font-bold">เลือก Yuwell / PRIMEDIC HeartSave ถ้า…</span>
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">⭐ แนะนำ</span>
              </div>
              <p className="text-gray-300 text-sm">
                ต้องการ <strong className="text-white">เซ็นเซอร์ CPR feedback</strong> ช่วยบอกแรง/จังหวะการปั๊มแบบเรียลไทม์ — เหมาะกับทีมที่เน้นคุณภาพการกู้ชีพ
              </p>
            </div>
            <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/5 p-5">
              <div className="text-yellow-300 font-bold mb-1">เลือก PRIMEDIC Y0 ถ้า…</div>
              <p className="text-gray-300 text-sm">
                อยากได้ <strong className="text-white">ราคาเริ่มต้นเข้าถึงง่าย</strong> กึ่งอัตโนมัติใช้งานง่าย เสียงไทย — เหมาะกับออฟฟิศ/โรงงาน/ที่สาธารณะทั่วไป
              </p>
            </div>
          </div>

          <div className="space-y-12">
            {homepageTiers.map((tier) => (
              <div key={tier.label}>
                <div className="flex flex-col items-center text-center mb-6">
                  <span className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-yellow-400/20">
                    {tier.label}
                  </span>
                  <p className="text-gray-500 text-sm mt-2">{tier.note}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                  {tier.cards.map((card) => (
                    <LineupProductCard key={card.id} card={card} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* PRIMEDIC Y0 / Y8 / Y2 detail — collapsed so the brand choice stays simple */}
          <details className="group mt-12 rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
            <summary className="cursor-pointer list-none px-5 py-4 flex justify-between items-center gap-4 hover:bg-gray-800/50 transition-colors">
              <span className="font-semibold text-white">เทียบสเปก PRIMEDIC HeartSave — Y0 / Y8 / Yuwell Y2</span>
              <span className="text-yellow-400 text-xl transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="px-4 pb-5 pt-1">
              <SpecComparisonTable />
              <div className="text-center mt-6">
                <Link
                  href="/aed/primedic"
                  className="inline-block bg-yellow-400 text-yellow-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-300"
                >
                  ดูรายละเอียด PRIMEDIC ทั้งหมด →
                </Link>
              </div>
            </div>
          </details>

          {/* AED yuwell mounting options — ตัวเลือกติดตั้ง */}
          <div className="mt-12">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-white">ตัวเลือกติดตั้งสำหรับ AED yuwell</h3>
              <p className="text-gray-500 text-sm mt-1">เพิ่มตู้ติดผนัง (฿47,900) หรือแท่นตั้งพื้น (฿51,900) — ราคารวมเครื่อง i7 แล้ว</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a
                href={LINE_OA}
                target="_blank"
                rel="noopener noreferrer"
                data-line-cta="banner_floorstand"
                data-product="i7-floor"
                className="group rounded-2xl overflow-hidden border border-gray-800 bg-white hover:border-yellow-400/60 hover:shadow-2xl hover:shadow-yellow-400/10 transition-all"
              >
                <Image
                  src="/images/aed-floorstand.webp"
                  alt="AED yuwell + แท่นตั้งพื้น"
                  width={1536}
                  height={1024}
                  className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-300"
                />
              </a>
              <a
                href={LINE_OA}
                target="_blank"
                rel="noopener noreferrer"
                data-line-cta="banner_wallcabinet"
                data-product="i7-cabinet"
                className="group rounded-2xl overflow-hidden border border-gray-800 bg-white hover:border-yellow-400/60 hover:shadow-2xl hover:shadow-yellow-400/10 transition-all"
              >
                <Image
                  src="/images/aed-wallcabinet.webp"
                  alt="AED yuwell + ตู้ติดผนัง"
                  width={1536}
                  height={1024}
                  className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-300"
                />
              </a>
            </div>
          </div>

          <p className="text-center text-gray-600 text-sm mt-8">
            * ราคาพิเศษสำหรับองค์กร โรงพยาบาล และหน่วยงานภาครัฐ — สอบถามทาง LINE ได้เลย
          </p>
        </div>
      </section>

      {/* Why JiaAED — trust (condensed to the 4 points that matter most) */}
      <section className="py-14 px-4 bg-gray-950 border-t border-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2 text-white">ทำไมเลือก JiaAED</h2>
          <p className="text-center text-gray-500 text-sm mb-10">เจี่ยรักษา — ผู้นำเข้าและจัดจำหน่ายเครื่องมือแพทย์</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                icon: "🏥",
                title: "นำเข้าโดยผู้เชี่ยวชาญ ราคาตรงจากผู้นำเข้า",
                desc: "เจี่ยรักษา จำหน่ายเครื่องมือแพทย์โดยตรง ไม่ผ่านคนกลาง",
              },
              {
                icon: "📜",
                title: "อย. รับรอง · ใบโฆษณาถูกต้อง",
                desc: PRIMEDIC_REGULATORY.published
                  ? `Yuwell / PRIMEDIC HeartSave: ${regLine(PRIMEDIC_REGULATORY)} — ตรวจสอบได้`
                  : `Yuwell / PRIMEDIC HeartSave: ${PRIMEDIC_REGULATORY.pendingNote}`,
              },
              {
                icon: "🛠️",
                title: "บริการหลังการขาย + เสียงไทย",
                desc: "ทีมเทคนิคไทยดูแลตลอดอายุการใช้งาน 7+ ปี · ปุ่มและเสียงนำทางเป็นภาษาไทยทั้งหมด",
              },
              {
                icon: "🚚",
                title: "จัดส่งทั่วประเทศ + ออกใบกำกับภาษี",
                desc: "พร้อมติดตั้งและสาธิตการใช้งาน รองรับจัดซื้อภาครัฐ/โรงพยาบาล/องค์กร",
              },
            ].map((t) => (
              <div
                key={t.title}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-yellow-400/40 transition-colors"
              >
                <div className="text-3xl mb-2">{t.icon}</div>
                <div className="font-bold text-white mb-1">{t.title}</div>
                <div className="text-gray-400 text-sm leading-relaxed">{t.desc}</div>
              </div>
            ))}
          </div>

          {/* Real training photos — photographic proof of the after-sales story */}
          <div className="mt-10">
            <PhotoStrip
              photos={[
                { src: "/images/training-bls-1.jpg", alt: "สาธิต CPR และการใช้ AED นอกสถานที่", caption: "สาธิตการใช้ AED ถึงหน่วยงาน" },
                { src: "/images/training-bls-2.jpg", alt: "ผู้เข้าอบรม CPR รับใบประกาศ", caption: "อบรมโดยทีม BLS Instructor" },
                { src: "/images/training-bls-3.jpg", alt: "ฝึกปฏิบัติ CPR กับหุ่นจำลอง", caption: "ฝึกปฏิบัติจริงกับหุ่น CPR" },
              ]}
            />
            <p className="text-center mt-4">
              <Link href="/training" className="text-yellow-400 hover:text-yellow-300 text-sm font-medium">
                เราอบรมให้จริงทุกแพ็กเกจ — ดูหลักสูตรอบรม CPR &amp; AED →
              </Link>
            </p>
          </div>

          {/* Trust stats */}
          <div className="mt-12">
            <TrustStats />
          </div>
        </div>
      </section>

      {/* Lifestyle banner — emotional divider before the deeper product story */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <Image src="/images/lifestyle-cpr.png" alt="AED ในสถานการณ์จริง" fill className="object-cover object-center" />
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <p className="text-2xl md:text-4xl font-black">ทุกวินาทีคือ<span className="text-red-400">ชีวิต</span></p>
            <p className="text-gray-300 mt-2 text-lg">Shock พร้อมใน 7 วินาที ลดการเสียชีวิตได้ <span className="text-red-400 font-bold">70%</span></p>
          </div>
        </div>
      </section>

      {/* Get to know the device — features, durability, ease of use, demo */}
      <section className="py-14 px-4 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2 text-white">เทคโนโลยีครบทุกมิติ</h2>
          <p className="text-center text-gray-500 text-sm mb-8">ออกแบบมาเพื่อช่วยชีวิตในทุกสถานการณ์</p>
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
            <Image src="/images/yuwell-y2-features.webp" alt="Yuwell Y2 — หน้าจอสีแนะนำทุกขั้นตอน พร้อมระบบแนะนำ CPR แบบเรียลไทม์" width={1536} height={1024} className="w-full h-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-center text-sm">
            {[
              { icon: "🖥️", name: "หน้าจอสี", desc: "แนะนำทุกขั้นตอน เข้าใจง่ายแม้ไม่มีประสบการณ์" },
              { icon: "❤️", name: "CPR เรียลไทม์", desc: "บอกความลึกและจังหวะการกดหน้าอก" },
              { icon: "⚡", name: "วิเคราะห์รวดเร็ว", desc: "วิเคราะห์คลื่นหัวใจ พร้อมช็อกแม่นยำ" },
              { icon: "👨‍👩‍👧", name: "Smart Pad", desc: "แผ่นเดียวใช้ได้ทั้งเด็กและผู้ใหญ่" },
            ].map((f) => (
              <div key={f.name} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="font-bold text-yellow-400">{f.name}</div>
                <div className="text-gray-400 text-xs mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waterproof */}
      <section className="py-14 px-4 bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <SplitFeature
            image="/images/aed-weather.webp"
            imageAlt="AED PRIMEDIC ทนทุกสภาพอากาศ ตั้งแต่ -25°C ถึง 60°C"
            badge="🛡️ IP65 CERTIFIED"
            title={<>กันน้ำ กันฝุ่น<br />พร้อมทุกสภาพแวดล้อม</>}
            intro="ผ่านมาตรฐาน IP65 ทนต่อละอองน้ำและฝุ่น ใช้งานได้ทั้งในอาคารและกลางแจ้ง อุณหภูมิ -25°C ถึง 60°C"
            bullets={["กันน้ำ กันฝุ่น IP65", "อุณหภูมิ -25°C ถึง 60°C", "Self-test อัตโนมัติทุกวัน", "แบตเตอรี่อายุ ≥ 7 ปี"]}
          />
        </div>
      </section>

      {/* Easy to use + demo video */}
      <section className="py-14 px-4 bg-gray-900">
        <div className="max-w-5xl mx-auto mb-12">
          <SplitFeature
            image="/images/lifestyle-aed-carry.webp"
            imageAlt="พร้อมช่วยในทุกวินาที — ใช้งาน AED ง่าย"
            badge="👥 ใช้งานง่าย"
            title={<>ไม่ต้องฝึก<br />ก็ใช้ได้ทันที</>}
            intro="เสียงแนะนำภาษาไทยทีละขั้นตอน พร้อมภาพนิ่งบนหน้าจอ ทุกคนในองค์กรสามารถใช้ได้ทันทีที่เกิดเหตุฉุกเฉิน"
            reverse
          >
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="easy_use"
              className="inline-block bg-[#06C755] text-white font-bold px-6 py-3 rounded-full hover:bg-[#05a847] transition-colors"
            >
              💬 สอบถามราคา
            </a>
          </SplitFeature>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">🎬 วิดีโอสาธิต</div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">ดูวิธีการใช้งานเครื่อง AED</h2>
            <p className="text-gray-400 text-sm">ทีละขั้นตอน — ใช้ได้ทันที ไม่ต้องอบรม</p>
          </div>
          <YouTubeLite videoId="cpM78Zc2RC0" title="วิธีการใช้งานเครื่อง AED" />
        </div>
      </section>

      {/* ═══ Accessories / spare parts — collapsed by default ═══ */}
      <section id="tech" className="py-14 px-4 bg-gray-950 border-t border-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block bg-gray-700/40 text-gray-300 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-gray-600/40">
              🔋 อุปกรณ์เสริม · ตู้จัดเก็บ · อบรม · อะไหล่
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">อุปกรณ์เสริม &amp; อะไหล่ของแท้</h2>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto">
              สเปกและการเปรียบเทียบรุ่นปัจจุบัน (Yuwell Y2 / PRIMEDIC HeartSave)
              ดูได้ที่หัวข้อ{" "}
              <a href="#brands" className="text-yellow-400 hover:underline">
                เลือกยี่ห้อ
              </a>{" "}
              ด้านบน
            </p>
          </div>

          <div className="space-y-4">
            {/* Accessories / spare parts */}
            <details className="group rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
              <summary className="cursor-pointer list-none px-5 py-4 flex justify-between items-center gap-4 hover:bg-gray-800/50 transition-colors">
                <span className="font-semibold text-white">🔋 อุปกรณ์เสริม · ตู้ · อบรม CPR&amp;AED &amp; อะไหล่</span>
                <span className="text-yellow-400 text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="px-4 pb-6 pt-2">
                <p className="text-center text-gray-500 mb-8 max-w-2xl mx-auto">
                  ครบทั้งตู้จัดเก็บ คอร์สอบรม CPR &amp; AED สอนถึงที่ ชุดอุปกรณ์ฝึกสอน และอะไหล่ของแท้ (แผ่น Pad / แบตเตอรี่) สำหรับ AED Yuwell Y2 / PRIMEDIC HeartSave — สั่งซื้อหรือสอบถามราคาได้ทาง LINE
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                  {accessories.map((a) => (
                    <div
                      key={a.id}
                      className="relative rounded-2xl border border-gray-700 p-6 flex flex-col bg-gray-950"
                    >
                      <div className="relative w-full h-44 mb-4 rounded-xl overflow-hidden bg-white">
                        <Image src={a.image} alt={a.name} fill className="object-contain p-3" />
                      </div>
                      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{a.subtitle}</div>
                      <h3 className="font-bold text-lg text-white mt-1 mb-3">{a.name}</h3>
                      <div className="mb-3">
                        {a.price != null ? (
                          <>
                            <div className="text-3xl font-bold text-yellow-400">฿{a.price.toLocaleString()}</div>
                            <div className="text-gray-600 text-xs">ราคาเริ่มต้น (ยังไม่รวม VAT)</div>
                          </>
                        ) : (
                          <>
                            <div className="text-2xl font-bold text-gray-400">{a.priceLabel ?? "สอบถามราคา"}</div>
                            <div className="text-gray-600 text-xs">ราคาจะอัปเดตเร็วๆ นี้</div>
                          </>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-4">{a.description}</p>
                      <ul className="space-y-1 mb-6 flex-1">
                        {a.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                            <span className="text-yellow-400 flex-shrink-0">✓</span>{f}
                          </li>
                        ))}
                      </ul>
                      <a
                        href={LINE_OA}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-line-cta="accessory_card"
                        data-product={a.id}
                        className="text-center font-semibold py-3 rounded-full transition-colors bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700"
                      >
                        สั่งซื้อ / ถามราคา
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-950 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/lifestyle-cpr.png" alt="" fill className="object-cover" />
        </div>
        <div className="relative max-w-xl mx-auto">
          <div className="text-red-400 text-4xl mb-4">❤️</div>
          <h2 className="text-3xl font-black mb-3 text-white">พร้อมปกป้องชีวิตแล้วใช่ไหม?</h2>
          <p className="text-gray-500 mb-8">คุยกับ AI เจี่ยทาง LINE — ตอบทันที ออกใบเสนอราคาได้เลย</p>
          <a
            href={LINE_OA}
            target="_blank"
            rel="noopener noreferrer"
            data-line-cta="footer_cta"
            className="inline-block bg-[#06C755] text-white font-bold text-xl px-10 py-4 rounded-full hover:bg-[#05a847] transition-colors shadow-2xl"
          >
            💬 เพิ่มเพื่อน LINE @jiacpr
          </a>
        </div>
      </section>

      {/* Latest curated news — renders nothing until items exist */}
      <LatestNews limit={6} />

      {/* Lead form — alternative to LINE for ad traffic */}
      <section id="contact" className="py-14 px-4 bg-gray-950 border-t border-gray-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2 text-white">ขอใบเสนอราคา / ติดต่อกลับ</h2>
          <p className="text-center text-gray-500 text-sm mb-2">
            ไม่สะดวกใช้ LINE? ฝากข้อมูลไว้ — ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง
          </p>
          <p className="text-center text-gray-500 text-sm mb-8">
            หรือ{" "}
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="contact_section_link"
              className="text-yellow-400 hover:text-yellow-300 underline"
            >
              คุยทาง LINE ได้ทันที 24 ชั่วโมง →
            </a>
          </p>
          <LeadForm />
        </div>
      </section>

      {/* FAQ — for SEO/AEO */}
      <section id="faq" className="py-14 px-4 bg-gray-900 border-t border-gray-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2 text-white">คำถามที่พบบ่อย</h2>
          <p className="text-center text-gray-500 text-sm mb-8">FAQ — AED Yuwell Y2 และ PRIMEDIC HeartSave</p>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.question}
                className="group rounded-xl border border-gray-800 bg-gray-950 overflow-hidden"
              >
                <summary className="cursor-pointer list-none px-5 py-4 flex justify-between items-center gap-4 hover:bg-gray-800/50 transition-colors">
                  <span className="font-semibold text-white">{f.question}</span>
                  <span className="text-yellow-400 text-xl transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="px-5 pb-5 text-gray-300 text-sm leading-relaxed border-t border-gray-800 pt-4">
                  {f.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer — absorbs the deeper links removed from the navbar */}
      <footer className="bg-black border-t border-gray-800 text-gray-600 text-sm py-8 px-4 text-center">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-4 text-gray-400">
          <Link href="/aed/packages" className="hover:text-yellow-400 transition-colors">แพ็กเกจ</Link>
          <Link href="/aed/subscription" className="hover:text-yellow-400 transition-colors">เช่า AED</Link>
          <Link href="/aed/rental" className="hover:text-yellow-400 transition-colors">เช่าระยะสั้น</Link>
          <Link href="/aed/primedic" className="hover:text-yellow-400 transition-colors">PRIMEDIC</Link>
          <a href="#tech" className="hover:text-yellow-400 transition-colors">อุปกรณ์เสริม</a>
          <a href="#faq" className="hover:text-yellow-400 transition-colors">FAQ</a>
          <Link href="/docs" className="hover:text-yellow-400 transition-colors">เอกสาร</Link>
          <Link href="/articles" className="hover:text-yellow-400 transition-colors">บทความ</Link>
          <Link href="/news" className="hover:text-yellow-400 transition-colors">ข่าว</Link>
        </div>
        <p className="font-semibold text-gray-300 mb-1">JiaAED by เจี่ยรักษา</p>
        <p className="mb-1">
          <a href={PHONE_HREF} data-cta="tel_footer" className="text-gray-400 hover:text-yellow-400">
            📞 โทร {PHONE_DISPLAY}
          </a>{" "}
          ·{" "}
          <Link href="/privacy" className="text-gray-400 hover:text-yellow-400">
            นโยบายความเป็นส่วนตัว
          </Link>
        </p>
        <p>
          จำหน่าย AED Yuwell / PRIMEDIC HeartSave
          {PRIMEDIC_REGULATORY.published ? ` · ${regLine(PRIMEDIC_REGULATORY)}` : ""}
        </p>
        <p className="mt-3 text-xs text-gray-700">© {new Date().getFullYear()} JiaAED. All rights reserved.</p>
      </footer>

    </div>
  );
}
