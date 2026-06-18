import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SectionHeading } from "@/app/components/SectionHeading";
import { FeatureMatrix } from "@/app/components/FeatureMatrix";
import { RentVsBuyTable } from "@/app/components/RentVsBuyTable";
import { GpsBundleSection } from "@/app/components/GpsBundleSection";
import { CloudDashboardSection } from "@/app/components/CloudDashboardSection";
import { TrustStats } from "@/app/components/TrustStats";
import { FaqAccordion } from "@/app/components/FaqAccordion";
import { MiniLeadForm } from "@/app/components/MiniLeadForm";
import { PriceViewTracker } from "@/app/components/PriceViewTracker";
import { subscriptionFaqCategories } from "@/lib/aed/faqs";

export const revalidate = 3600;

const LINE_OA = "https://line.me/R/oaMessage/@jiacpr/?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%88+AED+%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A";

export const metadata: Metadata = {
  title: "เช่า AED รายเดือน — ดูแลครบวงจร เริ่ม ฿1,990/เดือน | JiaAED",
  description:
    "บริการเช่า AED สำหรับองค์กร พร้อมระบบดูแลครบวงจร — Yuwell GPS, Cloud Dashboard, แจ้งเตือนแบต/แผ่นหมดอายุ, เปลี่ยนเครื่องสำรอง และอบรมพนักงาน เลือกได้ 3 ระดับ BASIC / PREMIUM / ULTIMATE",
  alternates: { canonical: "/aed/subscription" },
  openGraph: {
    title: "เช่า AED รายเดือน ดูแลครบวงจร | JiaAED",
    description: "Safety Care — เช่า AED พร้อมทีมดูแล ระบบ GPS และ Cloud Dashboard มั่นใจเครื่องพร้อมใช้ 24 ชม.",
    url: "/aed/subscription",
    images: ["/images/product-main.png"],
    type: "website",
  },
};

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <SiteHeader />

      <div className="bg-yellow-400 text-yellow-900 text-center py-2 font-bold text-sm">
        ☁️ เช่า AED ดูแลครบวงจร — เริ่ม ฿1,990/เดือน* เมื่อ Turn เครื่องเดิม
      </div>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <SectionHeading
          badge="Safety Care — เช่าบริการครบวงจร"
          title="ระบบดูแล AED อัจฉริยะ สำหรับองค์กรยุคใหม่"
          subtitle='"เครื่องมีไว้ ไม่เท่ากับเครื่องพร้อมใช้" — เราดูแลความพร้อมให้ตลอดสัญญา พร้อมติดตามสถานะแบบ Real-time'
        />

        {/* GPS AED + Cloud Dashboard flyer */}
        <div className="mt-8 flex justify-center">
          <div className="rounded-2xl overflow-hidden border border-gray-800 w-full max-w-lg">
            <Image
              src="/images/yuwell-gps-flyer.png"
              alt="Yuwell GPS AED เช่า พร้อมระบบ Cloud Dashboard ติดตามสถานะ Real-time"
              width={1159}
              height={1358}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>

        <PriceViewTracker targetId="subscription-price" />
        <div id="subscription-price" className="mt-8">
          <FeatureMatrix />
        </div>
        <p className="text-center text-gray-600 text-xs mt-4">
          * ราคา/เดือน ยังไม่รวม VAT · BASIC พิเศษ ฿1,990/เดือน เมื่อนำเครื่องเดิมมาแลก
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
        <SectionHeading title="องค์กรกว่า 100 แห่งเลือกใช้บริการเช่า AED กับ JIA CPR" />
        <div className="mt-6">
          <TrustStats />
        </div>
      </section>

      {/* Lead form */}
      <section className="max-w-2xl mx-auto px-4 py-10">
        <SectionHeading title="ขอใบเสนอราคาเช่า AED สำหรับองค์กร" subtitle="ให้เราออกแบบโปรแกรมดูแล AED ที่เหมาะกับองค์กรของท่าน" />
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
        <SectionHeading title="คำถามที่พบบ่อย — เช่า AED" />
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

      <SiteFooter />
    </div>
  );
}
