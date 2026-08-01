import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PhotoStrip } from "@/app/components/PhotoStrip";
import { PageHero } from "@/app/components/PageHero";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SectionHeading } from "@/app/components/SectionHeading";
import { TrustStats } from "@/app/components/TrustStats";
import { trustedBy, relatedRegulations } from "@/lib/aed/trust";

export const revalidate = 3600;

import { LINE_OA } from "@/lib/aed/line";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา — ดูแล AED กว่า 500 เครื่อง 15+ ปี | JiaAED",
  description:
    "เจี่ยรักษา (JIA CPR) ผู้นำเข้าและดูแล AED สำหรับองค์กร — ดูแลเครื่อง AED กว่า 500 เครื่อง องค์กรลูกค้ากว่า 400 แห่ง ประสบการณ์ 15+ ปี พร้อมข้อมูลกฎหมายและมาตรฐานที่เกี่ยวข้อง",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "เกี่ยวกับเรา | JiaAED",
    description: "ดูแล AED กว่า 500 เครื่อง · 400 องค์กร · 15+ ปี",
    url: "/about",
    images: ["/images/yuwell-y2-main.jpg"],
    type: "website",
  },
};

// What we do — each card is a door into the page that sells that service.
const SERVICES = [
  {
    icon: "🛒",
    title: "ขายขาด & เช่าแล้วได้ซื้อ",
    desc: "แพ็กเกจ AED พร้อมตู้ GPS และการอบรม — จ่ายก้อนเดียวหรือผ่อนแล้วได้เครื่อง",
    href: "/aed/packages",
    label: "ดูแพ็กเกจ",
  },
  {
    icon: "☁️",
    title: "เช่าบริการครบวงจร",
    desc: "GPS + Cloud Dashboard แจ้งเตือนแบต/แผ่นหมดอายุ พร้อมเครื่องสำรองถ้าเสีย",
    href: "/aed/subscription",
    label: "ดูบริการเช่า",
  },
  {
    icon: "🎓",
    title: "อบรม CPR & AED",
    desc: "วิทยากรผ่าน BLS Instructor Course สอนถึงที่ ทั้งภาครัฐและเอกชน",
    href: "/training",
    label: "ดูหลักสูตร",
  },
  {
    icon: "📄",
    title: "เอกสารจัดซื้อ & TOR",
    desc: "สเปคทางเทคนิค ใบทะเบียน อย. และใบรับรองมาตรฐาน พร้อมใช้ยื่นจัดซื้อ",
    href: "/docs",
    label: "ดาวน์โหลดเอกสาร",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <SiteHeader />

      <PageHero
        badge="🏥 เกี่ยวกับเรา"
        title="ปกป้องชีวิต พร้อมบริหารทรัพย์สิน"
        subtitle={trustedBy}
        backgroundImage="/images/lifestyle-cpr.png"
        chips={[
          "นำเข้าและจัดจำหน่ายโดยตรง ไม่ผ่านคนกลาง",
          "ทะเบียน อย. ตรวจสอบได้",
          "ทีมเทคนิคไทยดูแลหลังการขาย",
        ]}
      />

      {/* Headline numbers right under the hero — the strongest proof first */}
      <section className="border-b border-gray-800 bg-gray-900/50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <TrustStats />
        </div>
      </section>

      {/* Who we are */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-gray-800">
            <Image
              src="/images/training-bls-2.jpg"
              alt="ทีมงานเจี่ยรักษาอบรม CPR และการใช้ AED ให้องค์กร"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div>
            <SectionHeading
              align="left"
              badge="เจี่ยรักษา คือใคร"
              title="ดูแล AED ให้องค์กรทั่วประเทศ มามากกว่า 15 ปี"
            />
            <p className="text-gray-300 leading-relaxed mt-4">
              เจี่ยรักษา (JIA CPR) เป็นผู้นำเข้าและจัดจำหน่ายเครื่องมือแพทย์โดยตรง
              ครอบคลุมทั้งการขายขาด เช่าแล้วได้ซื้อ และบริการเช่าดูแลครบวงจร
              พร้อมระบบติดตาม GPS และการอบรม CPR/AED โดยวิทยากรที่ผ่านการรับรอง
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              เพราะเราเชื่อว่า{" "}
              <strong className="text-yellow-400">
                &ldquo;เครื่องมีไว้ ไม่เท่ากับเครื่องพร้อมใช้&rdquo;
              </strong>{" "}
              — ทุกบริการของเราจึงออกแบบมาเพื่อให้องค์กรมั่นใจว่าเครื่องพร้อมใช้จริง
              เมื่อเกิดเหตุฉุกเฉิน
            </p>
          </div>
        </div>
      </section>

      {/* What we do — 4 doors into the rest of the site */}
      <section className="border-t border-gray-900 bg-gray-900/30 py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            badge="บริการของเรา"
            title="ครบทุกเรื่อง AED ในที่เดียว"
            subtitle="ตั้งแต่เลือกเครื่อง ติดตั้ง อบรม ไปจนถึงดูแลให้พร้อมใช้ตลอดอายุการใช้งาน"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {SERVICES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group flex flex-col rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-yellow-400/40 hover:bg-gray-800/60 transition-colors"
              >
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4 flex-1">{s.desc}</p>
                <span className="text-sm font-semibold text-yellow-400 group-hover:text-yellow-300">
                  {s.label} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Our work, in photos */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <SectionHeading
          badge="ผลงานจริง"
          title="เราลงพื้นที่จริง — ไม่ใช่แค่ส่งของ"
          subtitle="สาธิต ติดตั้ง และอบรมถึงหน่วยงาน โดยทีมงานของเราเอง"
        />
        <div className="mt-8">
          <PhotoStrip
            heightClass="h-44 md:h-56"
            photos={[
              { src: "/images/training-bls-1.jpg", alt: "สาธิตการใช้ AED นอกสถานที่", caption: "สาธิตการใช้ AED ถึงหน่วยงาน" },
              { src: "/images/training-bls-3.jpg", alt: "ฝึกปฏิบัติ CPR กับหุ่นจำลอง", caption: "อบรม CPR โดย BLS Instructor" },
              { src: "/images/aed-floorstand.webp", alt: "จุดติดตั้งเครื่อง AED พร้อมตู้ตั้งพื้น", caption: "ติดตั้งจุดวาง AED ให้พร้อมใช้" },
            ]}
          />
        </div>
      </section>

      {/* Related regulations */}
      <section className="border-t border-gray-900 bg-gray-900/30 py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            badge="⚖️ น่ารู้ก่อนตัดสินใจ"
            title="กฎหมายและมาตรฐานที่เกี่ยวข้อง"
            subtitle="สรุปสั้นๆ สำหรับผู้ดูแลจัดซื้อ — เราช่วยตรวจสอบให้ครบทุกข้อ"
          />
          <div className="grid md:grid-cols-3 gap-5 mt-10">
            {relatedRegulations.map((r, i) => (
              <div
                key={r.title}
                className="rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-yellow-400/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-black text-sm mb-4">
                  {i + 1}
                </div>
                <h3 className="font-bold text-white mb-2">{r.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{r.detail}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-6 text-center">
            * ข้อมูลข้างต้นเป็นแนวทางทั่วไป โปรดตรวจสอบข้อกำหนด/ประกาศล่าสุดของหน่วยงานที่เกี่ยวข้องประกอบการตัดสินใจ
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <div className="rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-gray-900 via-gray-900 to-yellow-950 p-8 md:p-10 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
            องค์กรของคุณควรมี AED กี่เครื่อง ติดตรงไหน?
          </h2>
          <p className="text-gray-400 mb-7">ให้ทีมงานช่วยประเมินฟรี — ไม่มีข้อผูกมัด</p>
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
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
