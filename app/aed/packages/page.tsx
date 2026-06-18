import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SectionHeading } from "@/app/components/SectionHeading";
import { PackageCard } from "@/app/components/PackageCard";
import { TrustStats } from "@/app/components/TrustStats";
import { FaqAccordion } from "@/app/components/FaqAccordion";
import { RentVsBuyTable } from "@/app/components/RentVsBuyTable";
import { PriceViewTracker } from "@/app/components/PriceViewTracker";
import { MiniLeadForm } from "@/app/components/MiniLeadForm";
import { PromoBanner } from "@/app/components/PromoBanner";
import { acquisitionPackages } from "@/lib/aed/packages";
import { packageFaqCategories } from "@/lib/aed/faqs";
import { survivorReward } from "@/lib/aed/promotion";

export const revalidate = 3600;

const LINE_OA = "https://line.me/R/ti/p/@jiacpr";

export const metadata: Metadata = {
  title: "แพ็กเกจ AED + GPS — ซื้อขาด / เช่าได้ซื้อ / เช่าบริการ | JiaAED",
  description:
    "3 วิธีได้ AED มาใช้สำหรับองค์กร: Safety Premium (ซื้อขาด), Safety Start (เช่าแล้วได้ซื้อ), Safety Care (เช่าบริการครบวงจร) พร้อมระบบ GPS ตู้จัดเก็บ และการอบรม — ปรึกษาฟรี",
  alternates: { canonical: "/aed/packages" },
  openGraph: {
    title: "แพ็กเกจ AED + GPS สำหรับองค์กร | JiaAED",
    description: "เลือกแพ็กเกจความปลอดภัย AED ที่เหมาะกับธุรกิจคุณ — ซื้อขาด เช่าแล้วได้ซื้อ หรือเช่าบริการครบวงจร",
    url: "/aed/packages",
    images: ["/images/product-main.png"],
    type: "website",
  },
};

export default function PackagesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <SiteHeader />

      <div className="bg-yellow-400 text-yellow-900 text-center py-2 font-bold text-sm">
        🛟 เช่า-ซื้อ AED + GPS ครบวงจร — เลือกแพ็กเกจที่เหมาะกับองค์กรคุณ
      </div>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <SectionHeading
          badge="แพ็กเกจมาตรฐาน"
          title="3 วิธีได้ AED มาใช้ — สำหรับทุกความต้องการของธุรกิจ"
          subtitle="ทั้งแบบขายขาด, เช่าแล้วได้ซื้อ (Rent-to-Own) และบริการเช่าครบวงจร พร้อมระบบ GPS ในแพ็กเกจเดียว"
        />

        <PriceViewTracker targetId="packages-price" />
        <p className="text-center text-gray-500 text-sm mt-6 mb-6">ราคายังไม่รวม VAT · ออกใบกำกับภาษีได้</p>
        <div id="packages-price" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {acquisitionPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
        <p className="text-center text-gray-600 text-xs mt-4">
          * ราคาเป็นราคาเริ่มต้น อาจปรับตามจำนวนเครื่องและรูปแบบบริการ — ขอใบเสนอราคาเฉพาะองค์กรได้
        </p>
      </section>

      {/* ฿10,000 survivor-reward promotion */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <PromoBanner promo={survivorReward} />
      </section>

      {/* Rent vs buy */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        <SectionHeading title="เช่า หรือ ซื้อขาด แบบไหนคุ้มกว่า?" />
        <div className="mt-6">
          <RentVsBuyTable />
        </div>
        <div className="text-center mt-6">
          <Link
            href="/aed/subscription"
            className="inline-block bg-yellow-400/10 text-yellow-400 font-bold px-6 py-3 rounded-full border border-yellow-400/30 hover:bg-yellow-400/20"
          >
            ดูแพ็กเกจเช่าบริการ (BASIC / PREMIUM / ULTIMATE) →
          </Link>
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <SectionHeading title="องค์กรชั้นนำที่ไว้วางใจ JIA" />
        <div className="mt-6">
          <TrustStats />
        </div>
      </section>

      {/* Lead form */}
      <section className="max-w-2xl mx-auto px-4 py-6">
        <SectionHeading title="ขอใบเสนอราคา / ปรึกษาผู้เชี่ยวชาญฟรี" subtitle="ทีมงานติดต่อกลับภายใน 24 ชม." />
        <div className="mt-6">
          <MiniLeadForm variant="packages_mini" />
        </div>
        <p className="text-center text-gray-500 text-sm mt-4">
          ต้องการกรอกรายละเอียดองค์กร?{" "}
          <Link href="/quote" className="text-yellow-400 hover:text-yellow-300 font-medium">
            ขอใบเสนอราคาแบบเต็ม →
          </Link>
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <SectionHeading title="คำถามที่พบบ่อย" />
        <div className="mt-6">
          <FaqAccordion categories={packageFaqCategories} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center py-10 px-4">
        <p className="text-gray-400 text-sm mb-4">สนใจแพ็กเกจไหน หรืออยากให้ช่วยเลือก — ทักได้เลย</p>
        <a
          href={LINE_OA}
          target="_blank"
          rel="noopener noreferrer"
          data-line-cta="packages_footer"
          className="inline-block bg-[#06C755] text-white font-bold text-lg px-10 py-4 rounded-full hover:bg-[#05a847] shadow-2xl shadow-[#06C755]/40"
        >
          💬 ปรึกษาฟรีทาง LINE
        </a>
      </section>

      <SiteFooter />
    </div>
  );
}
