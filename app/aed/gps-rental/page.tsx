import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketPage } from "@/app/components/MarketShell";
import { BreadcrumbStructuredData, FaqStructuredData } from "@/app/components/StructuredData";
import { LINE_DISPLAY_ID, LINE_OA } from "@/lib/aed/line";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/aed/contact";
import { AED_INTENDED_USE, DEVICE_AD_WARNING, PRIMEDIC_REGULATORY, fdaLine, jiaaedAdLicenseLine, thaiDate } from "@/lib/aed/regulatory";
import { trainingImages, instructorCredential } from "@/lib/aed/training";
import {
  CLOUD_DEVICE_SCREENSHOT,
  CLOUD_SCREENSHOT,
  CLOUD_SNAPSHOT,
  MONITORING_PATH,
} from "@/lib/aed/monitoring-page";
import {
  BRAND,
  CLOUD_CAPABILITIES,
  EMERGENCY_REMINDER,
  ENTERPRISE_GROUPS,
  ENTERPRISE_ITEMS,
  GPS_LIMITS,
  GPS_RENTAL_FAQS,
  GPS_RENTAL_PATH,
  GPS_SCENARIO,
  HERO_PHOTO,
  PACKAGES,
  PACKAGE_FINE_PRINT,
  PAIN_NOTE,
  PAIN_POINTS,
  PRICE_FROM,
  PRICE_NOTE,
  PRODUCT_FEATURES,
  PRODUCT_NAME,
  PRODUCT_PHOTOS,
  RENT_AUDIENCES,
  SERVICE_ITEMS,
  SURVIVOR,
  SURVIVOR_ENABLED,
  TRAINING_COURSES,
  TRAINING_NOTE,
} from "@/lib/aed/gps-rental-page";
import { GpsQuoteForm } from "./GpsQuoteForm";
import { GpsRentalPageTracker } from "./PageTracker";

export const revalidate = 3600;

const SNAPSHOT_DATE = thaiDate(CLOUD_SNAPSHOT.date, "long");

export const metadata: Metadata = {
  title: `เช่า AED GPS 4G เริ่ม ${PRICE_FROM}/เดือน — พร้อมระบบช่วยดูแลความพร้อมของเครื่อง`,
  description:
    `เช่า ${PRODUCT_NAME} พร้อมระบบ PRIMEDIC CLOUD ตรวจสถานะแบตเตอรี่ แผ่นอิเล็กโทรด Self-test และตำแหน่งเครื่อง ` +
    `เริ่ม ${PRICE_FROM}/เดือน (เฉลี่ย แผนรายปี ไม่รวม VAT) · บริการติดตั้ง ดูแล และอบรม · ขอใบเสนอราคาหรือทัก LINE ${LINE_DISPLAY_ID}`,
  alternates: { canonical: GPS_RENTAL_PATH },
  openGraph: {
    title: `เช่า AED GPS 4G เริ่ม ${PRICE_FROM}/เดือน — ${BRAND}`,
    description: "AED พร้อมระบบช่วยดูแลความพร้อมของเครื่อง สำหรับองค์กร คอนโด โรงงาน และหน่วยงาน",
    url: GPS_RENTAL_PATH,
    images: [{ url: CLOUD_SCREENSHOT.src, width: CLOUD_SCREENSHOT.width, height: CLOUD_SCREENSHOT.height }],
    type: "website",
  },
};

// Palette from the brief: navy (trust), teal (cloud/monitoring), orange (CTA/price).
const NAVY = "#0b2545";
const H2 = "m-0 text-[clamp(26px,3.4vw,42px)] font-extrabold leading-tight tracking-[-0.03em] text-[#0b2545]";
const EYEBROW = "m-0 mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#0f9b8e]";
const CTA_PRIMARY = "inline-flex items-center justify-center rounded-xl bg-[#f59e0b] px-6 py-3.5 text-base font-extrabold text-[#0b2545] transition hover:bg-[#fbbf24]";

