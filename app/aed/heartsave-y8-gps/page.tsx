import type { Metadata } from "next";
import { MarketPage } from "@/app/components/MarketShell";
import {
  Y8_GPS_FROM_MONTHLY_THB,
  Y8_GPS_LANDING_PATH,
  Y8_GPS_LANDING_PUBLISHED,
  Y8_GPS_PHOTOS,
} from "@/lib/aed/y8-gps-landing";
import { Y8GpsLandingContent } from "./LandingContent";

export const revalidate = 3600;

const PRICE = `฿${Y8_GPS_FROM_MONTHLY_THB.toLocaleString("en-US")}`;

export const metadata: Metadata = {
  title: `เช่า AED HeartSave Y8 GPS เริ่ม ${PRICE}/เดือน — พร้อมระบบติดตามสถานะเครื่อง`,
  description:
    `เช่าเครื่อง AED Yuwell HeartSave Y8 พร้อมโมดูล GPS ทีมงานเฝ้าสถานะแบตเตอรี่ แผ่นอิเล็กโทรด และผล Self-test ผ่าน PRIMEDIC CLOUD · ` +
    `เริ่ม ${PRICE}/เดือน (เฉลี่ย แผนรายปี ไม่รวม VAT) · หน่วยงาน/ภาครัฐ ขอ White Paper และนัดเดโมได้`,
  alternates: { canonical: Y8_GPS_LANDING_PATH },
  robots: { index: Y8_GPS_LANDING_PUBLISHED, follow: Y8_GPS_LANDING_PUBLISHED },
  openGraph: {
    title: `เช่า AED HeartSave Y8 GPS เริ่ม ${PRICE}/เดือน`,
    description: "AED พร้อมระบบติดตามสถานะเครื่อง สำหรับองค์กรและหน่วยงาน",
    url: Y8_GPS_LANDING_PATH,
    images: [{ url: Y8_GPS_PHOTOS.open.src, width: Y8_GPS_PHOTOS.open.width, height: Y8_GPS_PHOTOS.open.height }],
    type: "website",
  },
};

export default function HeartSaveY8GpsPage() {
  return (
    <MarketPage>
      <Y8GpsLandingContent />
    </MarketPage>
  );
}
