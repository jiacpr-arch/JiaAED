// ─── Landing page: JIA Yuwell HeartSave Y8 GPS 4G (rental) — /aed/heartsave-y8-gps ─
// Ad landing page with two audiences on one URL:
//   • #rent — SMEs/condos/fitness renting a unit (price, LINE, quick lead form)
//   • #org  — organisations / government buyers (White Paper request + demo)
//
import { tiersWith } from "./subscription";
import { RENTAL_PRICES, STANDARD_MONTHLY } from "./rental-prices";
import { RENTAL_DEPOSITS } from "./rental";

// Every claim on the page comes from this file or an existing catalog module, so
// the ฆพ. review (see docs/heartsave-y8-gps-landing-2026-11-22.md) has one place
// to check. Nothing here is "live": the dashboard numbers are a dated snapshot.

// ── Publish gate ───────────────────────────────────────────────────────────────
// false ⇒ the page renders (preview/staging) but is `noindex`, left out of the
// sitemap, and shows a "preview" ribbon. Flip to true only after the owner signs
// off the checklist in the doc above (ฆพ. coverage, price, LINE OA, screenshot).
export const Y8_GPS_LANDING_PUBLISHED = false;

export const Y8_GPS_LANDING_PATH = "/aed/heartsave-y8-gps";

// ── iframe embed on www.jia1669.com ───────────────────────────────────────────
// ฆพ.287/2567 names "เว็บไซต์ ชื่อ www.jia1669.com" as the medium, so ads point
// at a jia1669.com page that frames this embed route (same set-up as Yuwell Y2).
export const Y8_GPS_EMBED_PATH = `${Y8_GPS_LANDING_PATH}/embed`;
export const Y8_GPS_EMBED_PARENT_ORIGINS = ["https://www.jia1669.com", "https://jia1669.com"] as const;
const EMBED_ORIGINS = ["https://jiaaed.com", "https://www.jiaaed.com"];

// Paste into a custom-HTML block on the jia1669.com landing page. It forwards
// the page's own query string (utm_*, gclid, fbclid) to the iframe so ad clicks
// keep their attribution, sizes the frame to its content, and scrolls the page
// when a #rent / #org button inside the frame is clicked.
export const Y8_GPS_EMBED_SNIPPET = `<div id="jiaaed-y8gps"></div>
<script>
(function () {
  var box = document.getElementById("jiaaed-y8gps");
  var f = document.createElement("iframe");
  f.src = "https://jiaaed.com${Y8_GPS_LANDING_PATH}/embed" + window.location.search;
  f.title = "เช่า AED HeartSave Y8 GPS";
  f.style.cssText = "display:block;width:100%;border:0;min-height:2600px";
  f.setAttribute("allow", "clipboard-write");
  box.appendChild(f);
  window.addEventListener("message", function (e) {
    if (${JSON.stringify(EMBED_ORIGINS)}.indexOf(e.origin) < 0) return;
    var d = e.data || {};
    if (d.type === "jiaaed:height" && d.height > 0) { f.style.minHeight = "0"; f.style.height = d.height + "px"; }
    if (d.type === "jiaaed:scroll") window.scrollTo({ top: f.getBoundingClientRect().top + window.scrollY + d.top, behavior: "smooth" });
  });
})();
</script>
<noscript><a href="https://jiaaed.com${Y8_GPS_LANDING_PATH}">เช่า AED HeartSave Y8 GPS</a></noscript>`;

// ── Price shown to renters ─────────────────────────────────────────────────────
// Owner, 22 พ.ย. 2026: use the STANDARD annual plan (not the ฿1,990 in the first
// brief, which matched no plan). Derived from ./rental-prices.ts so the landing
// page can't drift from /aed/rental: ฿22,000/ปี ÷ 12 ≈ ฿1,830/เดือน, 1 unit.
const thb = (n: number) => `฿${n.toLocaleString("en-US")}`;
export const Y8_GPS_FROM_MONTHLY_THB = STANDARD_MONTHLY;
export const Y8_GPS_PRICE_CONDITIONS =
  `ราคาเฉลี่ยต่อเดือนของแผนรายปี STANDARD (1 เครื่อง) ชำระรายปี ${thb(RENTAL_PRICES.annual)} ยังไม่รวม VAT 7% · ` +
  `เงินประกัน (มัดจำคืนได้) ${thb(RENTAL_DEPOSITS.annual)} ยกเว้นได้เมื่อมี PO · ` +
  "ราคาและเงื่อนไขสุดท้ายตามใบเสนอราคาและสัญญาเช่า";

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
//
// Owner sent the PRIMEDIC CLOUD screenshots on 22 พ.ย. 2026. Redacted with
// scripts/redact-image.mjs and checked by eye:
//   map    — account phone number and every device pin covered (legend 15/4/0 kept)
//   device — device SN, battery SN, barcode label, location map, coordinates and
//            address covered; location section cropped off (model + expiry dates kept)
// Not used: rescue history, installation list, customer list (customer names,
// emails, phones, addresses and SNs are most of what they show).
export type Screenshot = { src: string; width: number; height: number; alt: string };
export const CLOUD_SCREENSHOT: Screenshot | null = {
  src: "/images/primedic-cloud-map-2026-11-23-redacted.png",
  width: 1920,
  height: 1028,
  alt: "หน้าจอ PRIMEDIC CLOUD แผนที่ภาพรวมเครื่อง Normal 15 · Alert 4 (ปิดทับหมุดตำแหน่งรายเครื่องและเบอร์โทรบัญชีแล้ว)",
};
export const CLOUD_DEVICE_SCREENSHOT: Screenshot | null = {
  src: "/images/primedic-cloud-device-2026-11-23-redacted.png",
  width: 880,
  height: 572,
  alt: "หน้าจอข้อมูลรายเครื่อง PRIMEDIC CLOUD รุ่น Y8 แสดงวันหมดอายุแผ่นอิเล็กโทรดและแบตเตอรี่ (ปิดหมายเลขเครื่อง หมายเลขแบตเตอรี่ และตำแหน่งแล้ว)",
};

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
