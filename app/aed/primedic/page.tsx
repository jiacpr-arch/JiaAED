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

const LINE_OA = "https://line.me/R/oaMessage/@jiacpr/?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%88+AED+%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A";

// Indexing follows the PRIMEDIC registration gate (PRIMEDIC_REGULATORY.published).
// Live now under อย. 65-2-2-2-0013415; ฆพ. (advertising licence) to be added later.
export const metadata: Metadata = {
  title: "PRIMEDIC HeartSave Y0 / Y8 — AED รุ่นพรีเมียม | JiaAED",
  description:
    "PRIMEDIC HeartSave ไลน์ AED พรีเมียม รุ่นกึ่งอัตโนมัติ Y0 (฿39,000) และ Y8 (฿49,999) พร้อมเซ็นเซอร์ CPR feedback และ Yuwell AED รุ่นมี GPS ในตัว",
  alternates: { canonical: "/aed/primedic" },
  robots: { index: PRIMEDIC_REGULATORY.published, follow: true },
};

export default function PrimedicPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <SiteHeader />

      <section className="max-w-6xl mx-auto px-4 py-10">
        <SectionHeading
          badge="✨ ไลน์พรีเมียม"
          title="PRIMEDIC HeartSave — Y0 / Y8"
          subtitle="เครื่องกระตุกหัวใจไฟฟ้ากึ่งอัตโนมัติ ใช้งานง่าย พร้อมเสียงนำทาง CPR และเซ็นเซอร์ feedback"
        />

        <div className="grid md:grid-cols-2 gap-8 items-center mt-8">
          <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-gray-800 bg-white">
            <Image
              src="/images/primedic-kit.png"
              alt="PRIMEDIC HeartSave AED พร้อมแผ่นแปะอิเล็กโทรด"
              fill
              className="object-contain p-6"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          <div className="space-y-4">
            <p className="text-gray-300">
              ทั้งสองรุ่นเป็นแบบ <span className="text-yellow-400 font-semibold">กึ่งอัตโนมัติ</span>{" "}
              (มีปุ่ม Shock) — รุ่น <span className="text-yellow-400 font-semibold">Y0 ฿39,000</span>{" "}
              เซ็นเซอร์ CPR feedback เป็นตัวเลือก ส่วนรุ่น{" "}
              <span className="text-yellow-400 font-semibold">Y8 ฿49,999</span> มาพร้อมเซ็นเซอร์ CPR
              feedback มาตรฐาน
            </p>
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

        {/* Flyer gallery — Y0 / Y8 marketing materials */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-2">
          {[
            { src: "/images/primedic-y0-flyer-b.png", alt: "PRIMEDIC HeartSave Y0 — ใบปลิวสินค้า", w: 1254, h: 1254 },
            { src: "/images/primedic-y8-flyer.png",   alt: "PRIMEDIC HeartSave Y8 — ใบปลิวสินค้า", w: 1254, h: 1254 },
            { src: "/images/primedic-y0-flyer-a.png", alt: "PRIMEDIC Y0 — แผ่นอิเล็กโทรดและชุดพร้อมใช้", w: 1254, h: 1254 },
            { src: "/images/primedic-y0-promo.png",   alt: "Yuwell HeartSave Y0 — โปรโมชั่นและอบรม CPR", w: 1024, h: 1536 },
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
