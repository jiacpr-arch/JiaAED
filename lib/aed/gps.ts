// ─── AED + GPS bundle & Cloud Monitoring Dashboard ────────────────────────────
// GPS (Yuwell GPS) is bundled with the managed-rental tiers (see ./subscription.ts).
// It is positioned as an asset/team-tracking + readiness system, not just a tag.

// Real photo of the registered unit. The old aed-gps-tracking.png was an
// illustrative mock-up (wrong device, baked-in "เพิ่มโอกาสรอดชีวิต"/"เรียลไทม์ 24 ชม."
// copy) — never use it on an ad page.
export const gpsImage = "/images/yuwell-gps-aed.webp";

// Only what the registered device (HeartSave Y8 with networking function) and
// PRIMEDIC CLOUD actually do — no vehicle/asset tracking, no "real-time 24h"
// promises (jiaaed.com ฆพ. application, 23 พ.ย. 2569). Mirrors the limits on
// /aed/gps-rental.
export const gpsFeatures: { icon: string; title: string; desc: string }[] = [
  {
    icon: "📍",
    title: "ตำแหน่งเครื่อง AED บนแผนที่",
    desc: "แสดงพิกัดเครื่องตามข้อมูลล่าสุดที่ระบบได้รับ — เหมาะกับองค์กรหลายสาขา (ไม่ใช่การติดตามสดต่อเนื่อง)",
  },
  {
    icon: "🔋",
    title: "สถานะแบตเตอรี่และแผ่นอิเล็กโทรด",
    desc: "เห็นวันหมดอายุของแบต/แผ่นรายเครื่อง ทีมงานนัดเปลี่ยนให้ก่อนหมดอายุ",
  },
  {
    icon: "🗂️",
    title: "ดูทุกเครื่องขององค์กรในระบบเดียว",
    desc: "จุดติดตั้งและบันทึกการติดตั้งของทุกเครื่อง สำหรับองค์กรที่มี AED หลายจุด",
  },
  {
    icon: "🔔",
    title: "บันทึกเหตุการณ์และการแจ้งเตือน",
    desc: "บันทึกการเปิดเครื่องและแจ้งเตือนความผิดปกติที่ระบบรองรับ (การแจ้งเตือนเปิดตู้ขึ้นกับชนิดตู้)",
  },
];

// Cloud Monitoring Dashboard — readiness at a glance across all locations.
// Owner, 22 พ.ย. 2026: the real PRIMEDIC CLOUD fleet map (redacted — see
// lib/aed/monitoring-page.ts) replaces the old illustrative cloud-dashboard.png,
// whose 24/20/3/1 figures were not real. One constant for every page.
export { CLOUD_SCREENSHOT as dashboardShot } from "./monitoring-page";
import { CLOUD_SCREENSHOT } from "./monitoring-page";
export const dashboardImage = CLOUD_SCREENSHOT.src;

export const dashboardFeatures: string[] = [
  "ดูสถานะเครื่องหลายจุดในหน้าจอเดียว (Multi-location)",
  "ตรวจสอบสถานะแบตเตอรี่และแผ่น Pad แบบออนไลน์",
  "ระบบแจ้งเตือนอัตโนมัติเมื่ออุปกรณ์ใกล้หมดอายุ",
  "ดูผล Self-test ของเครื่องตามรอบข้อมูลที่ระบบได้รับ",
  "ทีมงานติดต่อผู้ดูแลเมื่อพบการแจ้งเตือน",
];