function LineButton({ where, children }: { where: string; children: React.ReactNode }) {
  return (
    <a
      href={LINE_OA}
      target="_blank"
      rel="noopener noreferrer"
      data-line-cta={where}
      data-product="yuwell-gps"
      className="inline-flex items-center justify-center rounded-xl bg-[#06C755] px-6 py-3.5 text-base font-bold text-white transition hover:bg-[#05a847]"
    >
      {children}
    </a>
  );
}

function SnapshotBadge() {
  return (
    <span className="rounded bg-amber-300 px-2 py-0.5 text-[11px] font-bold text-amber-950">
      ภาพ ณ {SNAPSHOT_DATE} · ไม่ใช่สถานะ Live
    </span>
  );
}

// Cabinet vs. where the unit is when it's used — the point of GPS on the unit.
function GpsDiagram() {
  return (
    <svg viewBox="0 0 560 240" role="img" aria-label="แผนภาพ: AED ติดตั้งที่จุด A ถูกนำไปใช้ที่จุดเกิดเหตุห่างออกไป 300–500 เมตร และส่งพิกัดที่ตรวจจับได้เข้าระบบผ่าน 4G" className="h-auto w-full">
      <rect x="0" y="0" width="560" height="240" rx="16" fill="#eef6f8" />
      <path d="M120 150 C 220 60, 330 220, 440 120" fill="none" stroke="#0f9b8e" strokeWidth="4" strokeDasharray="10 8" />
      <text x="280" y="200" textAnchor="middle" fontSize="15" fill="#334155">ผู้ช่วยเหลือนำ AED ไป 300–500 ม.</text>
      <g>
        <rect x="80" y="110" width="80" height="80" rx="10" fill="#0b2545" />
        <rect x="98" y="126" width="44" height="48" rx="6" fill="#e5484d" />
        <text x="120" y="156" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">AED</text>
        <text x="120" y="96" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0b2545">A · ตำแหน่งตู้</text>
      </g>
      <g>
        <circle cx="440" cy="120" r="34" fill="#f59e0b" opacity="0.25" />
        <circle cx="440" cy="120" r="12" fill="#f59e0b" />
        <text x="440" y="74" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0b2545">ตำแหน่งเครื่องเมื่อใช้งาน</text>
        <text x="440" y="176" textAnchor="middle" fontSize="13" fill="#334155">เปิดเครื่อง → ส่งเหตุการณ์ + พิกัด (4G)</text>
      </g>
      <g>
        <path d="M480 40 q12 -14 24 0 M486 46 q6 -7 12 0" fill="none" stroke="#0f9b8e" strokeWidth="3" strokeLinecap="round" />
        <text x="508" y="62" textAnchor="end" fontSize="12" fill="#0f9b8e">4G</text>
      </g>
    </svg>
  );
}

