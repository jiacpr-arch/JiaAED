import Image from "next/image";
import Link from "next/link";
import { MiniLeadForm } from "@/app/components/MiniLeadForm";
import { PriceViewTracker } from "@/app/components/PriceViewTracker";
import { LINE_DISPLAY_ID, LINE_OA } from "@/lib/aed/line";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/aed/contact";
import { PRIMEDIC_REGULATORY, fdaLine, thaiDate } from "@/lib/aed/regulatory";
import {
  CLOUD_DEVICE_SCREENSHOT,
  CLOUD_SCREENSHOT,
  CLOUD_SNAPSHOT,
  DASHBOARD_ACCESS_NOTE,
  Y8_GPS_FROM_MONTHLY_THB,
  Y8_GPS_LANDING_PUBLISHED,
  Y8_GPS_PHOTOS,
  Y8_GPS_PRICE_CONDITIONS,
  Y8_GPS_SEGMENTS,
  orgBenefits,
  rentalIncludes,
} from "@/lib/aed/y8-gps-landing";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com";
const PRICE = `฿${Y8_GPS_FROM_MONTHLY_THB.toLocaleString("en-US")}`;
const SNAPSHOT_DATE = thaiDate(CLOUD_SNAPSHOT.date, "long");
// The ฆพ. licence that names Y8 — the only one this page may lean on.
const Y8_AD_LICENSE = PRIMEDIC_REGULATORY.adLicenses.find((l) => /Y8/.test(l.covers));

function SnapshotPanel() {
  const stats = [
    { label: "เครื่องทั้งหมด", value: CLOUD_SNAPSHOT.total, tone: "text-[#182923]" },
    { label: "ปกติ (Normal)", value: CLOUD_SNAPSHOT.normal, tone: "text-[#2f7a4c]" },
    { label: "มีการแจ้งเตือน (Alert)", value: CLOUD_SNAPSHOT.alert, tone: "text-[#c6503c]" },
  ];
  return (
    <figure className="m-0 border border-[var(--m-line)] bg-white" data-testid="cloud-snapshot">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--m-line)] bg-[#182721] px-4 py-3 text-white">
        <span className="text-sm font-bold">PRIMEDIC CLOUD · ภาพรวมเครื่องที่ทีมงานดูแล</span>
        <span className="rounded bg-amber-300 px-2 py-0.5 text-[11px] font-bold text-amber-950">
          ภาพ ณ {SNAPSHOT_DATE} · ไม่ใช่ข้อมูลสด
        </span>
      </div>
      {CLOUD_SCREENSHOT && (
        <div className="border-b border-[var(--m-line)]">
          <Image
            src={CLOUD_SCREENSHOT.src}
            width={CLOUD_SCREENSHOT.width}
            height={CLOUD_SCREENSHOT.height}
            alt={CLOUD_SCREENSHOT.alt}
            className="h-auto w-full"
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        </div>
      )}
      <div className="grid grid-cols-3 divide-x divide-[var(--m-line)]">
        {stats.map((s) => (
          <div key={s.label} className="px-2 py-5 text-center sm:px-4">
            <div className={`text-3xl font-extrabold sm:text-4xl ${s.tone}`}>{s.value}</div>
            <div className="mt-1 text-[11px] leading-tight text-[var(--m-muted)] sm:text-xs">{s.label}</div>
          </div>
        ))}
      </div>
      <figcaption className="border-t border-[var(--m-line)] px-4 py-3 text-[11px] leading-relaxed text-[var(--m-muted)]">
        ตัวเลขจากหน้า Dashboard ของกลุ่มเครื่องที่เจี่ยรักษาดูแล ณ วันที่ระบุ ใช้แสดงลักษณะการทำงานของระบบเท่านั้น
        ไม่ได้อัปเดตอัตโนมัติ · ไม่แสดงชื่อลูกค้า ที่อยู่ หมายเลขเครื่อง และพิกัดรายเครื่อง · {DASHBOARD_ACCESS_NOTE}
      </figcaption>
    </figure>
  );
}

