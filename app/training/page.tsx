import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/app/components/PageHero";
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

import { LINE_OA } from "@/lib/aed/line";

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

// Captions match the photo order in trainingImages (see lib/aed/training.ts).
const PHOTO_CAPTIONS = [
  "สาธิตการใช้ AED + ฝึกปฏิบัติจริงถึงหน่วยงาน",
  "วิทยากรผ่าน BLS Instructor Course พร้อมใบประกาศ",
  "ฝึกปฏิบัติปฐมพยาบาลกับหุ่นจำลอง",
];

export default function TrainingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <SiteHeader />

      <PageHero
        badge="🎓 หลักสูตรอบรม"
        title="อบรม CPR + การใช้ AED ถึงองค์กรของคุณ"
        subtitle={`ดำเนินการสอนโดยวิทยากรที่ผ่าน ${instructorCredential.course} จาก${instructorCredential.issuer}`}
        backgroundImage="/images/training-bls-1.jpg"
        chips={[
          "สอนถึงที่หน่วยงาน",
          "ฝึกปฏิบัติจริงกับหุ่น CPR",
          "ประสบการณ์ทั้งภาครัฐและเอกชน",
        ]}
      />

      {/* Why train — the 3 value props */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <SectionHeading
          badge="ทำไมต้องอบรม"
          title="เครื่องดีแค่ไหน ก็ต้องมีคนกล้าใช้"
          subtitle="การอบรมช่วยลดความตื่นตระหนก ให้ทีมงานลงมือช่วยชีวิตได้จริงในนาทีฉุกเฉิน"
        />
        <div className="grid sm:grid-cols-3 gap-5 mt-10">
          {trainingValueProps.map((v) => (
            <div
              key={v.title}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-yellow-400/30 transition-colors"
            >
              <div className="text-3xl mb-3">{v.icon}</div>
              <div className="font-bold text-white mb-1">{v.title}</div>
              <div className="text-sm text-gray-400 leading-relaxed">{v.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Real training photos with captions */}
      <section className="border-t border-gray-900 bg-gray-900/30 py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            badge="📸 ภาพจากการอบรมจริง"
            title="บรรยากาศการอบรมโดยทีมงานของเรา"
          />
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mt-10">
            {trainingImages.map((src, i) => (
              <figure
                key={src}
                className="group rounded-2xl overflow-hidden border border-gray-800 bg-gray-900"
              >
                <div className="relative w-full h-52 md:h-56 overflow-hidden">
                  <Image
                    src={src}
                    alt={PHOTO_CAPTIONS[i] ?? `ภาพการอบรม CPR และการใช้ AED ${i + 1}`}
                    fill
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <figcaption className="px-4 py-3 text-sm text-gray-400">
                  {PHOTO_CAPTIONS[i]}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Instructor credential — the proof, next to the certificate photo */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-gray-800 order-last md:order-first">
            <Image
              src="/images/training-bls-2.jpg"
              alt="วิทยากรผ่าน BLS Instructor Course พร้อมใบประกาศรับรอง"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div>
            <SectionHeading
              align="left"
              badge="🏅 มาตรฐานผู้สอน"
              title={instructorCredential.title}
            />
            <p className="text-gray-400 mt-3">
              ผ่านหลักสูตร{" "}
              <strong className="text-yellow-400">{instructorCredential.course}</strong>{" "}
              จาก{instructorCredential.issuer}
            </p>
            <ul className="space-y-3 mt-5">
              {instructorCredential.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-400/10 border border-green-400/30 text-green-400 flex items-center justify-center text-[10px] mt-0.5">
                    ✔
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Training comes free with the packages — the cross-sell */}
      <section className="max-w-6xl mx-auto px-4 pb-6">
        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-8">
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg mb-1">
              ซื้อหรือเช่า AED กับเรา — การอบรมรวมอยู่ในบริการแล้ว
            </h3>
            <p className="text-sm text-gray-400">
              ทุกแพ็กเกจ AED และบริการเช่ารายเดือน มาพร้อมการอบรมทีมงานถึงที่ โดยไม่ต้องจัดหาวิทยากรเอง
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link
              href="/aed/packages"
              className="text-center bg-yellow-400 text-yellow-950 font-bold text-sm px-5 py-2.5 rounded-full hover:bg-yellow-300 transition-colors"
            >
              ดูแพ็กเกจ AED →
            </Link>
            <Link
              href="/aed/subscription"
              className="text-center bg-yellow-400/10 text-yellow-400 font-bold text-sm px-5 py-2.5 rounded-full border border-yellow-400/30 hover:bg-yellow-400/20 transition-colors"
            >
              บริการเช่ารายเดือน →
            </Link>
          </div>
        </div>
      </section>

      {/* Lead form */}
      <section className="max-w-2xl mx-auto px-4 py-14">
        <div className="rounded-3xl border border-gray-800 bg-gray-900 p-6 md:p-8">
          <SectionHeading
            title="สนใจอบรม CPR + AED ให้องค์กร?"
            subtitle="ฝากเบอร์ไว้ ทีมงานติดต่อกลับเพื่อจัดหลักสูตรที่เหมาะสม"
          />
          <div className="mt-6">
            <MiniLeadForm variant="training_mini" />
          </div>
        </div>
        <p className="text-center text-gray-500 text-sm mt-5">
          หรือสอบถามทาง LINE ได้ทันที —{" "}
          <a
            href={LINE_OA}
            target="_blank"
            rel="noopener noreferrer"
            data-line-cta="training_footer"
            className="text-yellow-400 hover:text-yellow-300 font-medium underline"
          >
            💬 คุยกับทีมงาน 24 ชม. →
          </a>
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
