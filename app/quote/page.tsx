import type { Metadata } from "next";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SectionHeading } from "@/app/components/SectionHeading";
import { QuoteForm } from "@/app/components/QuoteForm";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "ขอใบเสนอราคา AED สำหรับองค์กร | JiaAED",
  description:
    "กรอกข้อมูลองค์กร จำนวนเครื่อง AED ที่ต้องการ และความต้องการพิเศษ — ทีมงานจัดทำ Proposal และติดต่อกลับโดยเร็วที่สุด รับใบเสนอราคาภายใน 24 ชั่วโมง",
  alternates: { canonical: "/quote" },
  openGraph: {
    title: "ขอใบเสนอราคา AED สำหรับองค์กร | JiaAED",
    description: "รับใบเสนอราคา AED ภายใน 24 ชั่วโมง",
    url: "/quote",
    images: ["/images/yuwell-y2-main.jpg"],
    type: "website",
  },
};

export default function QuotePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <SiteHeader />

      <section className="max-w-2xl mx-auto px-4 py-12">
        <SectionHeading
          as="h1"
          badge="ขอใบเสนอราคา"
          title="ขอรับข้อเสนอระบบดูแล AED สำหรับองค์กร"
          subtitle="เพื่อให้เราออกแบบโปรแกรมดูแล AED ที่เหมาะกับองค์กรของท่าน กรุณากรอกข้อมูลเบื้องต้น"
        />
        <div className="mt-8">
          <QuoteForm variant="quote_form" />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
