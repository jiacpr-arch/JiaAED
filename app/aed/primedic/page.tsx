import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SectionHeading } from "@/app/components/SectionHeading";
import { SpecComparisonTable } from "@/app/components/SpecComparisonTable";
import { MiniLeadForm } from "@/app/components/MiniLeadForm";
import { PriceViewTracker } from "@/app/components/PriceViewTracker";
import { primedicModels, PRIMEDIC_REGULATORY } from "@/lib/aed/primedic";

export const revalidate = 3600;

const LINE_OA = "https://line.me/R/ti/p/@273fzpzs";

// noindex until PRIMEDIC has its own อย./ฆพ. — see PRIMEDIC_REGULATORY.
// TODO(owner): set index:true once real registration numbers are published.
export const metadata: Metadata = {
  title: "PRIMEDIC HeartSave Y0 / Y8 / YA0 / YA8 — AED รุ่นพรีเมียม | JiaAED",
  description:
    "PRIMEDIC HeartSave ไลน์ AED พรีเมียม — รุ่นกึ่งอัตโนมัติและอัตโนมัติเต็มระบบ พร้อมเซ็นเซอร์ CPR feedback เปรียบเทียบสเปกทั้ง 4 รุ่น",
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
          title="PRIMEDIC HeartSave — Y0 / Y8 / YA0 / YA8"
          subtitle="เครื่องกระตุกหัวใจไฟฟ้าอัตโนมัติ ออกแบบใช้งานง่าย พร้อมเสียงนำทาง CPR และเซ็นเซอร์ feedback"
        />

        <div className="grid md:grid-cols-2 gap-8 items-center mt-8">
          <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-gray-800 bg-white">
            <Image
              src="/images/primedic-heartsave.png"
              alt="PRIMEDIC HeartSave AED"
              fill
              className="object-contain p-6"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          <div className="space-y-4">
            <p className="text-gray-300">
              เลือกได้ตามการใช้งาน — รุ่น <span className="text-yellow-400 font-semibold">Y0/Y8</span>{" "}
              กึ่งอัตโนมัติ (มีปุ่ม Shock) และรุ่น{" "}
              <span className="text-yellow-400 font-semibold">YA0/YA8</span> อัตโนมัติเต็มระบบ
              ส่วนรุ่น <span className="text-yellow-400 font-semibold">Y8/YA8</span> มาพร้อมเซ็นเซอร์
              CPR feedback มาตรฐาน
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

      {/* Spec comparison */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        <PriceViewTracker targetId="primedic-specs" />
        <div id="primedic-specs">
          <SectionHeading title="เปรียบเทียบสเปกทั้ง 4 รุ่น" />
          <div className="mt-6">
            <SpecComparisonTable />
          </div>
        </div>
      </section>

      {/* Model quick cards */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {primedicModels.map((m) => (
            <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="font-bold text-white">{m.name}</div>
              <div className="text-xs text-gray-400 mt-1">{m.summary}</div>
            </div>
          ))}
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