// `embedded`: rendered inside an <iframe> on www.jia1669.com (the website named
// in ฆพ.287/2567). No site header/footer; links that leave the landing open in a
// new tab so the visitor keeps the jia1669.com page.
export function Y8GpsLandingContent({ embedded = false }: { embedded?: boolean }) {
  const away = embedded ? { target: "_blank", rel: "noopener noreferrer" } : {};
  const href = (path: string) => (embedded ? `${SITE}${path}` : path);
  return (
    <>
      {!Y8_GPS_LANDING_PUBLISHED && (
        <div className="bg-amber-300 px-4 py-2 text-center text-xs font-bold text-amber-950" role="note">
          PREVIEW — หน้านี้ยังไม่เผยแพร่ (noindex) · รออนุมัติข้อความโฆษณา ราคา และภาพก่อนยิงโฆษณา
        </div>
      )}
      <PriceViewTracker targetId="rent" />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#182822] text-white">
        <div className="market-container grid items-center gap-8 py-12 md:grid-cols-[1.15fr_.85fr] md:py-16">
          <div>
            <p className="market-eyebrow">JIA × Yuwell HeartSave Y8 GPS 4G</p>
            <h1 className="m-0 text-[clamp(30px,4.6vw,56px)] font-extrabold leading-[1.2] tracking-[-0.04em]">
              เช่า AED พร้อม GPS
              <br />
              ทีมงานเห็นสถานะเครื่องให้
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-[1.85] text-[#e3e9e3]">
              เครื่อง HeartSave Y8 สีแดง พร้อมโมดูล GPS ทีมเจี่ยรักษาดูสถานะแบตเตอรี่ แผ่นอิเล็กโทรด
              และผล Self-test ผ่านระบบ PRIMEDIC CLOUD แล้วติดต่อกลับเมื่อเครื่องต้องดูแล
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2" data-testid="segment-split">
              <a
                href="#rent"
                data-cta="y8gps_hero_rent"
                className="block border border-[#eb624b] bg-[#eb624b] px-4 py-4 text-white transition hover:bg-[#d44c37]"
              >
                <span className="block text-[11px] font-bold uppercase tracking-widest text-white/80">ลูกค้าเช่า</span>
                <span className="mt-1 block text-lg font-extrabold">เริ่ม {PRICE}/เดือน →</span>
                <span className="block text-[11px] text-white/80">เฉลี่ยต่อเดือน · ชำระรายปี · ไม่รวม VAT</span>
              </a>
              <a
                href="#org"
                data-cta="y8gps_hero_org"
                className="block border border-[#ccd3ca] px-4 py-4 text-white transition hover:bg-white hover:text-[#182923]"
              >
                <span className="block text-[11px] font-bold uppercase tracking-widest opacity-80">องค์กร / ภาครัฐ</span>
                <span className="mt-1 block text-lg font-extrabold">ขอ White Paper / เดโม →</span>
                <span className="block text-[11px] opacity-80">สำหรับฝ่ายจัดซื้อและคณะกรรมการ</span>
              </a>
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[420px] bg-white">
            <Image
              src={Y8_GPS_PHOTOS.hero.src}
              alt={Y8_GPS_PHOTOS.hero.alt}
              fill
              priority
              sizes="(max-width: 768px) 90vw, 420px"
              className="object-contain p-6"
            />
          </div>
        </div>
      </section>

      {/* ── Rental customers ─────────────────────────────────────────────── */}
      <section id="rent" className="market-section scroll-mt-4" aria-labelledby="rent-title">
        <div className="market-container grid items-start gap-10 md:grid-cols-2">
          <div>
            <p className="market-eyebrow !text-[#c6503c]">สำหรับลูกค้าเช่า</p>
            <h2 id="rent-title" className="m-0 text-[clamp(28px,3.6vw,44px)] font-extrabold leading-tight tracking-[-0.04em]">
              เริ่ม <em className="not-italic text-[#eb624b]">{PRICE}</em>/เดือน
            </h2>
            <p className="m-0 mt-1 text-sm font-bold text-[var(--m-ink)]">แผนรายปี STANDARD · เฉลี่ยต่อเดือน</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--m-muted)]" data-testid="price-conditions">
              {Y8_GPS_PRICE_CONDITIONS} ·{" "}
              <Link href={href("/aed/rental/terms")} className="underline" {...away}>อ่านเงื่อนไขการเช่า</Link>
            </p>
            <ul className="market-list">
              {rentalIncludes.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <div className="market-actions">
              <a
                href={LINE_OA}
                target="_blank"
                rel="noopener noreferrer"
                data-line-cta="y8gps_rent_line"
                data-product="yuwell-gps"
                className="market-button market-button-primary !bg-[#06C755] hover:!bg-[#05a847]"
              >
                ทัก LINE {LINE_DISPLAY_ID} ขอราคา<span aria-hidden="true">↗</span>
              </a>
              <a href={PHONE_HREF} data-cta="tel_y8gps_rent" className="text-sm font-bold text-[#326344] underline underline-offset-4">
                โทร {PHONE_DISPLAY}
              </a>
            </div>
          </div>
          <div className="space-y-4">
            <div className="relative aspect-square w-full bg-[#e9eee8]">
              <Image
                src={Y8_GPS_PHOTOS.open.src}
                alt={Y8_GPS_PHOTOS.open.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-6 mix-blend-multiply"
              />
            </div>
            <MiniLeadForm
              theme="light"
              variant={Y8_GPS_SEGMENTS.rent.variant}
              source={Y8_GPS_SEGMENTS.rent.source}
              productId={Y8_GPS_SEGMENTS.rent.productId}
              messageTag="[เช่า Y8 GPS] ขอราคาเช่า"
              title="ฝากเบอร์ ขอราคาเช่า"
              subtitle="ทีมงานโทรกลับภายใน 24 ชม. · ไม่มีค่าใช้จ่าย"
            />
          </div>
        </div>
      </section>

      {/* ── Dashboard snapshot (shared proof) ────────────────────────────── */}
      <section className="market-section market-section-cream" aria-labelledby="cloud-title">
        <div className="market-container">
          <div className="max-w-3xl">
            <p className="market-eyebrow !text-[#c6503c]">PRIMEDIC CLOUD</p>
            <h2 id="cloud-title" className="m-0 text-[clamp(26px,3.2vw,40px)] font-extrabold leading-tight tracking-[-0.04em]">
              เห็นว่าเครื่องไหนพร้อม เครื่องไหนต้องดูแล
            </h2>
            <p className="market-muted mt-4">
              เครื่องรายงานสถานะเข้าระบบ ทีมงานเห็นทั้งภาพรวมและเครื่องที่มีการแจ้งเตือน
              เพื่อนัดเปลี่ยนแบตเตอรี่หรือแผ่นอิเล็กโทรดก่อนถึงวันที่ต้องใช้จริง
            </p>
          </div>
          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
            <SnapshotPanel />
            {CLOUD_DEVICE_SCREENSHOT && (
              <figure className="m-0 border border-[var(--m-line)] bg-white" data-testid="cloud-device">
                <div className="border-b border-[var(--m-line)] bg-[#182721] px-4 py-3 text-sm font-bold text-white">
                  ข้อมูลรายเครื่อง · วันหมดอายุแผ่นอิเล็กโทรดและแบตเตอรี่
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
                  ภาพหน้าจอ ณ {SNAPSHOT_DATE} · ปิดทับหมายเลขเครื่อง หมายเลขแบตเตอรี่ และตำแหน่งติดตั้งแล้ว
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </section>

      {/* ── Organisations / government ───────────────────────────────────── */}
      <section id="org" className="market-section scroll-mt-4" aria-labelledby="org-title">
        <div className="market-container">
          <p className="market-eyebrow !text-[#c6503c]">สำหรับองค์กรและหน่วยงานภาครัฐ</p>
          <h2 id="org-title" className="m-0 max-w-3xl text-[clamp(28px,3.6vw,44px)] font-extrabold leading-tight tracking-[-0.04em]">
            ดูแล AED หลายจุดด้วยข้อมูล ไม่ใช่การเดินตรวจ
          </h2>
          <div className="market-feature-grid mt-8 !grid-cols-1 sm:!grid-cols-2">
            {orgBenefits.map((b) => (
              <div key={b.title} className="market-feature">
                <b>{b.title}</b>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="border border-[var(--m-line)] p-5">
              <h3 className="m-0 text-lg font-extrabold">ขอ White Paper</h3>
              <p className="mt-2 text-sm text-[var(--m-muted)]">
                สรุปการทำงานของระบบ ขอบเขตบริการ เอกสาร อย./ฆพ. และตัวอย่างเงื่อนไขสัญญาเช่า ทีมงานส่งให้ทางอีเมลหรือ LINE
              </p>
              <MiniLeadForm
                theme="light"
                variant={`${Y8_GPS_SEGMENTS.org.variant}_whitepaper`}
                source={Y8_GPS_SEGMENTS.org.source}
                productId={Y8_GPS_SEGMENTS.org.productId}
                askCompany
                messageTag="[องค์กร/ภาครัฐ Y8 GPS] ขอ White Paper"
                title="รับ White Paper"
                subtitle="ระบุชื่อหน่วยงาน ทีมงานติดต่อกลับเพื่อส่งเอกสาร"
                submitLabel="ขอเอกสาร"
              />
            </div>
            <div className="border border-[var(--m-line)] p-5">
              <h3 className="m-0 text-lg font-extrabold">นัดเดโมระบบ</h3>
              <p className="mt-2 text-sm text-[var(--m-muted)]">
                ดูเครื่องจริงและหน้าจอระบบกับทีมงาน (ออนไลน์หรือนัดหมายหน้างาน) ก่อนเสนอคณะกรรมการ
              </p>
              <MiniLeadForm
                theme="light"
                variant={`${Y8_GPS_SEGMENTS.org.variant}_demo`}
                source={Y8_GPS_SEGMENTS.org.source}
                productId={Y8_GPS_SEGMENTS.org.productId}
                askCompany
                messageTag="[องค์กร/ภาครัฐ Y8 GPS] ขอนัดเดโม"
                title="ขอนัดเดโม"
                subtitle="ทีมงานโทรนัดวันเวลาที่สะดวก"
                submitLabel="นัดเดโม"
              />
            </div>
          </div>
          <div className="mt-6">
            <Link href={href("/docs")} data-cta="y8gps_org_docs" className="market-text-link" {...away}>
              ดูเอกสารดาวน์โหลด (อย. / สเปก) →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Regulatory footnote ──────────────────────────────────────────── */}
      <section className="border-t border-[var(--m-line)] bg-[var(--m-cream)] py-8">
        <div className="market-container text-[11px] leading-relaxed text-[var(--m-muted)]" data-testid="reg-footnote">
          {PRIMEDIC_REGULATORY.published ? (
            <p className="m-0">
              Automatic External Defibrillator HeartSave Y8 · {fdaLine(PRIMEDIC_REGULATORY)} · นำเข้าโดย {PRIMEDIC_REGULATORY.importer}
              {Y8_AD_LICENSE && <> · ใบอนุญาตโฆษณา ฆพ.{Y8_AD_LICENSE.number}</>} · โฆษณาโดย {PRIMEDIC_REGULATORY.advertiser}
            </p>
          ) : (
            <p className="m-0">{PRIMEDIC_REGULATORY.pendingNote}</p>
          )}
          <p className="m-0 mt-1">
            เครื่องมือแพทย์ โปรดอ่านคำเตือนและศึกษาวิธีใช้ก่อนใช้งาน · บริการให้เช่าและดูแลเครื่องโดย บริษัท เจี่ยรักษา จำกัด
          </p>
        </div>
      </section>
    </>
  );
}
