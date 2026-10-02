import { MarketPage, MarketHero, MarketButton } from "@/app/components/MarketShell";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/app/components/SectionHeading";
import { FeatureMatrix } from "@/app/components/FeatureMatrix";
import { RentVsBuyTable } from "@/app/components/RentVsBuyTable";
import { GpsBundleSection } from "@/app/components/GpsBundleSection";
import { CloudDashboardSection } from "@/app/components/CloudDashboardSection";
import { TrustStats } from "@/app/components/TrustStats";
import { FaqAccordion } from "@/app/components/FaqAccordion";
import { MiniLeadForm } from "@/app/components/MiniLeadForm";
import { PriceViewTracker } from "@/app/components/PriceViewTracker";
import { BreadcrumbStructuredData } from "@/app/components/StructuredData";
import { subscriptionFaqCategories } from "@/lib/aed/faqs";
import { trustedBy } from "@/lib/aed/trust";

export const revalidate = 3600;

import { LINE_OA } from "@/lib/aed/line";

export const metadata: Metadata = {
  title: "บริการดูแล AED ครบวงจร (Safety Care) — เริ่ม ฿2,990/เดือน | JiaAED",
  description:
    "บริการดูแล AED ครบวงจรสำหรับองค์กร (Safety Care) — รวมเครื่อง AED — Yuwell GPS, Cloud Dashboard, แจ้งเตือนแบต/แผ่นหมดอายุ, เปลี่ยนเครื่องสำรอง และอบรมพนักงาน เลือกได้ 3 ระดับ BASIC / PRO / ELITE",
  alternates: { canonical: "/aed/subscription" },
  openGraph: {
    title: "บริการดูแล AED ครบวงจร (Safety Care) | JiaAED",
    description: "Safety Care — บริการดูแล AED รวมเครื่อง พร้อมทีมดูแล ระบบ GPS และ Cloud Dashboard มั่นใจเครื่องพร้อมใช้ 24 ชม.",
    url: "/aed/subscription",
    images: ["/images/og-cover.png"],
    type: "website",
  },
};

