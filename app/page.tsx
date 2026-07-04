import Image from "next/image";
import Link from "next/link";
import { accessories } from "@/lib/aed/products";
import { homepageTiers } from "@/lib/aed/lineup";
import { faqs } from "@/lib/aed/faqs";
import { AMOUL_REGULATORY, PRIMEDIC_REGULATORY, regLine } from "@/lib/aed/regulatory";
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
import { acquisitionPackages } from "@/lib/aed/packages";
import { survivorReward } from "@/lib/aed/promotion";

export const revalidate = 3600;

import { LINE_OA } from "@/lib/aed/line";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/aed/contact";
import { ProductStructuredData } from "./components/StructuredData";

const specs = [
  { label: "น้ำหนัก", value: "ประมาณ 2.0 กก. (รวมแบตเตอรี่)" },
  { label: "ผู้ใช้งาน", value: "ผู้ใหญ่ และ เด็ก (<8 ปี หรือ <25 กก.) — สลับโหมดด้วยสวิตช์" },
  { label: "ภาษาเสียงแนะนำ", value: "5 ภาษา: ไทย · อังกฤษ · จีน · สเปน · อิตาลี" },
  { label: "พลังงานสูงสุด", value: "360 Joules (BTE Biphasic Waveform)" },
  { label: "พลังงาน Shock ผู้ใหญ่", value: "Escalating 6 ระดับ: 100 → 150 → 170 → 200 → 300 → 360 J" },
  { label: "พลังงาน Shock เด็ก", value: "Escalating 7 ระดับ: 10 → 15 → 20 → 30 → 50 → 70 → 100 J" },
  { label: "การปรับพลังงาน", value: "Auto ตาม Patient Impedance (ผู้ใช้ตั้งค่าเองไม่ได้)" },
  { label: "เวลาชาร์จพร้อม Shock", value: "< 7 วินาที" },
  { label: "แบตเตอรี่", value: "Lithium 4,500 mAh · 12V (แบบใช้แล้วทิ้ง ชาร์จใหม่ไม่ได้)" },
  { label: "อายุแบตเตอรี่", value: "≥ 5 ปี (สแตนด์บายในเครื่อง) · ≥ 7 ปี (เก็บแยกในอุณหภูมิเหมาะสม)" },
  { label: "จำนวน Shock ต่อชาร์จ", value: "≥ 420 ครั้ง ที่ 200J (ทดสอบมาตรฐาน)" },
  { label: "บันทึก ECG", value: "≥ 8 ชั่วโมง · เหตุการณ์ ≥ 1,500 รายการ" },
  { label: "Self-test", value: "อัตโนมัติ — รายวัน / รายสัปดาห์ / รายเดือน" },
  { label: "อุณหภูมิใช้งาน", value: "-25°C ถึง 60°C" },
  { label: "การเชื่อมต่อ", value: "USB · Wi-Fi · SIM (4G) — เลือกใช้เมื่อเปิด AED Management Platform" },
  { label: "โหมดการทำงาน", value: "Standalone (ค่าเริ่มต้น) — ใช้ช่วยชีวิตได้โดยไม่ต้องเชื่อมต่อ" },
  { label: "มาตรฐาน", value: "CE Mark · ISO 13485 · IP65 · EN 1789:2020 · ILCOR/AHA 2020-2025" },
  { label: "อุปกรณ์ที่รวมมา", value: "Electrode pads + แบตเตอรี่ + กระเป๋า + คู่มือไทย" },
];

const adultShocks = [
  { n: "Shock 1", j: "100 J" },
  { n: "Shock 2", j: "150 J" },
  { n: "Shock 3", j: "170 J" },
  { n: "Shock 4", j: "200 J" },
  { n: "Shock 5", j: "300 J" },
  { n: "Shock 6", j: "360 J" },
  { n: "Shock 7+", j: "360 J (cap max)" },
];

