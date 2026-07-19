import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SectionHeading } from "@/app/components/SectionHeading";
import { SpecComparisonTable } from "@/app/components/SpecComparisonTable";
import { PrimedicLineup } from "@/app/components/PrimedicLineup";
import { PromoBanner } from "@/app/components/PromoBanner";
import { MiniLeadForm } from "@/app/components/MiniLeadForm";
import { PriceViewTracker } from "@/app/components/PriceViewTracker";
import { PRIMEDIC_REGULATORY, regLine } from "@/lib/aed/regulatory";
import { primedicCertifications } from "@/lib/aed/primedic";
import { survivorReward } from "@/lib/aed/promotion";

export const revalidate = 3600;

import { LINE_OA } from "@/lib/aed/line";
import { ProductStructuredData } from "@/app/components/StructuredData";

// Indexing follows the PRIMEDIC registration gate (PRIMEDIC_REGULATORY.published).
// Live under อย. 65-2-2-2-0013415 + ฆพ.2475/2569 (Y0/Y2) / ฆพ.287/2567 (Y8) —
// numbers live in lib/aed/regulatory.ts.
export const metadata: Metadata = {
  title: "PRIMEDIC HeartSave Y0 / Y8 / Yuwell Y2 — AED รุ่นพรีเมียม | JiaAED",
  description:
    "ไลน์ AED พรีเมียม กึ่งอัตโนมัติ — Y0 (฿39,999), Y8 (฿44,900) พร้อมเซ็นเซอร์ CPR feedback และรุ่นเรือธง Yuwell Y2 (฿59,999) จอสี EKG ดูคุณภาพ CPR สด ๆ",
  alternates: { canonical: "/aed/primedic" },
  robots: { index: PRIMEDIC_REGULATORY.published, follow: true },
};

