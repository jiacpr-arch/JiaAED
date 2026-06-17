import Image from "next/image";
import { gpsFeatures, gpsImage } from "@/lib/aed/gps";
import { SectionHeading } from "./SectionHeading";

export function GpsBundleSection() {
  return (
    <section className="max-w-6xl mx-auto px-4">
      <SectionHeading
        badge="📍 AED + GPS"
        title="ปกป้องชีวิต พร้อมบริหารทรัพย์สิน"
        subtitle="GPS ช่วยติดตามตำแหน่งเครื่อง ทีมงานนอกสถานที่ และทรัพย์สินขององค์กร — เพิ่มความปลอดภัยรอบด้าน"
      />

      <div className="grid md:grid-cols-2 gap-8 items-center mt-8">
        <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
          <Image
            src={gpsImage}
            alt="AED พร้อมระบบติดตาม GPS"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div className="space-y-4">
          {gpsFeatures.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{f.icon}</span>
              <div>
                <div className="font-semibold text-white">{f.title}</div>
                <div className="text-sm text-gray-400">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
