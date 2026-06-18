import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SectionHeading } from "@/app/components/SectionHeading";
import { TrustStats } from "@/app/components/TrustStats";
import { trustedBy, relatedRegulations } from "@/lib/aed/trust";

export const revalidate = 3600;

const LINE_OA = "https://line.me/R/ti/p/@jiacpr";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา — ดูแล AED กว่า 500 เครื่อง 15+ ปี | JiaAED",
  description:
    "เจี่ยรักษา (JIA CPR) ผู้นำเข้าและดูแล AED สำหรับองค์กร — ดูแลเครื่อง AED กว่า 500 เครื่อง องค์กรลูกค้ากว่า 400 แห่ง ประสบการณ์ 15+ ปี พร้อมข้อมูลกฎหมายและมาตรฐานที่เกี่ยวข้อง",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "เกี่ยวกับเรา | JiaAED",
    description: "ดูแล AED กว่า 500 เครื่อง · 400 องค์กร · 15+ ปี",
    url: "/about",
    images: ["/images/product-main.png"],
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <SiteHeader />

      <section className="max-w-6xl mx-auto px-4 py-10">
        <SectionHeading
          badge="เกี่ยวกับเรา"
          title="ปกป้องชีวิต พร้อมบริหารทรัพย์สิน"
          subtitle={trustedBy}
        />
        <div className="mt-8">
          <TrustStats />
        </div>

        <div className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-6 text-gray-300 leading-relaxed">
          <p>
            เจี่ยรักษา (JIA CPR) เป็นผู้นำเข้าและจัดจำหน่ายเครื่องมือแพทย์โดยตรง
            ดูแลเครื่อง AED ให้องค์กรทั่วประเทศมากกว่า 15 ปี ครอบคลุมทั้งการขายขาด
            เช่าแล้วได้ซื้อ และบริการเช่าดูแลครบวงจร พร้อมระบบติดตาม GPS และการอบรม CPR/AED
            โดยวิทยากรที่ผ่านการรับรอง — เพื่อให้ทุกองค์กรมั่นใจว่าเครื่อง “พร้อมใช้จริง”
            เมื่อเกิดเหตุฉุกเฉิน
          </p>
        </div>
      </section>

      {/* Related regulations */}
      <section className="max-w-4xl mx-auto px-4 py-6">
        <SectionHeading title="กฎหมายและมาตรฐานที่เกี่ยวข้อง" align="left" />
        <div className="space-y-3 mt-6">
          {relatedRegulations.map((r) => (
            <div key={r.title} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <h3 className="font-bold text-yellow-400 mb-1">{r.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{r.detail}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-4">
          * ข้อมูลข้างต้นเป็นแนวทางทั่วไป โปรดตรวจสอบข้อกำหนด/ประกาศล่าสุดของหน่วยงานที่เกี่ยวข้องประกอบการตัดสินใจ
        </p>
      </section>

      {/* CTA */}
      <section className="text-center py-10 px-4">
        <p className="text-gray-400 text-sm mb-4">อยากทราบว่าองค์กรของคุณควรมี AED กี่เครื่อง ติดตรงไหน?</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={LINE_OA}
            target="_blank"
            rel="noopener noreferrer"
            data-line-cta="about_footer"
            className="inline-block bg-[#06C755] text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-[#05a847] shadow-2xl shadow-[#06C755]/40"
          >
            💬 ปรึกษาผู้เชี่ยวชาญฟรี
          </a>
          <Link
            href="/quote"
            className="inline-block bg-yellow-400/10 text-yellow-400 font-bold text-lg px-8 py-4 rounded-full border border-yellow-400/30 hover:bg-yellow-400/20"
          >
            📋 ขอใบเสนอราคา
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
