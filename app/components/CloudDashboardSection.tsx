import Image from "next/image";
import Link from "next/link";
import { dashboardFeatures, dashboardShot } from "@/lib/aed/gps";
import { CLOUD_SNAPSHOT } from "@/lib/aed/monitoring-page";
import { thaiDate } from "@/lib/aed/regulatory";
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
        <div className="order-2 md:order-1">
          <ul className="space-y-3">
            {dashboardFeatures.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                <span className="text-green-400 flex-shrink-0 mt-0.5">✅</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link href="/aed/monitoring" data-cta="cloud_section_monitoring" className="mt-5 inline-block text-sm font-bold underline underline-offset-4">
            ดูหน้าจอระบบจริงที่ทีมงานใช้ตรวจเครื่อง →
          </Link>
        </div>

        <figure className="m-0 order-1 md:order-2 overflow-hidden rounded-2xl border border-gray-800 bg-white">
          <Image
            src={dashboardShot.src}
            width={dashboardShot.width}
            height={dashboardShot.height}
            alt={dashboardShot.alt}
            className="h-auto w-full"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <figcaption className="bg-gray-900 px-4 py-2 text-[11px] text-gray-400">
            หน้าจอระบบจริง ณ {thaiDate(CLOUD_SNAPSHOT.date, "long")} (ไม่ใช่ข้อมูลสด) · เบลอข้อมูลลูกค้าและตำแหน่งรายเครื่องแล้ว
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
