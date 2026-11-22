// ─── Landing page: JIA Yuwell HeartSave Y8 GPS 4G (rental) — /aed/heartsave-y8-gps ─
// Ad landing page with two audiences on one URL:
//   • #rent — SMEs/condos/fitness renting a unit (price, LINE, quick lead form)
//   • #org  — organisations / government buyers (White Paper request + demo)
//
import { tiersWith } from "./subscription";

// Every claim on the page comes from this file or an existing catalog module, so
// the ฆพ. review (see docs/heartsave-y8-gps-landing-2026-11-22.md) has one place
// to check. Nothing here is "live": the dashboard numbers are a dated snapshot.

// ── Publish gate ───────────────────────────────────────────────────────────────
// false ⇒ the page renders (preview/staging) but is `noindex`, left out of the
// sitemap, and shows a "preview" ribbon. Flip to true only after the owner signs
// off the checklist in the doc above (ฆพ. coverage, price, LINE OA, screenshot).
export const Y8_GPS_LANDING_PUBLISHED = false;

export const Y8_GPS_LANDING_PATH = "/aed/heartsave-y8-gps";

// ── Price shown to renters ─────────────────────────────────────────────────────
// Owner brief (22 พ.ย. 2026): "เริ่ม 1,990 บาท/เดือน ไม่รวม VAT ตามเงื่อนไข/เงินประกัน".
// ⚠️ This number is NOT on the current price ladder in ./rental-prices.ts (FLEX
// ฿2,990/เดือน, STANDARD ≈ ฿1,830/เดือน billed ฿22,000/ปี). The owner must name
// the plan it belongs to (term, billing, deposit) before ads run — advertising
// a price no contract offers is a consumer-protection problem. Until then the
// conditions line below says exactly that the quote decides.
export const Y8_GPS_FROM_MONTHLY_THB = 1_990;
export const Y8_GPS_PRICE_CONDITIONS =
  "ราคาเริ่มต้นต่อเครื่องต่อเดือน ยังไม่รวม VAT 7% · ขึ้นกับระยะสัญญา จำนวนเครื่อง และเงินประกัน (มัดจำคืนได้) · ราคาและเงื่อนไขสุดท้ายตามใบเสนอราคาและสัญญาเช่า";

// ── PRIMEDIC CLOUD dashboard snapshot ─────────────────────────────────────────
// Figures the owner read off the fleet dashboard. A snapshot, not live data —
// the page must always print the date next to them.
export const CLOUD_SNAPSHOT = {
  date: "2026-11-23", // ISO; rendered as Thai date. Owner-supplied.
  total: 19,
  normal: 15,
  alert: 4,
} as const;

// The redacted screenshot. Stays null until a file produced by
// scripts/redact-image.mjs (black boxes burned in, metadata stripped) has been
// checked by a person: no user name, email, phone, customer, address, serial
// number, or per-device GPS point/coordinates may be readable. While null, the
// page shows the snapshot numbers as text only — never the raw screenshot and
// never the old illustrative mock-up (/images/cloud-dashboard.png, whose 24/20/3/1
// figures are not real).
export const CLOUD_SCREENSHOT: { src: string; width: number; height: number } | null = null;

// ── Product photos (real red/orange-red HeartSave units, already on the site) ──
export const Y8_GPS_PHOTOS = {
  hero: { src: "/images/yuwell-gps-aed.webp", width: 549, height: 549, alt: "เครื่อง AED Yuwell HeartSave สีแดง พร้อมไฟสถานะ OK ด้านบน" },
  open: { src: "/images/primedic-y8-open.png", width: 900, height: 900, alt: "HeartSave Y8 เปิดฝา แสดงแผ่นอิเล็กโทรดและภาพขั้นตอนการใช้งาน" },
} as const;

// ── What the rental includes (service promises — from ./rental.ts & ./gps.ts) ──
export const rentalIncludes: string[] = [
  "เครื่อง HeartSave Y8 พร้อมแผ่นอิเล็กโทรดและแบตเตอรี่",
  "โมดูล GPS — ทีมงานเห็นตำแหน่งและสถานะความพร้อมของเครื่องผ่านระบบ PRIMEDIC CLOUD",
  "ทีมงานติดตามการแจ้งเตือน (แบตเตอรี่ แผ่นอิเล็กโทรด ผล Self-test) และติดต่อกลับเมื่อมีปัญหา",
  "เครื่องสำรองเมื่อเครื่องเสียจากการใช้งานปกติ ตามเงื่อนไขสัญญา",
  "แนะนำการใช้งานเบื้องต้นตอนส่งมอบ",
];

export const orgBenefits: { title: string; desc: string }[] = [
  { title: "ภาพรวมหลายจุดในหน้าจอเดียว", desc: "จำนวนเครื่องทั้งหมด เครื่องปกติ และเครื่องที่มีการแจ้งเตือน แยกตามสถานที่ติดตั้ง" },
  { title: "แจ้งเตือนก่อนเครื่องไม่พร้อม", desc: "แบตเตอรี่ต่ำ แผ่นอิเล็กโทรดใกล้หมดอายุ หรือ Self-test ไม่ผ่าน — ทีมงานรับเรื่องและนัดแก้ไข" },
  { title: "ตำแหน่งเครื่องสำหรับทรัพย์สินหลายสาขา", desc: "ช่วยตรวจนับและติดตามเครื่องที่ติดตั้งกระจายหลายอาคาร/หลายพื้นที่" },
  { title: "เอกสารประกอบการจัดซื้อ", desc: "สเปก ทะเบียน อย. ใบอนุญาตโฆษณา และร่างสัญญาเช่า สำหรับคณะกรรมการ" },
];

// Customer log-in to the dashboard is an ELITE feature (./subscription.ts) —
// say so wherever the page shows the dashboard, so no tier is over-promised.
export const DASHBOARD_ACCESS_NOTE = `องค์กรเข้าดู Cloud Dashboard เองได้ในระดับ ${tiersWith("ระบบควบคุม Cloud Dashboard")} · ระดับอื่นทีมงานเฝ้าระบบและแจ้งให้`;

// ── Analytics ──────────────────────────────────────────────────────────────────
// `variant` values flow into lead_form_* / line_click events (GA4 + PostHog +
// aed_analytics_events) and `source` into aed_leads.source — so leads from each
// audience can be counted, and later matched to signed contracts by phone.
export const Y8_GPS_SEGMENTS = {
  rent: { variant: "y8gps_rent", source: "y8gps_rent_form", productId: "yuwell-gps" },
  org: { variant: "y8gps_org", source: "y8gps_org_form", productId: "yuwell-gps" },
} as const;
