import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketPage } from "@/app/components/MarketShell";
import { MiniLeadForm } from "@/app/components/MiniLeadForm";
import { BreadcrumbStructuredData } from "@/app/components/StructuredData";
import { LINE_DISPLAY_ID, LINE_OA } from "@/lib/aed/line";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/aed/contact";
import { PRIMEDIC_REGULATORY, fdaLine, thaiDate } from "@/lib/aed/regulatory";
import {
  APP_NAME,
  APP_SCREENSHOTS,
  CLOUD_DEVICE_SCREENSHOT,
  CLOUD_GALLERY,
  CLOUD_SCREENSHOT,
  CLOUD_SNAPSHOT,
  DASHBOARD_ACCESS_NOTE,
  MONITORING_LEAD,
  MONITORING_PATH,
  SELF_TEST_INTERVAL,
  appFeatures,
  monitoredItems,
  monitoringSteps,
} from "@/lib/aed/monitoring-page";

export const revalidate = 3600;

const SNAPSHOT_DATE = thaiDate(CLOUD_SNAPSHOT.date, "long");

export const metadata: Metadata = {
  title: "ระบบตรวจเครื่อง AED ออนไลน์ — ทีมงานดูแลความพร้อมเครื่องให้อย่างไร",
  description:
    `เครื่อง AED ที่เจี่ยรักษาดูแลทำ Self-test อัตโนมัติ${SELF_TEST_INTERVAL} และส่งผลเข้าระบบ PRIMEDIC CLOUD ` +
    "ทีมงานเห็นสถานะแบตเตอรี่ แผ่นอิเล็กโทรด และผลตรวจของทุกเครื่อง แล้วติดต่อแก้ไขก่อนถึงวันที่ต้องใช้",
  alternates: { canonical: MONITORING_PATH },
  openGraph: {
    title: "ระบบตรวจเครื่อง AED ออนไลน์ของเจี่ยรักษา",
    description: "ดูหน้าจอระบบจริงที่ทีมงานใช้ตรวจความพร้อมเครื่อง AED ทุกเครื่อง",
    url: MONITORING_PATH,
    images: [{ url: CLOUD_SCREENSHOT.src, width: CLOUD_SCREENSHOT.width, height: CLOUD_SCREENSHOT.height }],
    type: "website",
  },
};

function SnapshotBadge() {
  return (
    <span className="rounded bg-amber-300 px-2 py-0.5 text-[11px] font-bold text-amber-950">
      ภาพ ณ {SNAPSHOT_DATE} · ไม่ใช่ข้อมูลสด
    </span>
  );
}