export default function GpsRentalPage() {
  const stats = [
    { label: "เครื่องในระบบ", value: CLOUD_SNAPSHOT.total, tone: "text-[#0b2545]" },
    { label: "Normal", value: CLOUD_SNAPSHOT.normal, tone: "text-[#0f9b8e]" },
    { label: "Alert", value: CLOUD_SNAPSHOT.alert, tone: "text-[#e5484d]" },
  ];

  return (
    <MarketPage>
      <GpsRentalPageTracker />
      <BreadcrumbStructuredData
        items={[
          { name: "หน้าแรก", path: "/" },
          { name: "เช่า AED", path: "/aed/rental" },
          { name: "เช่า AED GPS 4G", path: GPS_RENTAL_PATH },
        ]}
      />
      <FaqStructuredData items={GPS_RENTAL_FAQS} />

      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-white" style={{ background: `radial-gradient(circle at 80% 20%, #12507a 0%, ${NAVY} 55%)` }}>
        <div className="market-container grid items-center gap-6 py-8 md:grid-cols-[1.1fr_.9fr] md:gap-8 md:py-16">
          <div>
            <p className="m-0 mb-3 text-xs font-extrabold tracking-[0.16em] text-[#5eead4]">{BRAND} · {PRODUCT_NAME}</p>
            <h1 className="m-0 text-[clamp(32px,5vw,58px)] font-extrabold leading-[1.15] tracking-[-0.03em]">
              เช่า AED GPS 4G
              <span className="mt-2 block text-[clamp(20px,2.6vw,30px)] font-bold leading-snug text-[#cfe8f3]">
                พร้อมระบบช่วยดูแลความพร้อมของเครื่อง
              </span>
            </h1>
            <p className="m-0 mt-5 text-[clamp(22px,2.6vw,30px)] font-extrabold">
              ราคาเริ่มต้น <span className="text-[#fbbf24]">{PRICE_FROM}</span>/เดือน
            </p>
            <p className="m-0 mt-4 max-w-xl text-[15px] leading-[1.8] text-[#dbe7ef]">
              เช่าเครื่องกระตุกหัวใจไฟฟ้าอัตโนมัติ {PRODUCT_NAME} พร้อมระบบ Cloud Monitoring สำหรับตรวจสอบสถานะเครื่อง
              การรายงานเหตุการณ์ และการแจ้งเตือนตามข้อมูลที่ระบบรองรับ — ไม่ต้องลงทุนซื้อเครื่องเต็มจำนวน พร้อมบริการดูแลตามเงื่อนไขสัญญา
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#quote" data-cta="gps_rental_hero_quote" className={CTA_PRIMARY}>ขอใบเสนอราคาเช่า AED</a>
              <LineButton where="gps_rental_hero">ปรึกษาผ่าน LINE {LINE_DISPLAY_ID}</LineButton>
            </div>
            <Link href={MONITORING_PATH} data-cta="gps_rental_hero_monitoring" className="mt-4 inline-block text-sm font-bold text-[#5eead4] underline underline-offset-4">
              ดูตัวอย่างระบบ Monitoring จริง →
            </Link>
            <p className="m-0 mt-4 max-w-xl text-[11px] leading-relaxed text-[#9fb6c8]" data-testid="hero-price-note">{PRICE_NOTE}</p>
          </div>
          <div className="relative order-first mx-auto w-full max-w-[220px] md:order-none md:max-w-[460px]">
            <div className="absolute inset-6 rounded-full bg-[#0f9b8e] opacity-30 blur-3xl" aria-hidden="true" />
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-white">
              <Image src={HERO_PHOTO.src} alt={HERO_PHOTO.alt} fill priority sizes="(max-width: 768px) 220px, 460px" className="object-contain p-4 md:p-6" />
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/15">
          <div className="market-container flex flex-wrap gap-2 py-4" aria-label="เหมาะกับ">
            {RENT_AUDIENCES.map((a) => (
              <span key={a} className="rounded-full border border-white/20 px-3 py-1 text-xs text-[#dbe7ef]">{a}</span>
            ))}
            <a href="#enterprise" className="rounded-full border border-[#5eead4]/60 px-3 py-1 text-xs font-bold text-[#5eead4]">หน่วยงาน / โครงการขนาดใหญ่ →</a>
          </div>
        </div>
      </section>

      {/* ── 2. Pain points ─────────────────────────────────────────────── */}
      <section className="market-section" aria-labelledby="pain-title">
        <div className="market-container">
          <h2 id="pain-title" className={H2}>ติดตั้ง AED แล้ว ใครเป็นคนตรวจว่าเครื่องยังพร้อมใช้งาน?</h2>
          <ol className="m-0 mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {PAIN_POINTS.map((p, i) => (
              <li key={p.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <span className="text-sm font-extrabold text-[#e5484d]">{String(i + 1).padStart(2, "0")}</span>
                <b className="mt-2 block text-base text-[#0b2545]">{p.title}</b>
                <p className="m-0 mt-1 text-sm text-slate-600">{p.desc}</p>
              </li>
            ))}
          </ol>
          <p className="m-0 mt-5 text-sm text-slate-600">{PAIN_NOTE}</p>
        </div>
      </section>

      {/* ── 3. Product ─────────────────────────────────────────────────── */}
      <section className="market-section bg-slate-50" aria-labelledby="product-title">
        <div className="market-container grid items-start gap-10 lg:grid-cols-2">
          <div>
            <p className={EYEBROW}>เครื่องที่ให้เช่า</p>
            <h2 id="product-title" className={H2}>{PRODUCT_NAME}</h2>
            <ul className="m-0 mt-6 grid list-none gap-3 p-0">
              {PRODUCT_FEATURES.map((f) => (
                <li key={f.title} className="rounded-xl border border-slate-200 bg-white p-4">
                  <b className="block text-sm text-[#0b2545]">{f.title}</b>
                  <span className="text-sm text-slate-600">{f.desc}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PRODUCT_PHOTOS.map((p) => (
              <figure key={p.src} className="m-0 rounded-2xl border border-slate-200 bg-white p-3">
                <div className="relative aspect-square">
                  <Image src={p.src} alt={p.alt} fill sizes="(max-width: 1024px) 45vw, 22vw" className="object-contain" />
                </div>
                <figcaption className="mt-2 text-center text-xs text-slate-500">{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. PRIMEDIC CLOUD ──────────────────────────────────────────── */}
      <section className="market-section" aria-labelledby="cloud-title">
        <div className="market-container">
          <p className={EYEBROW}>PRIMEDIC CLOUD</p>
          <h2 id="cloud-title" className={H2}>ตรวจสอบ AED หลายเครื่องได้จากหน้าจอเดียว</h2>
          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
            <figure className="m-0 overflow-hidden rounded-2xl border border-slate-200 bg-white" data-testid="cloud-snapshot">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-white" style={{ background: NAVY }}>
                <span className="text-sm font-bold">ภาพตัวอย่างจากระบบจริง — AED map</span>
                <SnapshotBadge />
              </div>
              <Image src={CLOUD_SCREENSHOT.src} width={CLOUD_SCREENSHOT.width} height={CLOUD_SCREENSHOT.height} alt={CLOUD_SCREENSHOT.alt} className="h-auto w-full" sizes="(max-width: 1024px) 100vw, 60vw" />
              <div className="grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-200">
                {stats.map((s) => (
                  <div key={s.label} className="px-2 py-4 text-center">
                    <div className={`text-3xl font-extrabold ${s.tone}`}>{s.value}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
              <figcaption className="border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500">
                ข้อมูล ณ {SNAPSHOT_DATE} ไม่ใช่สถานะปัจจุบัน · เบลอข้อมูลลูกค้า ที่อยู่ Serial Number และตำแหน่งรายเครื่องแล้ว
              </figcaption>
            </figure>
            <div className="grid gap-4">
              <figure className="m-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <Image src={CLOUD_DEVICE_SCREENSHOT.src} width={CLOUD_DEVICE_SCREENSHOT.width} height={CLOUD_DEVICE_SCREENSHOT.height} alt={CLOUD_DEVICE_SCREENSHOT.alt} className="h-auto w-full" sizes="(max-width: 1024px) 100vw, 38vw" />
                <figcaption className="border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500">ข้อมูลรายเครื่อง: วันหมดอายุแผ่นอิเล็กโทรดและแบตเตอรี่ · ภาพ ณ {SNAPSHOT_DATE}</figcaption>
              </figure>
              <Link href={MONITORING_PATH} data-cta="gps_rental_cloud_monitoring" className="rounded-xl border border-[#0f9b8e] px-4 py-3 text-center text-sm font-bold text-[#0f9b8e]">
                ดูหน้าจอระบบเพิ่มเติม →
              </Link>
            </div>
          </div>
          <ul className="m-0 mt-8 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {CLOUD_CAPABILITIES.map((c) => (
              <li key={c.title} className="rounded-xl border-l-4 border-[#0f9b8e] bg-slate-50 p-4">
                <b className="block text-sm text-[#0b2545]">{c.title}</b>
                <span className="text-sm text-slate-600">{c.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 5. GPS 4G ──────────────────────────────────────────────────── */}
      <section className="market-section bg-slate-50" aria-labelledby="gps-title">
        <div className="market-container grid items-start gap-10 lg:grid-cols-2">
          <div>
            <p className={EYEBROW}>GPS 4G</p>
            <h2 id="gps-title" className={H2}>ผู้ป่วยไม่ได้หัวใจหยุดเต้นอยู่หน้าตู้ AED เสมอไป</h2>
            <ol className="m-0 mt-6 grid list-none gap-2 p-0">
              {GPS_SCENARIO.map((s, i) => (
                <li key={s} className="flex gap-3 text-sm text-slate-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0b2545] text-xs font-bold text-white">{i + 1}</span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
            <p className="m-0 mt-2 text-[11px] text-slate-500">เหตุการณ์จำลองเพื่ออธิบายการทำงาน</p>
          </div>
          <div>
            <GpsDiagram />
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4" data-testid="gps-limits">
              <b className="block text-sm text-amber-900">ข้อจำกัดที่ควรทราบ</b>
              <ul className="m-0 mt-2 list-disc pl-5 text-sm text-amber-900">
                {GPS_LIMITS.map((l) => <li key={l}>{l}</li>)}
              </ul>
              <p className="m-0 mt-3 text-sm font-extrabold text-[#e5484d]">{EMERGENCY_REMINDER}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Pricing ─────────────────────────────────────────────────── */}
      <section id="pricing" className="market-section scroll-mt-4" aria-labelledby="pricing-title">
        <div className="market-container">
          <h2 id="pricing-title" className={H2}>เลือกเช่า AED ให้เหมาะกับองค์กรของคุณ</h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {PACKAGES.map((p) => (
              <article key={p.id} className={`flex flex-col rounded-2xl border bg-white p-6 ${p.featured ? "border-[#f59e0b] shadow-lg" : "border-slate-200"}`}>
                {p.featured && <span className="mb-2 self-start rounded-full bg-[#f59e0b] px-3 py-0.5 text-xs font-extrabold text-[#0b2545]">แนะนำ</span>}
                <h3 className="m-0 text-xl font-extrabold text-[#0b2545]">{p.name}</h3>
                <p className="m-0 mt-3 text-2xl font-extrabold text-[#c2410c]">{p.price}</p>
                <p className="m-0 text-xs text-slate-500">{p.priceNote}</p>
                <ul className="m-0 mt-4 flex-1 list-disc pl-5 text-sm leading-relaxed text-slate-700">
                  {p.points.map((x) => <li key={x}>{x}</li>)}
                </ul>
                <a href={`#quote-${p.need}`} data-cta={`gps_rental_pkg_${p.id}`} className={`${CTA_PRIMARY} mt-5 w-full`}>{p.cta}</a>
              </article>
            ))}
          </div>
          <p className="m-0 mt-5 text-xs leading-relaxed text-slate-500">
            {PACKAGE_FINE_PRINT} · <Link href="/aed/rental/terms" className="underline">เงื่อนไขการเช่าทั้งหมด</Link> ·{" "}
            <Link href="/aed/rental" className="underline">แผนเช่าทั้งหมด</Link>
          </p>
        </div>
      </section>

      {/* ── 7. After-sales ─────────────────────────────────────────────── */}
      <section className="market-section bg-slate-50" aria-labelledby="service-title">
        <div className="market-container">
          <h2 id="service-title" className={H2}>JIA ไม่ได้ให้เช่าเฉพาะเครื่อง แต่มีระบบช่วยดูแลระหว่างสัญญา</h2>
          <ul className="m-0 mt-8 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_ITEMS.map((s) => (
              <li key={s.title} className="rounded-xl border border-slate-200 bg-white p-4">
                <b className="block text-sm text-[#0b2545]">{s.title}</b>
                <span className="text-sm text-slate-600">{s.desc}</span>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-4 text-xs text-slate-500">ขอบเขตบริการและระยะเวลาเป็นไปตามระดับบริการและสัญญาที่ตกลง</p>
        </div>
      </section>

      {/* ── 8. Training ────────────────────────────────────────────────── */}
      <section className="market-section" aria-labelledby="training-title">
        <div className="market-container grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className={EYEBROW}>Training</p>
            <h2 id="training-title" className={H2}>มี AED พร้อมคนที่รู้วิธีใช้ ยิ่งเพิ่มความพร้อมขององค์กร</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {TRAINING_COURSES.map((c) => (
                <span key={c} className="rounded-full bg-[#0b2545] px-3 py-1 text-xs font-bold text-white">{c}</span>
              ))}
            </div>
            <p className="m-0 mt-4 text-sm text-slate-600">{instructorCredential.course} — {instructorCredential.issuer}</p>
            <p className="m-0 mt-3 text-sm text-slate-700">{TRAINING_NOTE}</p>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
            <Image src={trainingImages[0]} alt="การอบรม CPR และการใช้ AED โดยทีม JIA" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* ── 9. Survivor programme ──────────────────────────────────────── */}
      {SURVIVOR_ENABLED && (
        <section className="bg-[#0f9b8e] py-12 text-white" aria-labelledby="survivor-title">
          <div className="market-container max-w-4xl">
            <p className="m-0 text-xs font-extrabold tracking-[0.14em] text-white/80">โครงการ 10,000 บาทเมื่อรอด</p>
            <h2 id="survivor-title" className="m-0 mt-2 text-[clamp(24px,3vw,36px)] font-extrabold">{SURVIVOR.title}</h2>
            <p className="m-0 mt-3 text-[15px] leading-relaxed text-white/95">{SURVIVOR.body}</p>
            <p className="m-0 mt-3 text-xs text-white/80">{SURVIVOR.note}</p>
          </div>
        </section>
      )}

      {/* ── 10. Government & enterprise ────────────────────────────────── */}
      <section id="enterprise" className="scroll-mt-4 py-16 text-white" style={{ background: NAVY }} aria-labelledby="enterprise-title">
        <div className="market-container">
          <p className="m-0 mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#5eead4]">Government &amp; Enterprise Solution</p>
          <h2 id="enterprise-title" className="m-0 max-w-3xl text-[clamp(26px,3.4vw,42px)] font-extrabold leading-tight">
            จากการติดตั้ง AED สู่เครือข่ายบริหารความพร้อมระดับประเทศ
          </h2>
          <p className="m-0 mt-3 max-w-3xl text-sm text-[#cfe8f3]">
            {BRAND} — แนวทางสำหรับโครงการ AED หลายสิบถึงหลายพันจุด ขนาดโครงการ งบประมาณ และ SLA กำหนดร่วมกันในเอกสารข้อเสนอ
          </p>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <b className="text-sm text-[#5eead4]">เหมาะกับ</b>
              <ul className="m-0 mt-2 list-disc pl-5 text-sm leading-relaxed text-[#dbe7ef]">
                {ENTERPRISE_GROUPS.map((g) => <li key={g}>{g}</li>)}
              </ul>
            </div>
            <div>
              <b className="text-sm text-[#5eead4]">สิ่งที่รวมในข้อเสนอ</b>
              <ul className="m-0 mt-2 list-disc pl-5 text-sm leading-relaxed text-[#dbe7ef]">
                {ENTERPRISE_ITEMS.map((g) => <li key={g}>{g}</li>)}
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#quote-proposal" data-cta="gps_rental_ent_proposal" className={CTA_PRIMARY}>ขอเอกสารข้อเสนอสำหรับองค์กร</a>
            <a href="#quote-demo" data-cta="gps_rental_ent_demo" className="inline-flex items-center justify-center rounded-xl border border-white/40 px-6 py-3.5 text-base font-bold text-white">นัดสาธิตระบบ</a>
            <a href="#quote-project" data-cta="gps_rental_ent_project" className="inline-flex items-center justify-center rounded-xl border border-white/40 px-6 py-3.5 text-base font-bold text-white">ขอใบเสนอราคาโครงการ</a>
          </div>
        </div>
      </section>

      {/* ── 11. Trust & proof + 12. Quote form ─────────────────────────── */}
      <section id="quote" className="market-section scroll-mt-4 bg-slate-50" aria-labelledby="quote-title">
        <div className="market-container grid items-start gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <h2 id="quote-title" className={H2}>ขอใบเสนอราคา</h2>
            <p className="m-0 mt-3 text-sm text-slate-600">กรอกไม่ถึง 1 นาที ทีมงานติดต่อกลับภายใน 24 ชม. (วันทำการ) หรือโทร{" "}
              <a href={PHONE_HREF} data-cta="tel_gps_rental" className="font-bold underline">{PHONE_DISPLAY}</a>
            </p>
            <h3 className="m-0 mt-8 text-base font-extrabold text-[#0b2545]">ข้อมูลที่ตรวจสอบได้</h3>
            <ul className="m-0 mt-3 grid list-none gap-2 p-0 text-sm text-slate-700" data-testid="trust-list">
              <li>✓ ภาพเครื่องและภาพหน้าจอระบบ PRIMEDIC CLOUD จริง (เบลอข้อมูลลูกค้าแล้ว)</li>
              {PRIMEDIC_REGULATORY.published && PRIMEDIC_REGULATORY.certificateHref && (
                <li>
                  ✓ <a href={PRIMEDIC_REGULATORY.certificateHref} target="_blank" rel="noopener noreferrer" className="underline">เอกสารรับแจ้ง {fdaLine(PRIMEDIC_REGULATORY)}</a>
                </li>
              )}
              <li>✓ <Link href="/aed/rental/terms" className="underline">เงื่อนไขการเช่าและสัญญา</Link> เปิดอ่านได้ก่อนตัดสินใจ</li>
              <li>✓ ผู้ให้บริการ: บริษัท เจี่ยรักษา จำกัด · <Link href="/about" className="underline">เกี่ยวกับเรา</Link></li>
            </ul>
          </div>
          <GpsQuoteForm />
        </div>
      </section>

      {/* ── 13. FAQ ────────────────────────────────────────────────────── */}
      <section className="market-section" aria-labelledby="faq-title">
        <div className="market-container max-w-4xl">
          <h2 id="faq-title" className={H2}>คำถามที่พบบ่อย</h2>
          <div className="mt-6">
            {GPS_RENTAL_FAQS.map((f) => (
              <details key={f.question} className="border-b border-slate-200 py-4">
                <summary className="cursor-pointer text-[15px] font-bold text-[#0b2545]">{f.question}</summary>
                <p className="m-0 mt-2 text-sm leading-relaxed text-slate-600">{f.answer}</p>
              </details>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#quote" data-cta="gps_rental_faq_quote" className={CTA_PRIMARY}>ขอใบเสนอราคาเช่า AED</a>
            <LineButton where="gps_rental_faq">ปรึกษาผ่าน LINE {LINE_DISPLAY_ID}</LineButton>
          </div>
        </div>
      </section>

      {/* ── Regulatory footnote ────────────────────────────────────────── */}
      <section className="border-t border-slate-200 py-8">
        <div className="market-container text-[11px] leading-relaxed text-slate-500">
          {PRIMEDIC_REGULATORY.published ? (
            <p className="m-0">
              Automatic External Defibrillator HeartSave Y8 (With networking function) · {fdaLine(PRIMEDIC_REGULATORY)} · นำเข้าโดย {PRIMEDIC_REGULATORY.importer}
              · ใบอนุญาตโฆษณา {jiaaedAdLicenseLine()} · โฆษณาโดย {PRIMEDIC_REGULATORY.advertiser}
            </p>
          ) : (
            <p className="m-0">{PRIMEDIC_REGULATORY.pendingNote}</p>
          )}
          <p className="m-0 mt-1">{AED_INTENDED_USE}</p>
          <p className="m-0 mt-1">{DEVICE_AD_WARNING} · บริการให้เช่าและดูแลเครื่องโดย บริษัท เจี่ยรักษา จำกัด</p>
        </div>
      </section>
    </MarketPage>
  );
}
