import type { Metadata } from "next";
import Image from "next/image";
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

      <section className="max-w-5xl mx-auto px-4 py-12">
        <SectionHeading
          as="h1"
          badge="ขอใบเสนอราคา"
          title="ขอรับข้อเสนอระบบดูแล AED สำหรับองค์กร"
          subtitle="เพื่อให้เราออกแบบโปรแกรมดูแล AED ที่เหมาะกับองค์กรของท่าน กรุณากรอกข้อมูลเบื้องต้น"
        />
        <div className="mt-8 grid md:grid-cols-[1fr_300px] gap-8 items-start">
          <QuoteForm variant="quote_form" />

          {/* Why it's safe to leave your details — shown, not just claimed */}
          <aside className="hidden md:block sticky top-24 space-y-4">
            <div className="rounded-2xl overflow-hidden border border-gray-800 bg-white">
              <Image
                src="/images/primedic-heartsave.png"
                alt="เครื่อง AED PRIMEDIC HeartSave"
                width={520}
                height={520}
                className="w-full h-auto"
              />
            </div>
            <ul className="space-y-2">
              {[
                { icon: "⏱️", text: "รับใบเสนอราคาภายใน 24 ชม." },
                { icon: "🏅", text: "สินค้าทะเบียน อย. ตรวจสอบได้" },
                { icon: "🧾", text: "ออกใบกำกับภาษี รองรับจัดซื้อองค์กร/ราชการ" },
              ].map((t) => (
                <li key={t.text} className="flex items-start gap-2.5 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-300">
                  <span className="text-lg leading-none">{t.icon}</span>
                  <span>{t.text}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