const pediatricShocks = [
  { n: "Shock 1", j: "10 J" },
  { n: "Shock 2", j: "15 J" },
  { n: "Shock 3", j: "20 J" },
  { n: "Shock 4", j: "30 J" },
  { n: "Shock 5", j: "50 J" },
  { n: "Shock 6", j: "70 J" },
  { n: "Shock 7", j: "100 J" },
  { n: "Shock 8+", j: "100 J (cap max)" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <ProductStructuredData />

      {/* Navbar — trimmed to the few links a buyer actually needs */}
      <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">❤️</span>
            <span className="font-bold text-xl text-yellow-400">JiaAED</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#rent" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden sm:block">เช่า AED</a>
            <a href="#how" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden sm:block">วิธีได้เครื่อง</a>
            <a href="#brands" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden md:block">เลือกยี่ห้อ</a>
            <a href="#tech" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden md:block">ข้อมูลเครื่อง</a>
            <Link href="/aed/rental" className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 text-sm font-semibold px-4 py-2 rounded-full hover:bg-yellow-400/20 transition-colors hidden sm:block">เช่า AED →</Link>
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
              ✅ อย. รับรอง · เช่าได้ ไม่ต้องลงทุนก้อนใหญ่ · ออกใบกำกับภาษีได้
            </span>
            <HeroHeadline />
            <p className="text-gray-400 text-lg mb-4">
              <strong className="text-white">เช่า AED พร้อมใช้</strong> — รวมส่ง ติดตั้ง อบรม และทีมดูแลครบวงจร<br />
              เสียงแนะนำภาษาไทย · ใช้ได้ทั้งผู้ใหญ่และเด็ก
            </p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-6 bg-yellow-400/5 border border-yellow-400/30 rounded-2xl px-5 py-4 inline-flex">
              <span className="text-xs text-gray-400">เช่าเริ่มต้น</span>
              <span className="text-4xl md:text-5xl font-black text-yellow-400">฿2,490</span>
              <span className="text-lg text-gray-400 font-semibold">/เดือน</span>
              <span className="text-xs text-gray-500 w-full">ก่อน VAT · แผนรายปีเฉลี่ย ~฿1,830/เดือน · หรือจะซื้อขาด ฿42,900 ก็ได้</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <a
                href="#rent"
                className="bg-yellow-400 text-yellow-900 font-bold text-lg px-8 py-4 rounded-full hover:bg-yellow-300 transition-colors text-center"
              >
                ดูแผนเช่า AED →
              </a>
              <HeroCta />
            </div>
            <p className="text-gray-500 text-sm">ตอบทันที 24 ชั่วโมง • ออกใบเสนอราคา/ใบกำกับภาษีได้เลย</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="hero_image_amoul"
              data-product="i7"
              className="relative flex flex-col items-center group cursor-pointer"
              aria-label="Amoul i7 — คลิกเพื่อสอบถามทาง LINE"
            >
              <div className="relative w-full h-56 md:h-64">
                <Image
                  src="/images/product-main.png"
                  alt="AED Amoul i7"
                  fill
                  className="object-contain drop-shadow-2xl transition-transform group-hover:scale-105"
                  priority
                />
              </div>
              <span className="mt-2 text-xs font-semibold text-yellow-300">Amoul i7</span>
            </a>
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="hero_image_primedic"
              data-product="primedic-y8"
              className="relative flex flex-col items-center group cursor-pointer"
              aria-label="PRIMEDIC HeartSave — คลิกเพื่อสอบถามทาง LINE"
            >
              <div className="relative w-full h-56 md:h-64 rounded-xl overflow-hidden bg-white">
                <Image
                  src="/images/primedic-heartsave.png"
                  alt="PRIMEDIC HeartSave AED"
                  fill
                  className="object-contain p-3 transition-transform group-hover:scale-105"
                  priority
                />
              </div>
              <span className="mt-2 text-xs font-semibold text-red-400">PRIMEDIC HeartSave</span>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
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

          {/* Decision helper — rent vs buy, collapsed to keep the section clean */}
          <details className="group mt-8 max-w-3xl mx-auto rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
            <summary className="cursor-pointer list-none px-5 py-4 flex justify-between items-center gap-4 hover:bg-gray-800/50 transition-colors">
              <span className="font-semibold text-white">เช่า vs ซื้อ — อันไหนคุ้มกว่าสำหรับคุณ?</span>
              <span className="text-yellow-400 text-xl transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="px-4 pb-5 pt-1">
              <RentVsBuyTable />
            </div>
          </details>

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

          {/* "Which one for me" recommendation — answers the question up front */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mt-6 mb-10">
            <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/5 p-5">
              <div className="text-yellow-300 font-bold mb-1">เลือก Amoul i7 ถ้า…</div>
              <p className="text-gray-300 text-sm">
                อยากได้ <strong className="text-white">ราคาเริ่มต้นเข้าถึงง่าย</strong> + อัตโนมัติเต็มรูปแบบ เสียงไทย 5 ภาษา IP65 กันน้ำ — เหมาะกับออฟฟิศ/โรงงาน/ที่สาธารณะทั่วไป
              </p>
            </div>
            <div className="rounded-2xl border border-red-500/40 bg-red-500/5 p-5">
              <div className="text-red-400 font-bold mb-1">เลือก PRIMEDIC HeartSave (Y8) ถ้า…</div>
              <p className="text-gray-300 text-sm">
                ต้องการ <strong className="text-white">เซ็นเซอร์ CPR feedback</strong> ช่วยบอกแรง/จังหวะการปั๊มแบบเรียลไทม์ — เหมาะกับทีมที่เน้นคุณภาพการกู้ชีพ
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

          {/* PRIMEDIC Y0 vs Y8 detail — collapsed so the brand choice stays simple */}
          <details className="group mt-12 rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
            <summary className="cursor-pointer list-none px-5 py-4 flex justify-between items-center gap-4 hover:bg-gray-800/50 transition-colors">
              <span className="font-semibold text-white">เทียบสเปก PRIMEDIC HeartSave — Y0 vs Y8</span>
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

          {/* Amoul i7 mounting options — ตัวเลือกติดตั้ง (ไม่ใช่ยี่ห้อแยก) */}
          <div className="mt-12">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-white">ตัวเลือกติดตั้งสำหรับ Amoul i7</h3>
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
                  src="/images/aed-floorstand.png"
                  alt="AED Amoul i7 + แท่นตั้งพื้น"
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
                  src="/images/aed-wallcabinet.png"
                  alt="AED Amoul i7 + ตู้ติดผนัง"
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
                  ? `Amoul i7: ${regLine(AMOUL_REGULATORY)} · PRIMEDIC: ${regLine(PRIMEDIC_REGULATORY)} — ตรวจสอบได้`
                  : `Amoul i7: ${regLine(AMOUL_REGULATORY)} ตรวจสอบได้ · PRIMEDIC HeartSave: ${PRIMEDIC_REGULATORY.pendingNote}`,
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
            <Image src="/images/feature-grid.jpg" alt="i-SHOCK i-SAVE i-LOOK i-CARE" width={1080} height={1080} className="w-full h-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-center text-sm">
            {[
              { icon: "⚡", name: "i-SHOCK", desc: "360J พร้อมใน 7 วินาที" },
              { icon: "❤️", name: "i-SAVE", desc: "วิเคราะห์คลื่นหัวใจอัตโนมัติ" },
              { icon: "🖥️", name: "i-LOOK", desc: "จอแสดงขั้นตอนการใช้งาน" },
              { icon: "📡", name: "i-CARE", desc: "บันทึก ECG ส่งข้อมูลผ่าน WiFi" },
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
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            <Image src="/images/waterproof.jpeg" alt="AED IP65 กันน้ำ" width={600} height={400} className="w-full h-auto" />
          </div>
          <div>
            <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">🛡️ IP65 CERTIFIED</div>
            <h2 className="text-3xl font-black mb-4 text-white">กันน้ำ กันฝุ่น<br />พร้อมทุกสภาพแวดล้อม</h2>
            <p className="text-gray-400 mb-5">ผ่านมาตรฐาน IP65 ทนต่อละอองน้ำและฝุ่น ใช้งานได้ทั้งในอาคารและกลางแจ้ง อุณหภูมิ -25°C ถึง 60°C</p>
            <ul className="space-y-3">
              {["กันน้ำ กันฝุ่น IP65", "อุณหภูมิ -25°C ถึง 60°C", "Self-test อัตโนมัติทุกวัน", "แบตเตอรี่อายุ ≥ 7 ปี"].map(f => (
                <li key={f} className="flex items-center gap-3 text-gray-300">
                  <span className="text-yellow-400 font-bold text-lg">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Easy to use + demo video */}
      <section className="py-14 px-4 bg-gray-900">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center mb-12">
          <div className="order-2 md:order-1">
            <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">👥 ใช้งานง่าย</div>
            <h2 className="text-3xl font-black mb-4 text-white">ไม่ต้องฝึก<br />ก็ใช้ได้ทันที</h2>
            <p className="text-gray-400 mb-6">เสียงแนะนำภาษาไทยทีละขั้นตอน พร้อมภาพนิ่งบนหน้าจอ ทุกคนในองค์กรสามารถใช้ได้ทันทีที่เกิดเหตุฉุกเฉิน</p>
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="easy_use"
              className="inline-block bg-[#06C755] text-white font-bold px-6 py-3 rounded-full hover:bg-[#05a847] transition-colors"
            >
              💬 สอบถามราคา
            </a>
          </div>
          <div className="order-1 md:order-2 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
            <Image src="/images/lifestyle-man.jpeg" alt="ใช้งาน AED ง่าย" width={600} height={400} className="w-full h-auto" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">🎬 วิดีโอสาธิต</div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">ดูวิธีการใช้งานเครื่อง AED</h2>
            <p className="text-gray-400 text-sm">ทีละขั้นตอน — ใช้ได้ทันที ไม่ต้องอบรม</p>
          </div>
          <YouTubeLite videoId="ayov6IVgW7w" title="วิธีการใช้งานเครื่อง AED" />
        </div>
      </section>

      {/* ═══ Technical deep-dive — collapsed by default, kept in DOM for SEO ═══ */}
      <section id="tech" className="py-14 px-4 bg-gray-950 border-t border-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block bg-gray-700/40 text-gray-300 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-gray-600/40">
              📋 ข้อมูลทางเทคนิคแบบละเอียด
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">เจาะลึกสเปก & การทำงาน</h2>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto">สำหรับผู้ที่ต้องการรายละเอียด — กดเปิดหัวข้อที่สนใจได้เลย</p>
          </div>

          <div className="space-y-4">
            {/* Shock protocol */}
            <details className="group rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
              <summary className="cursor-pointer list-none px-5 py-4 flex justify-between items-center gap-4 hover:bg-gray-800/50 transition-colors">
                <span className="font-semibold text-white">⚡ โปรแกรมการช็อก (Escalating Energy Protocol) + Evidence ทางการแพทย์</span>
                <span className="text-yellow-400 text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="px-4 pb-6 pt-2">
                <p className="text-gray-400 text-sm max-w-2xl mx-auto text-center mb-6">
                  เครื่องของเราใช้ escalating protocol ตาม international guidelines เริ่มต่ำเพื่อลด myocardial damage แล้วเพิ่มเมื่อจำเป็น เป็น standard ที่ AHA recognize
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-950 border border-red-400/30 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-red-400">ADULT (ผู้ใหญ่) — 6 ระดับ</h3>
                      <span className="text-xs text-gray-500">100 → 360 J</span>
                    </div>
                    <ul className="space-y-2">
                      {adultShocks.map((s) => (
                        <li key={s.n} className="flex justify-between items-center bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm">
                          <span className="text-gray-400 font-medium">{s.n}</span>
                          <span className="text-red-400 font-bold">{s.j}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-500 mt-3">↑ เพิ่มพลังงานอัตโนมัติเมื่อช็อกครั้งก่อนไม่สำเร็จ</p>
                  </div>

                  <div className="bg-gray-950 border border-green-400/30 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-green-400">PEDIATRIC (เด็ก) — 7 ระดับ</h3>
                      <span className="text-xs text-gray-500">10 → 100 J</span>
                    </div>
                    <ul className="space-y-2">
                      {pediatricShocks.map((s) => (
                        <li key={s.n} className="flex justify-between items-center bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm">
                          <span className="text-gray-400 font-medium">{s.n}</span>
                          <span className="text-green-400 font-bold">{s.j}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-500 mt-3">สำหรับเด็ก &lt; 8 ปี หรือน้ำหนัก &lt; 25 กก.</p>
                  </div>
                </div>

                {/* Medical Evidence */}
                <div className="mt-8 bg-gray-950 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span>📚</span> EVIDENCE ทางการแพทย์
                  </h3>
                  <div className="grid md:grid-cols-3 gap-5 text-sm">
                    <div>
                      <div className="text-yellow-400 font-bold mb-2">Guidelines ILCOR/AHA 2020-2025</div>
                      <ul className="space-y-1.5 text-gray-300">
                        <li className="flex items-start gap-2"><span className="text-green-400">✓</span><span>Escalating energy = acceptable strategy</span></li>
                        <li className="flex items-start gap-2"><span className="text-green-400">✓</span><span>Fixed high energy = also acceptable</span></li>
                        <li className="flex items-start gap-2"><span className="text-green-400">✓</span><span>Both have similar outcomes</span></li>
                      </ul>
                    </div>
                    <div>
                      <div className="text-yellow-400 font-bold mb-2">Studies</div>
                      <ol className="space-y-1.5 text-gray-300 list-decimal list-inside">
                        <li><span className="font-semibold">BIPHASIC Trial (2007):</span> Escalating ≈ fixed high energy — termination rates ใกล้เคียง</li>
                        <li><span className="font-semibold">AHA 2020 Guidelines:</span> ทั้ง 2 กลยุทธ์ recommended — ไม่มี superiority</li>
                        <li><span className="font-semibold">ILCOR 2025 Update:</span> Initial 120-200J biphasic · Subsequent ≥ initial · 360J max</li>
                      </ol>
                    </div>
                    <div>
                      <div className="text-yellow-400 font-bold mb-2">First Shock Success Rates</div>
                      <ul className="space-y-1.5 text-gray-300">
                        <li className="flex justify-between"><span>100J biphasic</span><span className="text-red-400 font-bold">70-80%</span></li>
                        <li className="flex justify-between"><span>150J biphasic</span><span className="text-red-400 font-bold">80-90%</span></li>
                        <li className="flex justify-between"><span>200J biphasic</span><span className="text-red-400 font-bold">85-90%</span></li>
                      </ul>
                      <div className="mt-3 pt-3 border-t border-gray-800">
                        <div className="text-xs text-gray-400 mb-1">After 3 shocks</div>
                        <div className="text-green-400 font-bold">Cumulative success &gt; 95%</div>
                        <div className="text-xs text-gray-500 mt-1">ส่วนใหญ่ไม่ต้องถึง 360J</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </details>

            {/* Connectivity */}
            <details className="group rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
              <summary className="cursor-pointer list-none px-5 py-4 flex justify-between items-center gap-4 hover:bg-gray-800/50 transition-colors">
                <span className="font-semibold text-white">📡 โหมดการทำงาน & การเชื่อมต่อ (Standalone + Optional Connectivity)</span>
                <span className="text-yellow-400 text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="px-4 pb-6 pt-2">
                <p className="text-gray-400 text-sm max-w-2xl mx-auto text-center mb-6">
                  AED Amoul i7 ทำงานแบบ Standalone เป็นค่าเริ่มต้น ช่วยชีวิตได้ทันทีโดยไม่ต้องเชื่อมต่อใดๆ — Connectivity จะใช้ก็ต่อเมื่อลูกค้าเปิดใช้ AED Management Platform เอง
                </p>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-950 border border-green-400/40 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">✅</span>
                      <div>
                        <div className="text-xs text-green-400 font-bold uppercase tracking-wide">โหมดที่ 1 (ค่าเริ่มต้น)</div>
                        <h3 className="font-bold text-lg text-white">Standalone Mode</h3>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>เครื่องทำงานเดี่ยว ไม่ส่งข้อมูลขึ้นส่วนกลาง</span></li>
                      <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>ไม่ต้องเปิดใช้ dashboard หรือสมัครอะไรเพิ่ม</span></li>
                      <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>ใช้ช่วยชีวิตได้ปกติทุกอย่าง — Self-test รายวันก็ทำให้เอง</span></li>
                      <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>ดึง event log ผ่าน USB เมื่อตรวจสอบเครื่อง</span></li>
                    </ul>
                  </div>

                  <div className="bg-gray-950 border border-blue-400/40 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">🔗</span>
                      <div>
                        <div className="text-xs text-blue-400 font-bold uppercase tracking-wide">โหมดที่ 2 (ตัวเลือก)</div>
                        <h3 className="font-bold text-lg text-white">Connected Mode</h3>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">เมื่อต้องการดูข้อมูล ECG ขณะใช้เครื่องแบบ real-time:</p>
                    <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
                      <li>เปิดใช้ AED Management Platform</li>
                      <li>ลงทะเบียนข้อมูลเครื่อง</li>
                      <li>เลือกช่องทาง: USB / Wi-Fi / SIM 4G</li>
                    </ol>
                    <p className="text-xs text-blue-300 mt-3">→ จึงจะเข้าถึงข้อมูลผ่าน dashboard ได้</p>
                  </div>
                </div>

                {/* Connectivity channels */}
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    {
                      icon: "🔌",
                      name: "USB",
                      desc: "ดาวน์โหลด event log ออกได้ — ไม่ส่งอัตโนมัติ เก็บข้อมูลผ่าน USB เมื่อตรวจสอบ",
                    },
                    {
                      icon: "📶",
                      name: "Wi-Fi",
                      desc: "ส่งข้อมูลขึ้นแพลตฟอร์มแบบ real-time ในพื้นที่ที่มี Wi-Fi ครอบคลุม",
                    },
                    {
                      icon: "📡",
                      name: "SIM (4G)",
                      desc: "ส่งข้อมูลขึ้น real-time ผ่าน 4G cellular — สำหรับพื้นที่ไม่มี Wi-Fi",
                    },
                  ].map((c) => (
                    <div key={c.name} className="bg-gray-950 border border-gray-700 rounded-xl p-5">
                      <div className="text-3xl mb-2">{c.icon}</div>
                      <div className="font-bold text-white mb-1">{c.name}</div>
                      <p className="text-sm text-gray-400 leading-relaxed">{c.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-gray-500 mt-6">
                  * รุ่น i7 ยังไม่มี GPS tracking (อยู่ระหว่างการพัฒนากับ supplier) · Wi-Fi/4G มีประโยชน์ก็ต่อเมื่อท่านเปิดใช้แพลตฟอร์ม
                </p>
              </div>
            </details>

            {/* Battery life */}
            <details className="group rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
              <summary className="cursor-pointer list-none px-5 py-4 flex justify-between items-center gap-4 hover:bg-gray-800/50 transition-colors">
                <span className="font-semibold text-white">🔋 อายุการใช้งานแบตเตอรี่</span>
                <span className="text-yellow-400 text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="px-4 pb-6 pt-2">
                <p className="text-gray-400 text-sm text-center mb-6">Lithium 4,500 mAh · 12V · แบบใช้แล้วทิ้ง · &gt; 420 ครั้ง shock ที่ 200J</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 text-center">
                    <div className="text-5xl mb-2">⏱️</div>
                    <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">กรณีสแตนด์บายปกติ</div>
                    <div className="text-4xl font-black text-yellow-400 mb-1">มากกว่า 5 ปี</div>
                    <p className="text-sm text-gray-400">(เครื่องออโต้เทสทุกวัน แต่ไม่ได้ส่งรายงานไร้สาย)</p>
                  </div>
                  <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 text-center">
                    <div className="text-5xl mb-2">📦</div>
                    <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">กรณีเก็บแบตเตอรี่</div>
                    <div className="text-4xl font-black text-yellow-400 mb-1">สูงสุด 7 ปี</div>
                    <p className="text-sm text-gray-400">(แยกไว้ภายนอกเครื่อง ในอุณหภูมิที่เหมาะสม)</p>
                  </div>
                </div>
              </div>
            </details>

            {/* Full spec table */}
            <details className="group rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
              <summary className="cursor-pointer list-none px-5 py-4 flex justify-between items-center gap-4 hover:bg-gray-800/50 transition-colors">
                <span className="font-semibold text-white">📑 คุณลักษณะเฉพาะ AED Amoul i7 (ตารางสเปกเต็ม)</span>
                <span className="text-yellow-400 text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="px-4 pb-6 pt-2">
                <p className="text-center text-gray-500 text-sm mb-6">สเปกของรุ่น Amoul i7 · สเปก PRIMEDIC ดูได้ที่หัวข้อ “เลือกยี่ห้อ” ด้านบน</p>
                <div className="rounded-2xl overflow-hidden border border-gray-700">
                  {specs.map((s, i) => (
                    <div key={s.label} className={`flex gap-4 px-6 py-4 ${i % 2 === 0 ? "bg-gray-900" : "bg-gray-800"}`}>
                      <div className="w-44 flex-shrink-0 text-sm font-semibold text-gray-500">{s.label}</div>
                      <div className="text-sm text-gray-200">{s.value}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-6">
                  {["CE Mark", "IP65", "ISO 13485", "EN 1789:2020", "ILCOR/AHA 2020-2025", "FDA"].map((cert) => (
                    <span key={cert} className="bg-yellow-400/10 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full border border-yellow-400/20">
                      ✓ {cert}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-3 justify-center">
                  <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-center">
                    <div className="text-xs text-gray-400 font-semibold">Amoul i7 — เลขที่ใบรับแจ้ง อย.</div>
                    <div className="text-sm font-bold text-yellow-400">{AMOUL_REGULATORY.fda}</div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-center">
                    <div className="text-xs text-gray-400 font-semibold">Amoul i7 — ใบอนุญาตโฆษณา</div>
                    <div className="text-sm font-bold text-yellow-400">ฆพ. {AMOUL_REGULATORY.adLicense}</div>
                  </div>
                  {PRIMEDIC_REGULATORY.published && PRIMEDIC_REGULATORY.fda && (
                    <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-center">
                      <div className="text-xs text-gray-400 font-semibold">PRIMEDIC — เลขที่ใบรับแจ้ง อย.</div>
                      <div className="text-sm font-bold text-yellow-400">{PRIMEDIC_REGULATORY.fda}</div>
                    </div>
                  )}
                  {PRIMEDIC_REGULATORY.published && PRIMEDIC_REGULATORY.adLicense && (
                    <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-center">
                      <div className="text-xs text-gray-400 font-semibold">PRIMEDIC — ใบอนุญาตโฆษณา</div>
                      <div className="text-sm font-bold text-yellow-400">ฆพ. {PRIMEDIC_REGULATORY.adLicense}</div>
                    </div>
                  )}
                </div>
              </div>
            </details>

            {/* Accessories / spare parts */}
            <details className="group rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
              <summary className="cursor-pointer list-none px-5 py-4 flex justify-between items-center gap-4 hover:bg-gray-800/50 transition-colors">
                <span className="font-semibold text-white">🔋 อุปกรณ์เสริม · ตู้ · อบรม CPR&amp;AED &amp; อะไหล่</span>
                <span className="text-yellow-400 text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="px-4 pb-6 pt-2">
                <p className="text-center text-gray-500 mb-8 max-w-2xl mx-auto">
                  ครบทั้งตู้จัดเก็บ คอร์สอบรม CPR &amp; AED สอนถึงที่ ชุดอุปกรณ์ฝึกสอน และอะไหล่ของแท้ (แผ่น Pad / แบตเตอรี่) สำหรับ AED Amoul i7 และ PRIMEDIC HeartSave — สั่งซื้อหรือสอบถามราคาได้ทาง LINE
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
          <p className="text-center text-gray-500 text-sm mb-8">FAQ — AED Amoul i7 และ PRIMEDIC HeartSave</p>
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
          <a href="#tech" className="hover:text-yellow-400 transition-colors">สเปก</a>
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
          จำหน่าย AED Amoul i7 และ PRIMEDIC HeartSave · Amoul i7: {regLine(AMOUL_REGULATORY)}
          {PRIMEDIC_REGULATORY.published ? ` · PRIMEDIC: ${regLine(PRIMEDIC_REGULATORY)}` : ""}
        </p>
        <p className="mt-3 text-xs text-gray-700">© {new Date().getFullYear()} JiaAED. All rights reserved.</p>
      </footer>

    </div>
  );
}