export default function SubscriptionPage() {
  return (
    <MarketPage>
      <MarketHero eyebrow="Safety Care — บริการดูแล AED ครบวงจร" title={"ระบบดูแล AED\nพร้อมใช้ตลอดสัญญา."} description='"เครื่องมีไว้ ไม่เท่ากับเครื่องพร้อมใช้" — เราดูแลความพร้อมให้ตลอดสัญญา พร้อมติดตามสถานะแบบ Real-time'><MarketButton href="/quote" lineCta="inner_hero_quote">ขอใบเสนอราคา</MarketButton><MarketButton href="/aed" secondary>เทียบรุ่นและราคา</MarketButton></MarketHero>
      <div className="market-content">
      <BreadcrumbStructuredData
        items={[
          { name: "หน้าแรก", path: "/" },
          { name: "เช่าบริการครบวงจร (ดูแลครบ)", path: "/aed/subscription" },
        ]}
      />



      <section className="max-w-6xl mx-auto px-4 py-10">

        {/* GPS AED + Cloud Dashboard flyer + the 4 things the service actually does */}
        <div className="mt-8 grid md:grid-cols-2 gap-8 items-center">
          <div className="rounded-2xl overflow-hidden border border-gray-800">
            <Image
              src="/images/yuwell-gps-flyer.png"
              alt="Yuwell GPS AED เช่า พร้อมระบบ Cloud Dashboard ติดตามสถานะ Real-time"
              width={1159}
              height={1358}
              className="w-full h-auto"
              priority
            />
          </div>
          <div className="space-y-3">
            {[
              { icon: "📡", title: "GPS + Cloud Dashboard", desc: "เห็นตำแหน่งและสถานะเครื่องทุกจุดในหน้าจอเดียว แบบ Real-time" },
              { icon: "🔔", title: "แจ้งเตือนอัตโนมัติ", desc: "แบตเตอรี่/แผ่นอิเล็กโทรดใกล้หมดอายุ ระบบเตือนก่อนเสมอ" },
              { icon: "♻️", title: "เครื่องสำรองถ้าเสีย", desc: "เปลี่ยนเครื่องให้ภายใน 24–48 ชม. ไม่มีช่วงที่จุดติดตั้งไม่มีเครื่อง" },
              { icon: "🎓", title: "อบรมพนักงานถึงที่", desc: "ทีม BLS Instructor สอนการใช้ AED + CPR ให้ทีมงานของคุณ" },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-3 rounded-2xl border border-gray-800 bg-gray-900 p-4">
                <span className="text-2xl leading-none mt-0.5">{b.icon}</span>
                <div>
                  <div className="font-bold text-white">{b.title}</div>
                  <div className="text-sm text-gray-400 mt-0.5">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <PriceViewTracker targetId="subscription-price" />
        <div id="subscription-price" className="mt-8">
          <FeatureMatrix />
        </div>
        <p className="text-center text-gray-600 text-xs mt-4">
          * ราคา/เดือน ยังไม่รวม VAT · สัญญา 1 ปี · มัดจำ ฿5,000 (คืนเมื่อจบสัญญา)
        </p>
      </section>

      {/* GPS */}
      <div className="py-6">
        <GpsBundleSection />
      </div>

      {/* Cloud dashboard */}
      <div className="py-6">
        <CloudDashboardSection />
      </div>

      {/* Rent vs buy */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <SectionHeading
          title="เช่า หรือ ซื้อขาด แบบไหนคุ้มกว่าสำหรับองค์กร?"
        />
        <div className="mt-6">
          <RentVsBuyTable />
        </div>
        <div className="text-center mt-6">
          <Link
            href="/aed/packages"
            className="inline-block bg-yellow-400/10 text-yellow-400 font-bold px-6 py-3 rounded-full border border-yellow-400/30 hover:bg-yellow-400/20"
          >
            ดูทางเลือกซื้อขาด / เช่าแล้วได้ซื้อ →
          </Link>
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        <SectionHeading title={trustedBy} />
        <div className="mt-6">
          <TrustStats />
        </div>
      </section>

      {/* Lead form */}
      <section className="max-w-2xl mx-auto px-4 py-10">
        <SectionHeading title="ขอใบเสนอราคาบริการดูแล AED สำหรับองค์กร" subtitle="ให้เราออกแบบโปรแกรมดูแล AED ที่เหมาะกับองค์กรของท่าน" />
        <div className="mt-6">
          <MiniLeadForm variant="subscription_mini" />
        </div>
        <p className="text-center text-gray-500 text-sm mt-4">
          ต้องการระบุจำนวนเครื่อง/รายละเอียดองค์กร?{" "}
          <Link href="/quote" className="text-yellow-400 hover:text-yellow-300 font-medium">
            ขอใบเสนอราคาแบบเต็ม →
          </Link>
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <SectionHeading title="คำถามที่พบบ่อย — บริการดูแล AED ครบวงจร" />
        <div className="mt-6">
          <FaqAccordion categories={subscriptionFaqCategories} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center py-10 px-4">
        <p className="text-gray-400 text-sm mb-4">ให้เราช่วยประเมินจำนวนเครื่อง AED ที่เหมาะกับองค์กรของคุณ</p>
        <a
          href={LINE_OA}
          target="_blank"
          rel="noopener noreferrer"
          data-line-cta="subscription_footer"
          className="inline-block bg-[#06C755] text-white font-bold text-lg px-10 py-4 rounded-full hover:bg-[#05a847] shadow-2xl shadow-[#06C755]/40"
        >
          💬 ปรึกษาผู้เชี่ยวชาญฟรี
        </a>
      </section>

      </div>
    </MarketPage>
  );
}