export default function PrimedicPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <ProductStructuredData include="primedic" />
      <SiteHeader />

      <section className="max-w-6xl mx-auto px-4 py-10">
        <SectionHeading
          as="h1"
          badge="✨ ไลน์พรีเมียม"
          title="PRIMEDIC HeartSave — Y0 / Y8 / Yuwell Y2"
          subtitle="เครื่องกระตุกหัวใจไฟฟ้ากึ่งอัตโนมัติ ใช้งานง่าย พร้อมเสียงนำทาง CPR และเซ็นเซอร์ feedback — รุ่นเรือธง Y2 มีจอ EKG ดูคุณภาพ CPR สด ๆ"
        />

        <div className="grid md:grid-cols-2 gap-8 items-center mt-8">
          <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-gray-800 bg-white">
            <Image
              src="/images/primedic-y-open-pads.webp"
              alt="PRIMEDIC HeartSave เปิดฝา พร้อมแผ่นอิเล็กโทรดผู้ใหญ่และเด็ก"
              fill
              className="object-contain p-6"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              ทุกรุ่นเป็นแบบ <span className="text-yellow-400 font-semibold">กึ่งอัตโนมัติ</span> (มีปุ่ม Shock)
            </p>
            {/* Same facts as the old paragraph, one scannable row per model */}
            <ul className="space-y-2">
              {(
                [
                  { model: "Y0", price: "฿39,999", diff: "เซ็นเซอร์ CPR feedback เป็นตัวเลือก" },
                  { model: "Y8", price: "฿44,900", diff: "เซ็นเซอร์ CPR feedback มาตรฐาน" },
                  { model: "Yuwell Y2", price: "฿59,999", diff: "รุ่นเรือธง — จอสี EKG ดูคุณภาพ CPR สด ๆ (ความเร็ว/ความลึก/full recoil)", href: "/aed/yuwell-y2" },
                ] as { model: string; price: string; diff: string; href?: string }[]
              ).map((m) => (
                <li key={m.model} className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3">
                  <span className="flex-shrink-0 font-black text-yellow-400 w-20">{m.model}</span>
                  <span className="flex-shrink-0 font-bold text-white w-20">{m.price}</span>
                  <span className="text-sm text-gray-300">
                    {m.diff}
                    {m.href && (
                      <>
                        {" "}
                        <Link href={m.href} className="text-yellow-400 hover:text-yellow-300 font-semibold whitespace-nowrap">
                          ดูรายละเอียดรุ่นนี้ →
                        </Link>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="primedic_hero"
              data-product="primedic-y8"
              className="inline-block bg-[#06C755] text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-[#05a847] shadow-2xl shadow-[#06C755]/40"
            >
              💬 สอบถามราคา / กำหนดวางจำหน่าย
            </a>
          </div>
        </div>

        {/* Regulatory line — real อย./ฆพ. once published, else a neutral pending note.
            When published, the importer/valid-until disclaimer rides along as a sub-line. */}
        {PRIMEDIC_REGULATORY.published ? (
          <div className="mt-6 rounded-xl border border-green-400/30 bg-green-400/5 px-4 py-3 text-sm text-green-200/90">
            ✅ PRIMEDIC HeartSave — {regLine(PRIMEDIC_REGULATORY)}
            {PRIMEDIC_REGULATORY.disclaimer && (
              <span className="mt-1 block text-green-200/70">{PRIMEDIC_REGULATORY.disclaimer}</span>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-4 py-3 text-sm text-yellow-200/90">
            ⚠️ {PRIMEDIC_REGULATORY.pendingNote}
          </div>
        )}

        {/* Y2 ใบปลิวทางการ (ฆพ.2475/2569) — โชว์ใหญ่เด่นเป็นพิเศษ แยกจากแกลเลอรีปกติ */}
        <div className="mt-8 max-w-sm mx-auto">
          <div className="rounded-xl overflow-hidden border-2 border-yellow-400/40 bg-white">
            <Image
              src="/images/primedic-y2-flyer-khop.jpg"
              alt="Yuwell Y2 — ใบปลิวทางการ พร้อมเลขใบอนุญาตโฆษณา ฆพ.2475/2569"
              width={4749}
              height={5174}
              className="w-full h-auto"
            />
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">ใบปลิวทางการที่ได้รับอนุมัติ — ฆพ.2475/2569</p>
        </div>

        {/* Flyer gallery — Y0 / Y8 / Y2 marketing materials, khop = official ฆพ.-stamped
            flyers (ฆพ.2475/2569 Y0/Y2, ฆพ.287/2567 Y8) supplied by the owner ก.ค. 2026 */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2">
          {[
            { src: "/images/primedic-y2-open.jpg",       alt: "Yuwell Y2 — เปิดฝาแสดงจอ EKG พร้อมแผ่นอิเล็กโทรด (รุ่นเรือธง)", w: 1254, h: 1254 },
            { src: "/images/primedic-y2-electrodes.jpg",  alt: "Yuwell Y2 — แผ่นอิเล็กโทรดในช่องเก็บด้านในฝาเครื่อง", w: 1254, h: 1254 },
            // primedic-y2-vital-launch.webp ถูกถอดออกชั่วคราว — โปสเตอร์ฝังราคาเก่า
            // ฿59,000 (ราคาใหม่ ฿59,999) ใส่กลับเมื่อเจ้าของทำเวอร์ชันราคาใหม่
            { src: "/images/yuwell-y2-features.webp", alt: "Yuwell Y2 — สรุปจุดเด่น หน้าจอสี วิเคราะห์และช็อกได้รวดเร็ว ใช้ได้ทุกวัย", w: 1536, h: 1024 },
            { src: "/images/primedic-y0-flyer-khop.jpg", alt: "PRIMEDIC HeartSave Y0 — ใบปลิวทางการ พร้อมเลขใบอนุญาตโฆษณา ฆพ.2475/2569", w: 1957, h: 2142 },
            { src: "/images/primedic-y8-flyer-khop.jpg", alt: "PRIMEDIC HeartSave Y8 — ใบปลิวทางการ พร้อมเลขใบอนุญาตโฆษณา ฆพ.287/2567", w: 1957, h: 2143 },
          ].map((img) => (
            <div key={img.src} className="rounded-xl overflow-hidden border border-gray-800 bg-white">
              <Image
                src={img.src}
                alt={img.alt}
                width={img.w}
                height={img.h}
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>

        {/* Certifications — ISO 13485 / CE / อย. (from the official Yuwell docs) */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {primedicCertifications.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-gray-800 bg-gray-900 px-3 py-3 text-center"
            >
              <div className="text-base font-extrabold text-white">{c.label}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* ใบอนุญาตโฆษณา ฆพ. ตัวจริงจาก อย. — สำหรับผู้ซื้อภาครัฐ/องค์กรที่ต้องตรวจสอบ */}
        <div className="mt-4">
          <h2 className="text-sm font-bold text-gray-300 mb-2">ใบอนุญาตโฆษณาเครื่องมือแพทย์ (ฆพ.) ฉบับจริง</h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/documents/khop-2475-2569-y0-y2.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-center hover:border-yellow-400/50 transition-colors"
            >
              <div className="text-sm font-bold text-white">ฆพ.2475/2569</div>
              <div className="text-[11px] text-gray-400 mt-0.5">HeartSave Y0 / Yuwell Y2 · ดูใบอนุญาตฉบับเต็ม →</div>
            </a>
            <a
              href="/documents/khop-287-2567-y8.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-center hover:border-yellow-400/50 transition-colors"
            >
              <div className="text-sm font-bold text-white">ฆพ.287/2567</div>
              <div className="text-[11px] text-gray-400 mt-0.5">HeartSave Y8 · ดูใบอนุญาตฉบับเต็ม →</div>
            </a>
          </div>
        </div>
      </section>

      {/* ฿10,000 survivor-reward promotion */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <PromoBanner promo={survivorReward} />
      </section>

      {/* 3-way lineup — Y0 vs Y8 vs GPS, each with its key difference called out */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        <SectionHeading
          title="3 รุ่นต่างกันยังไง?"
          subtitle="เลือกให้เหมาะกับการใช้งานและงบประมาณ — ดูจุดต่างของแต่ละรุ่นได้ที่นี่"
        />
        <div className="mt-6">
          <PrimedicLineup />
        </div>
      </section>

      {/* Detailed spec comparison (Y0 vs Y8) */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        <PriceViewTracker targetId="primedic-specs" />
        <div id="primedic-specs">
          <SectionHeading title="เปรียบเทียบสเปกละเอียด — Y0 vs Y8" />
          {/* Manufacturer features infographic — the picture version of the table below */}
          <div className="mt-6 max-w-2xl mx-auto rounded-2xl overflow-hidden border border-gray-800">
            <Image
              src="/images/primedic-features-infographic.png"
              alt="สรุปฟีเจอร์ PRIMEDIC HeartSave — พลังงาน 200–360J ผู้ใหญ่ / 50–100J เด็ก, จอ 4.3 และ 7 นิ้ว, ชุดอุปกรณ์ฉุกเฉิน, แบตเตอรี่ 5 ปี, ประกัน 8 ปี"
              width={1092}
              height={1993}
              className="w-full h-auto"
            />
          </div>
          <div className="mt-6">
            <SpecComparisonTable />
          </div>
        </div>
      </section>

      {/* Lead form */}
      <section className="max-w-2xl mx-auto px-4 py-10">
        <SectionHeading title="สนใจ PRIMEDIC HeartSave?" subtitle="ฝากเบอร์ไว้ ทีมงานติดต่อกลับพร้อมราคาและกำหนดวางจำหน่าย" />
        <div className="mt-6">
          <MiniLeadForm variant="primedic_mini" />
        </div>
        <p className="text-center text-gray-500 text-sm mt-4">
          ดู{" "}
          <Link href="/aed/packages" className="text-yellow-400 hover:text-yellow-300 font-medium">
            แพ็กเกจ AED + GPS
          </Link>{" "}
          หรือ{" "}
          <Link href="/aed/subscription" className="text-yellow-400 hover:text-yellow-300 font-medium">
            บริการเช่ารายเดือน
          </Link>
        </p>
      </section>

      <SiteFooter regNote={`PRIMEDIC HeartSave — ${regLine(PRIMEDIC_REGULATORY)}`} />
    </div>
  );
}
