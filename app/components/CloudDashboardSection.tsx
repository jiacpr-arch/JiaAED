import Image from "next/image";
import { dashboardFeatures, dashboardImage } from "@/lib/aed/gps";
import { SectionHeading } from "./SectionHeading";

export function CloudDashboardSection() {
  return (
    <section className="max-w-6xl mx-auto px-4">
      <SectionHeading
        badge="☁️ Cloud Monitoring"
        title="เช่า AED พร้อมระบบ Cloud Dashboard"
        subtitle="ตรวจสอบสถานะเครื่องได้แบบ Real-time มั่นใจว่าเครื่องพร้อมใช้งานตลอด 24 ชั่วโมง"
      />

      <div className="grid md:grid-cols-2 gap-8 items-center mt-8">
        <ul className="space-y-3 order-2 md:order-1">
          {dashboardFeatures.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
              <span className="text-green-400 flex-shrink-0 mt-0.5">✅</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 order-1 md:order-2">
          <Image
            src={dashboardImage}
            alt="ระบบ Cloud Dashboard ตรวจสอบสถานะ AED"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}
