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
import { PRIMEDIC_REGULATORY } from "@/lib/aed/primedic";
import { survivorReward } from "@/lib/aed/promotion";

export const revalidate = 3600;

const LINE_OA = "https://line.me/R/ti/p/@273fzpzs";

// noindex until PRIMEDIC has its own อย./ฆพ. — see PRIMEDIC_REGULATORY.
// TODO(owner): set index:true once real registration numbers are published.
export const metadata: Metadata = {
  title: "PRIMEDIC HeartSave Y0 / Y8 — AED รุ่นพรีเมียม | JiaAED",
  description:
    "PRIMEDIC HeartSave ไลน์ AED พรีเมียม รุ่นกึ่งอัตโนมัติ Y0 (฿39,000) และ Y8 (฿49,999) พร้อมเซ็นเซอร์ CPR feedback และ Yuwell AED รุ่นมี GPS ในตัว",
  alternates: { canonical: "/aed/primedic" },
  robots: { index: false, follow: true },
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
              src="/images/primedic-open.png"
              alt="PRIMEDIC HeartSave AED"
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

        {/* Regulatory disclaimer — PRIMEDIC needs its own อย./ฆพ. */}
        <div className="mt-6 rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-4 py-3 text-sm text-yellow-200/90">
          ⚠️ {PRIMEDIC_REGULATORY.disclaimer}
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

      <SiteFooter regNote={`PRIMEDIC HeartSave — ${PRIMEDIC_REGULATORY.disclaimer}`} />
    </div>
  );
}