export default function MonitoringPage() {
  const stats = [
    { label: "เครื่องทั้งหมด", value: CLOUD_SNAPSHOT.total, tone: "text-[#182923]" },
    { label: "ปกติ (Normal)", value: CLOUD_SNAPSHOT.normal, tone: "text-[#2f7a4c]" },
    { label: "มีการแจ้งเตือน (Alert)", value: CLOUD_SNAPSHOT.alert, tone: "text-[#c6503c]" },
  ];

  return (
    <MarketPage>
      <BreadcrumbStructuredData
        items={[
          { name: "หน้าแรก", path: "/" },
          { name: "เช่า AED", path: "/aed/rental" },
          { name: "ระบบตรวจเครื่องออนไลน์", path: MONITORING_PATH },
        ]}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#182822] text-white">
        <div className="market-container py-12 md:py-16">
          <p className="market-eyebrow">PRIMEDIC CLOUD · ระบบตรวจเครื่องออนไลน์</p>
          <h1 className="m-0 max-w-3xl text-[clamp(30px,4.6vw,56px)] font-extrabold leading-[1.2] tracking-[-0.04em]">
            เครื่อง AED ของคุณ
            <br />
            ถูกตรวจทุกวัน ทีมงานเห็นผลทุกเครื่อง
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.85] text-[#e3e9e3]">
            หน้านี้พาดูระบบจริงที่ทีมเจี่ยรักษาใช้ดูแลเครื่อง AED ของลูกค้า — เครื่องตรวจตัวเอง ส่งผลเข้าระบบออนไลน์
            และทีมงานติดต่อแก้ไขก่อนเครื่องจะไม่พร้อมใช้
          </p>
          <div className="market-actions mt-6">
            <a href="#how" data-cta="monitoring_hero_how" className="market-button market-button-primary">
              ดูขั้นตอนการตรวจ<span aria-hidden="true">↓</span>
            </a>
            <a href="#screens" data-cta="monitoring_hero_screens" className="market-button market-button-outline">
              ดูหน้าจอระบบจริง<span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="market-section scroll-mt-4" aria-labelledby="how-title">
        <div className="market-container">
          <p className="market-eyebrow !text-[#c6503c]">ขั้นตอน</p>
          <h2 id="how-title" className="m-0 text-[clamp(26px,3.2vw,40px)] font-extrabold leading-tight tracking-[-0.04em]">
            เราตรวจเครื่องของคุณอย่างไร
          </h2>
          <ol className="m-0 mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {monitoringSteps.map((s, i) => (
              <li key={s.title} className="border border-[var(--m-line)] bg-white p-5">
                <span className="text-sm font-extrabold text-[#eb624b]">{String(i + 1).padStart(2, "0")}</span>
                <b className="mt-2 block text-base">{s.title}</b>
                <p className="m-0 mt-2 text-sm leading-relaxed text-[var(--m-muted)]">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Real screens ─────────────────────────────────────────────────── */}
      <section id="screens" className="market-section market-section-cream scroll-mt-4" aria-labelledby="screens-title">
        <div className="market-container">
          <div className="max-w-3xl">
            <p className="market-eyebrow !text-[#c6503c]">หน้าจอระบบจริง</p>
            <h2 id="screens-title" className="m-0 text-[clamp(26px,3.2vw,40px)] font-extrabold leading-tight tracking-[-0.04em]">
              เห็นว่าเครื่องไหนพร้อม เครื่องไหนต้องดูแล
            </h2>
            <p className="market-muted mt-4">
              ภาพจากระบบ PRIMEDIC CLOUD ของกลุ่มเครื่องที่เจี่ยรักษาดูแล ปิดทับชื่อลูกค้า ที่อยู่ หมายเลขเครื่อง
              และตำแหน่งรายเครื่องแล้ว
            </p>
          </div>

          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
            <figure className="m-0 border border-[var(--m-line)] bg-white" data-testid="cloud-snapshot">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#182721] px-4 py-3 text-white">
                <span className="text-sm font-bold">ภาพรวมทุกเครื่อง (AED map)</span>
                <SnapshotBadge />
              </div>
              <Image
                src={CLOUD_SCREENSHOT.src}
                width={CLOUD_SCREENSHOT.width}
                height={CLOUD_SCREENSHOT.height}
                alt={CLOUD_SCREENSHOT.alt}
                className="h-auto w-full"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="grid grid-cols-3 divide-x divide-[var(--m-line)] border-t border-[var(--m-line)]">
                {stats.map((s) => (
                  <div key={s.label} className="px-2 py-5 text-center sm:px-4">
                    <div className={`text-3xl font-extrabold sm:text-4xl ${s.tone}`}>{s.value}</div>
                    <div className="mt-1 text-[11px] leading-tight text-[var(--m-muted)] sm:text-xs">{s.label}</div>
                  </div>
                ))}
              </div>
              <figcaption className="border-t border-[var(--m-line)] px-4 py-3 text-[11px] leading-relaxed text-[var(--m-muted)]">
                ตัวเลข ณ วันที่ระบุ ไม่ได้อัปเดตอัตโนมัติ — เครื่องที่ขึ้น Alert คือเครื่องที่ทีมงานต้องติดตามและแก้ไข
              </figcaption>
            </figure>

            <figure className="m-0 border border-[var(--m-line)] bg-white" data-testid="cloud-device">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#182721] px-4 py-3 text-white">
                <span className="text-sm font-bold">ข้อมูลรายเครื่อง</span>
                <SnapshotBadge />
              </div>
              <Image
                src={CLOUD_DEVICE_SCREENSHOT.src}
                width={CLOUD_DEVICE_SCREENSHOT.width}
                height={CLOUD_DEVICE_SCREENSHOT.height}
                alt={CLOUD_DEVICE_SCREENSHOT.alt}
                className="h-auto w-full"
                sizes="(max-width: 1024px) 100vw, 38vw"
              />
              <figcaption className="border-t border-[var(--m-line)] px-4 py-3 text-[11px] leading-relaxed text-[var(--m-muted)]">
                รุ่น วันผลิต และวันหมดอายุแผ่นอิเล็กโทรด/แบตเตอรี่ของแต่ละเครื่อง — ทีมงานใช้นัดเปลี่ยนล่วงหน้า
              </figcaption>
            </figure>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2" data-testid="cloud-gallery">
            {CLOUD_GALLERY.map((g) => (
              <figure key={g.src} className="m-0 border border-[var(--m-line)] bg-white">
                <Image src={g.src} width={g.width} height={g.height} alt={g.alt} className="h-auto w-full" sizes="(max-width: 768px) 100vw, 50vw" />
                <figcaption className="border-t border-[var(--m-line)] px-4 py-2 text-xs text-[var(--m-muted)]">
                  {g.caption} · ภาพ ณ {SNAPSHOT_DATE}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── What gets checked ───────────────────────────────────────────── */}
      <section className="market-section" aria-labelledby="items-title">
        <div className="market-container grid items-start gap-10 md:grid-cols-2">
          <div>
            <p className="market-eyebrow !text-[#c6503c]">ระบบดูอะไรบ้าง</p>
            <h2 id="items-title" className="m-0 text-[clamp(26px,3.2vw,40px)] font-extrabold leading-tight tracking-[-0.04em]">
              ข้อมูลที่ทีมงานเห็นของทุกเครื่อง
            </h2>
            <p className="market-muted mt-4">
              ไม่ต้องรอให้ลูกค้าเดินไปดูไฟสถานะที่ตัวเครื่อง ทีมงานเห็นข้อมูลชุดนี้จากระบบ และติดต่อกลับเมื่อมีอะไรต้องดูแล
            </p>
            <p className="mt-4 text-xs leading-relaxed text-[var(--m-muted)]">{DASHBOARD_ACCESS_NOTE}</p>
          </div>
          <ul className="m-0 grid list-none gap-3 p-0">
            {monitoredItems.map((m) => (
              <li key={m.title} className="border border-[var(--m-line)] p-4">
                <b className="block text-sm">{m.title}</b>
                <span className="text-sm text-[var(--m-muted)]">{m.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Mobile app ───────────────────────────────────────────────────── */}
      <section className="market-section market-section-cream" aria-labelledby="app-title" data-testid="app-section">
        <div className="market-container">
          <div className="max-w-3xl">
            <p className="market-eyebrow !text-[#c6503c]">แอปมือถือ {APP_NAME}</p>
            <h2 id="app-title" className="m-0 text-[clamp(26px,3.2vw,40px)] font-extrabold leading-tight tracking-[-0.04em]">
              คนรอบข้างหาเครื่องเจอ ในวันที่ต้องใช้จริง
            </h2>
            <p className="market-muted mt-4">
              นอกจากทีมงานเห็นสถานะเครื่องหลังบ้าน จุดติดตั้งที่เปิดให้สาธารณะเข้าถึงยังแสดงในแอป {APP_NAME} ของ PRIMEDIC
              ให้คนที่อยู่ใกล้ค้นหาเครื่อง AED ที่ใกล้ที่สุดและเดินไปถึงเครื่องได้เร็ว
            </p>
          </div>
          <div className={`mt-8 grid items-start gap-6 ${APP_SCREENSHOTS.length ? "lg:grid-cols-[1fr_1fr]" : ""}`}>
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
              {appFeatures.map((f) => (
                <li key={f.title} className="border border-[var(--m-line)] bg-white p-4">
                  <b className="block text-sm">{f.title}</b>
                  <span className="text-sm text-[var(--m-muted)]">{f.desc}</span>
                </li>
              ))}
            </ul>
            {APP_SCREENSHOTS.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {APP_SCREENSHOTS.map((a) => (
                  <Image key={a.src} src={a.src} width={a.width} height={a.height} alt={a.alt} className="h-auto w-full border border-[var(--m-line)]" sizes="(max-width: 1024px) 50vw, 25vw" />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <section className="market-section" aria-labelledby="contact-title">
        <div className="market-container grid items-start gap-10 md:grid-cols-2">
          <div>
            <h2 id="contact-title" className="m-0 text-[clamp(26px,3.2vw,40px)] font-extrabold leading-tight tracking-[-0.04em]">
              อยากให้ทีมงานดูแลเครื่องให้แบบนี้?
            </h2>
            <p className="market-muted mt-4">
              บริการนี้มากับเครื่อง AED รุ่น GPS ในแผนเช่าและบริการดูแลของเจี่ยรักษา ดูรายละเอียดแผนได้ที่{" "}
              <Link href="/aed/rental" className="underline">เช่า AED</Link> และ{" "}
              <Link href="/aed/subscription" className="underline">บริการดูแล AED</Link> หรือขอให้ทีมงานพาดูระบบจริง
            </p>
            <div className="market-actions mt-6">
              <a
                href={LINE_OA}
                target="_blank"
                rel="noopener noreferrer"
                data-line-cta="monitoring_line"
                data-product="yuwell-gps"
                className="market-button market-button-primary !bg-[#06C755] hover:!bg-[#05a847]"
              >
                ทัก LINE {LINE_DISPLAY_ID}<span aria-hidden="true">↗</span>
              </a>
              <a href={PHONE_HREF} data-cta="tel_monitoring" className="text-sm font-bold text-[#326344] underline underline-offset-4">
                โทร {PHONE_DISPLAY}
              </a>
            </div>
          </div>
          <MiniLeadForm
            theme="light"
            variant={MONITORING_LEAD.variant}
            source={MONITORING_LEAD.source}
            productId={MONITORING_LEAD.productId}
            askCompany
            messageTag="[ระบบตรวจเครื่องออนไลน์] ขอให้ทีมงานพาดูระบบ"
            title="ขอให้ทีมงานพาดูระบบ"
            subtitle="ทีมงานโทรกลับภายใน 24 ชม."
            submitLabel="ส่ง"
          />
        </div>
      </section>

      {/* ── Regulatory footnote ──────────────────────────────────────────── */}
      <section className="border-t border-[var(--m-line)] py-8">
        <div className="market-container text-[11px] leading-relaxed text-[var(--m-muted)]">
          {PRIMEDIC_REGULATORY.published ? (
            <p className="m-0">
              เครื่อง AED Yuwell/PRIMEDIC HeartSave · {fdaLine(PRIMEDIC_REGULATORY)} · นำเข้าโดย {PRIMEDIC_REGULATORY.importer}
            </p>
          ) : (
            <p className="m-0">{PRIMEDIC_REGULATORY.pendingNote}</p>
          )}
          <p className="m-0 mt-1">เครื่องมือแพทย์ โปรดอ่านคำเตือนและศึกษาวิธีใช้ก่อนใช้งาน · บริการดูแลเครื่องโดย บริษัท เจี่ยรักษา จำกัด</p>
        </div>
      </section>
    </MarketPage>
  );
}
