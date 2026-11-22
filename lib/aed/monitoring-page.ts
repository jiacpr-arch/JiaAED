// ─── /aed/monitoring — "ระบบตรวจเครื่อง AED ออนไลน์" ───────────────────────────────
// Owner, 22 พ.ย. 2026: not an ad landing page. A page that shows customers the
// online system the team uses to check their machines (PRIMEDIC CLOUD), so they
// understand how a JIA-cared-for AED stays ready. Uses the owner's real
// dashboard screenshots, redacted (see docs/monitoring-page-2026-11-22.md).
//
// Every claim here is either read off those screenshots, or comes from an
// existing catalog module (Self-test interval from ./primedic.ts, dashboard
// access by tier from ./subscription.ts). Nothing on the page is live data.
import { primedicSharedSpecs } from "./primedic";
import { tiersWith } from "./subscription";

export const MONITORING_PATH = "/aed/monitoring";

// "ทุก 24 ชั่วโมง" — the verified Y-series Self-test interval, minus the log size.
export const SELF_TEST_INTERVAL = (
  primedicSharedSpecs.find((s) => s.label === "Self-test อัตโนมัติ")?.value ?? ""
).replace(/\s*\(.*\)$/, "");

// ── How a machine gets checked, step by step ─────────────────────────────────
export const monitoringSteps: { title: string; desc: string }[] = [
  {
    title: "เครื่องตรวจตัวเอง",
    desc: `เครื่อง AED ทำ Self-test อัตโนมัติ${SELF_TEST_INTERVAL} ตรวจแบตเตอรี่ แผ่นอิเล็กโทรด และวงจรภายใน`,
  },
  {
    title: "ส่งผลเข้าระบบออนไลน์",
    desc: "เครื่องรุ่นที่มีโมดูล GPS ส่งผล Self-test สถานะแบตเตอรี่ และสถานะแผ่นอิเล็กโทรด เข้าระบบ PRIMEDIC CLOUD",
  },
  {
    title: "ทีมงานเห็นทุกเครื่องในหน้าจอเดียว",
    desc: "แยกเครื่องปกติ (Normal) กับเครื่องที่มีการแจ้งเตือน (Alert) ทุกจุดติดตั้ง พร้อมวันหมดอายุแบตเตอรี่และแผ่นอิเล็กโทรดรายเครื่อง",
  },
  {
    title: "ติดต่อและแก้ไขก่อนถึงวันที่ต้องใช้",
    desc: "เมื่อมีการแจ้งเตือน ทีมงานติดต่อผู้ดูแลเครื่อง นัดเปลี่ยนแบตเตอรี่หรือแผ่นอิเล็กโทรด หรือส่งเครื่องสำรองตามเงื่อนไขบริการ",
  },
];

// ── What the system shows per machine (columns seen on the real screens) ─────
export const monitoredItems: { title: string; desc: string }[] = [
  { title: "ผล Self-test ล่าสุด", desc: "ผ่าน (Normal) หรือมีปัญหา — ดูได้รายเครื่อง" },
  { title: "แบตเตอรี่", desc: "วันหมดอายุ เวลาที่เหลือ เปอร์เซ็นต์ความจุ อุณหภูมิ และแรงดัน" },
  { title: "แผ่นอิเล็กโทรด", desc: "สถานะและวันหมดอายุ" },
  { title: "จุดติดตั้ง", desc: "ตำแหน่งบนแผนที่และบันทึกวันติดตั้งของทุกเครื่อง" },
];

// Customer log-in to the dashboard is an ELITE feature (./subscription.ts) —
// say so wherever the page shows the dashboard, so no tier is over-promised.
export const DASHBOARD_ACCESS_NOTE = `องค์กรเข้าดู Cloud Dashboard เองได้ในระดับ ${tiersWith("ระบบควบคุม Cloud Dashboard")} · ระดับอื่นทีมงานเฝ้าระบบและแจ้งให้`;

// ── PRIMEDIC CLOUD dashboard snapshot ─────────────────────────────────────────
// Figures read off the owner's dashboard. A snapshot, not live data — the page
// always prints the date next to them.
export const CLOUD_SNAPSHOT = {
  date: "2026-11-23", // ISO; rendered as Thai date. Owner-supplied.
  total: 19,
  normal: 15,
  alert: 4,
} as const;

