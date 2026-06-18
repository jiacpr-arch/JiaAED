import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SectionHeading } from "@/app/components/SectionHeading";
import { MiniLeadForm } from "@/app/components/MiniLeadForm";
import {
  instructorCredential,
  trainingValueProps,
  trainingImages,
} from "@/lib/aed/training";

export const revalidate = 3600;

const LINE_OA = "https://line.me/R/oaMessage/@jiacpr/?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%88+AED+%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A";

export const metadata: Metadata = {
  title: "อบรม CPR + การใช้ AED — วิทยากรผ่าน Instructor Course | JiaAED",
  description:
    "หลักสูตรอบรม CPR และการใช้ AED โดยวิทยากรที่ผ่าน Basic Life Support Instructor Course จากวิทยาลัยแพทยศาสตร์พระมงกุฎเกล้า — มีใบประกาศรับรอง ประสบการณ์ทั้งภาครัฐและเอกชน",
  alternates: { canonical: "/training" },
  openGraph: {
    title: "อบรม CPR + AED โดยวิทยากรผ่าน Instructor Course | JiaAED",
    description: "เพิ่มความมั่นใจให้ทีมงานด้วยการอบรมการใช้ AED + CPR มาตรฐาน",
    url: "/training",
    images: ["/images/training-bls-1.jpg"],
    type: "website",
  },
};

export default function TrainingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <SiteHeader />

      <section className="max-w-6xl mx-auto px-4 py-10">
        <SectionHeading
          badge="🎓 หลักสูตรอบรม"
          title={instructorCredential.title}
          subtitle={`ดำเนินการสอนโดยวิทยากรที่ผ่าน ${instructorCredential.course} จาก${instructorCredential.issuer}`}
        />

        <div className="grid md:grid-cols-2 gap-4 mt-8">
          {trainingImages.map((src, i) => (
            <div
              key={src}
              className="relative w-full h-56 md:h-72 rounded-2xl overflow-hidden border border-gray-800 bg-gray-900"
            >
              <Image
                src={src}
                alt={`ภาพการอบรม CPR และการใช้ AED ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {trainingValueProps.map((v) => (
            <div key={v.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="text-3xl mb-2">{v.icon}</div>
              <div className="font-bold text-white">{v.title}</div>
              <div className="text-sm text-gray-400 mt-1">{v.desc}</div>
            </div>
          ))}
        </div>

        {/* Credential checklist */}
        <div className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h3 className="font-bold text-white mb-3">อบรมโดยผู้สอนที่ผ่าน Instructor Course</h3>
          <ul className="space-y-2">
            {instructorCredential.points.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-green-400 flex-shrink-0 mt-0.5">✔</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Lead form */}
      <section className="max-w-2xl mx-auto px-4 py-10">
        <SectionHeading title="สนใจอบรม CPR + AED ให้องค์กร?" subtitle="ฝากเบอร์ไว้ ทีมงานติดต่อกลับเพื่อจัดหลักสูตรที่เหมาะสม" />
        <div className="mt-6">
          <MiniLeadForm variant="training_mini" />
        </div>
        <p className="text-center text-gray-500 text-sm mt-4">
          การอบรมรวมอยู่ใน{" "}
          <Link href="/aed/packages" className="text-yellow-400 hover:text-yellow-300 font-medium">
            แพ็กเกจ AED
          </Link>{" "}
          และ{" "}
          <Link href="/aed/subscription" className="text-yellow-400 hover:text-yellow-300 font-medium">
            บริการเช่ารายเดือน
          </Link>
        </p>
      </section>

      <section className="text-center py-10 px-4">
        <a
          href={LINE_OA}
          target="_blank"
          rel="noopener noreferrer"
          data-line-cta="training_footer"
          className="inline-block bg-[#06C755] text-white font-bold text-lg px-10 py-4 rounded-full hover:bg-[#05a847] shadow-2xl shadow-[#06C755]/40"
        >
          💬 สอบถามหลักสูตรอบรมทาง LINE
        </a>
      </section>

      <SiteFooter />
    </div>
  );
}