// ── Redacted screenshots ──────────────────────────────────────────────────────
// Produced by scripts/redact-image.mjs (regions downsampled 16× then blurred into the pixels, metadata
// stripped) and checked by eye. No user name, email, phone, customer, address,
// serial number, or per-device GPS point/coordinate may be readable.
//   map       — account phone number and every device pin covered (legend 15/4/0 kept)
//   device    — device SN, battery SN, barcode label, location map, coordinates and
//               address covered; location section cropped off (model + expiry dates kept)
//   satellite — same covers as the street map
//   installs  — Customer, Device location and Device SN columns covered
// Never the old illustrative mock-up /images/cloud-dashboard.png (24/20/3/1 isn't real).
// Not used: rescue history (SNs + real rescue events — a sensitive medical claim),
// customer list (names, emails and phones of people).
export type Screenshot = { src: string; width: number; height: number; alt: string };

export const CLOUD_SCREENSHOT: Screenshot = {
  src: "/images/primedic-cloud-map-2026-11-23-redacted.png",
  width: 1920,
  height: 1028,
  alt: "หน้าจอ PRIMEDIC CLOUD แผนที่ภาพรวมเครื่อง Normal 15 · Alert 4 (เบลอหมุดตำแหน่งรายเครื่องและเบอร์โทรบัญชีแล้ว)",
};

export const CLOUD_DEVICE_SCREENSHOT: Screenshot = {
  src: "/images/primedic-cloud-device-2026-11-23-redacted.png",
  width: 880,
  height: 572,
  alt: "หน้าจอข้อมูลรายเครื่อง PRIMEDIC CLOUD รุ่น Y8 แสดงวันหมดอายุแผ่นอิเล็กโทรดและแบตเตอรี่ (เบลอหมายเลขเครื่อง หมายเลขแบตเตอรี่ และตำแหน่งแล้ว)",
};

export const CLOUD_GALLERY: (Screenshot & { caption: string })[] = [
  {
    src: "/images/primedic-cloud-map-satellite-2026-11-23-redacted.png",
    width: 1920,
    height: 1028,
    alt: "PRIMEDIC CLOUD แผนที่แบบดาวเทียม สรุป Normal 15 · Alert 4 (เบลอหมุดตำแหน่งรายเครื่องและเบอร์โทรบัญชีแล้ว)",
    caption: "AED map แบบดาวเทียม — ภาพรวมทุกจุดติดตั้ง (เบลอตำแหน่งรายเครื่อง)",
  },
  {
    src: "/images/primedic-cloud-installs-2026-11-23-redacted.png",
    width: 1920,
    height: 1028,
    alt: "PRIMEDIC CLOUD หน้าบันทึกการติดตั้งเครื่อง พร้อมวันเวลาติดตั้ง (เบลอชื่อลูกค้า ที่อยู่ และหมายเลขเครื่องแล้ว)",
    caption: "Device installation — บันทึกการติดตั้งทุกเครื่อง (เบลอชื่อลูกค้า ที่อยู่ และ SN)",
  },
];

// Lead form on the page: aed_leads.source / analytics variant.
export const MONITORING_LEAD = { variant: "monitoring", source: "monitoring_form", productId: "yuwell-gps" } as const;

// ── myAED Finder mobile app (PRIMEDIC) ────────────────────────────────────────
// Owner, 22 พ.ย. 2026: show customers the public-facing side too — installed
// units appear in the myAED Finder app so people nearby can find the closest
// AED. Features below are what the owner's app screenshots show.
export const APP_NAME = "myAED Finder";
export const appFeatures: { title: string; desc: string }[] = [
  { title: "ค้นหาเครื่อง AED ใกล้ที่สุด", desc: "แผนที่แสดงจุดติดตั้ง AED บอกจำนวนเครื่องที่พร้อมใช้ และระยะทางจากตำแหน่งผู้ใช้" },
  { title: "นำทางไปที่เครื่อง", desc: "กด Start Navigation เพื่อเปิดเส้นทาง และดู Location Guide ว่าเครื่องติดตั้งอยู่ตรงไหนของอาคาร" },
  { title: "เวลาที่เข้าถึงเครื่องได้", desc: "แสดงเวลาเปิดให้เข้าถึงของแต่ละจุดติดตั้ง" },
  { title: "ปุ่มโทร 1669", desc: "เรียกรถพยาบาลฉุกเฉินได้จากหน้าแรกของแอป" },
];

// Redacted app screenshots. Empty until the owner sends the files: cover device
// serial numbers and the phone user's own location dot; keep only installation
// sites that are meant to be public (e.g. JIA TRAINER CENTER).
export const APP_SCREENSHOTS: Screenshot[] = [];
