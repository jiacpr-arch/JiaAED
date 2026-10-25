import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketButton, MarketHero, MarketLead, MarketPage } from "@/app/components/MarketShell";
import { MiniLeadForm } from "@/app/components/MiniLeadForm";
import { BreadcrumbStructuredData, FaqStructuredData } from "@/app/components/StructuredData";
import {
  RENTAL_CREDIT_NOTE,
  RENTAL_EXPENSE_NOTE,
  RENTAL_PRICES,
  THREE_YEAR_DISCOUNT,
  multiUnitPricing,
  rentalPlans,
  rentToOwnBreakdowns,
  rentToOwnTotal,
} from "@/lib/aed/rental";
import { subscriptionMatrix, subscriptionTiers } from "@/lib/aed/subscription";
import { primedicModels } from "@/lib/aed/primedic";
import { SISTER_SITES, rentalAdvantages } from "@/lib/aed/ecosystem";
import { RENT_TO_OWN_ELIGIBILITY, RENT_TO_OWN_OWNERSHIP_NOTE } from "@/lib/aed/packages";
import { LINE_OA, LINE_DISPLAY_ID } from "@/lib/aed/line";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "เช่า AED รายวัน รายสัปดาห์ รายเดือน รายปี และเช่าซื้อ — ราคาและเงื่อนไข",
  description:
    "เช่าเครื่อง AED Yuwell GPS เลือกตามระยะเวลาที่ใช้: รายวันสำหรับอีเวนต์ รายสัปดาห์ รายเดือน หรือติดตั้งประจำรายปีพร้อมทีมดูแล และเช่าซื้อเพื่อเป็นเจ้าของ",
  alternates: { canonical: "/aed/rental" },
};

const thb = (n: number) => `฿${n.toLocaleString()}`;
const plan = (id: string) => rentalPlans.find((p) => p.id === id)!;
const eventPlan = plan("rent-event");
const monthPlan = plan("rent-month");
const threeYearPct = Math.round(THREE_YEAR_DISCOUNT * 100);
const cheapestBuy = Math.min(...primedicModels.map((m) => m.price));

// Owner, 25 ต.ค. 2026: visitors pick "how long" first, then see at most three
// prices. Rare durations (3 วัน, 14 วัน, 3–11 เดือน) are a line under the cards
// and are closed in chat; the bots still know every plan.
const shortItems = [
  {
    id: "rent-day",
    kicker: "รายวัน",
    title: "อีเวนต์ 1 วัน",
    price: RENTAL_PRICES.eventFirstDay,
    unit: "/ วันแรก",
    lines: [`วันถัดไป ${thb(RENTAL_PRICES.eventNextDay)}/วัน`, "งานวิ่ง คอนเสิร์ต งานกีฬา กองถ่าย", "ส่ง-รับถึงงาน (คิดตามระยะทาง)"],
    deposit: eventPlan.deposit,
  },
  {
    id: "rent-week",
    kicker: "รายสัปดาห์",
    title: "7 วัน",
    price: RENTAL_PRICES.eventWeekly,
    unit: "/ 7 วัน",
    lines: ["งานหลายวัน ค่าย อบรมนอกสถานที่", "พร้อมแผ่นอิเล็กโทรด + แบตเตอรี่", "แนะนำการใช้งานก่อนเริ่มงาน"],
    deposit: eventPlan.deposit,
  },
  {
    id: "rent-month",
    kicker: "รายเดือน",
    title: "1 เดือน",
    price: RENTAL_PRICES.oneMonth,
    unit: "/ เดือน",
    lines: ["ไม่มีขั้นต่ำ", "ไซต์งานระยะสั้น ออฟฟิศชั่วคราว ทดลองใช้", "พร้อมแผ่นอิเล็กโทรด + แบตเตอรี่"],
    deposit: monthPlan.deposit,
  },
];

const tierImages: Record<string, string> = {
  "managed-basic": "/images/yuwell-gps-aed.webp",
  "managed-pro": "/images/aed-gps-tracking.png",
  "managed-elite": "/images/cloud-dashboard.png",
};
const tierBullets = (id: (typeof subscriptionTiers)[number]["id"]) =>
  subscriptionMatrix
    .filter((row) => row.values[id] !== false)
    .map((row) => (row.values[id] === true ? row.feature : `${row.feature.replace(/ \(ครั้ง\/ปี\)$/, "")}: ${row.values[id]}`));

const rentalFaqs = [
  {
    question: "เช่าสั้นที่สุดได้กี่วัน และนานสุดเท่าไร?",
    answer: `เช่าได้ตั้งแต่ 1 วัน (${thb(RENTAL_PRICES.eventFirstDay)}) ไปจนถึงสัญญารายปี มีแพ็ก 3 วัน ${thb(RENTAL_PRICES.eventWeekend)} · 14 วัน ${thb(RENTAL_PRICES.eventFortnight)} · ใช้ต่อเนื่อง ${RENTAL_PRICES.flexMinMonths}–11 เดือน ${thb(RENTAL_PRICES.flexMonthly)}/เดือน และสัญญา 3 ปีลด ${threeYearPct}%`,
  },
  { question: "เช่าสั้นแล้วอยากทำสัญญารายปีต่อ ได้ส่วนลดไหม?", answer: RENTAL_CREDIT_NOTE },
  { question: "ต้องวางมัดจำเท่าไร?", answer: `รายวัน/รายสัปดาห์: ${eventPlan.deposit} · รายเดือน: ${monthPlan.deposit} · รายปี: ${plan("rent-annual").deposit} มัดจำคืนเต็มจำนวนเมื่อคืนเครื่องครบสภาพ` },
  { question: "เช่าเหมาจ่ายเป็นค่าใช้จ่ายบริษัทได้ไหม?", answer: RENTAL_EXPENSE_NOTE },
  { question: "เช่ากับเช่าซื้อต่างกันอย่างไร?", answer: `แผนเช่าจบสัญญาแล้วคืนเครื่อง ส่วนเช่าซื้อผ่อนครบ ${rentToOwnBreakdowns[0].months} เดือนแล้วเครื่องเป็นของคุณ` },
];

function LineLink({ cta, product, children }: { cta: string; product: string; children: React.ReactNode }) {
  return (
    <a href={LINE_OA} target="_blank" rel="noopener noreferrer" data-line-cta={cta} data-product={product} className="market-card-link">
      {children} <span aria-hidden="true">↗</span>
    </a>
  );
}

export default function RentalPage() {
  return <MarketPage>
    <FaqStructuredData items={rentalFaqs} />
    <BreadcrumbStructuredData items={[{ name: "หน้าแรก", path: "/" }, { name: "AED", path: "/aed" }, { name: "เช่า AED", path: "/aed/rental" }]} />
    <MarketHero eyebrow="AED RENTAL" title="เช่า AED เลือกตามเวลาที่ใช้." description="ตั้งแต่งานวันเดียวไปจนถึงติดตั้งประจำรายปีพร้อมทีมดูแล เครื่อง Yuwell GPS ทุกเครื่อง พร้อมแผ่นและแบตเตอรี่" image="/images/jiaaed-lobby-hero.jpg">
      <MarketButton href="#choose" lineCta="rental_hero_choose">เลือกระยะเวลา</MarketButton>
      <MarketButton href={LINE_OA} lineCta="rental_hero_line" secondary>ทัก LINE {LINE_DISPLAY_ID}</MarketButton>
    </MarketHero>

    <nav id="choose" className="market-tabs" aria-label="เลือกระยะเวลาเช่า"><div className="market-container market-tabs-inner">
      <a href="#short" data-cta="rental_tab_short"><small>① ใช้ชั่วคราว</small><b>วัน · สัปดาห์ · เดือน</b><span>เริ่ม {thb(RENTAL_PRICES.eventFirstDay)}/วัน</span></a>
      <a href="#yearly" data-cta="rental_tab_yearly"><small>② ติดตั้งประจำ</small><b>สัญญารายปี</b><span>เริ่ม {thb(subscriptionTiers[0].pricePerMonth)}/เดือน</span></a>
      <a href="#own" data-cta="rental_tab_own"><small>③ อยากเป็นเจ้าของ</small><b>เช่าซื้อ · ซื้อขาด</b><span>เริ่ม {thb(rentToOwnBreakdowns[0].monthly)}/เดือน</span></a>
    </div></nav>

    <section id="short" className="market-section market-section-cream"><div className="market-container">
      <div className="market-section-head"><div><p className="market-eyebrow">① ใช้ชั่วคราว</p><h2>งานอีเวนต์ ไซต์งาน<br /><em>หรือทดลองใช้.</em></h2></div><p>เช่าเท่าที่ใช้ ส่ง-รับถึงที่ พร้อมแนะนำการใช้งาน {RENTAL_CREDIT_NOTE}</p></div>
      <div className="market-grid-3">{shortItems.map((it) => <article className="market-card" key={it.id}>
        <div className="market-card-body"><span className="market-card-kicker">{it.kicker}</span><h3>{it.title}</h3><div className="market-price"><strong>{thb(it.price)}</strong><span>{it.unit}</span></div><ul>{it.lines.map((l) => <li key={l}>{l}</li>)}</ul><p>มัดจำ: {it.deposit}</p><LineLink cta={`rent_short_${it.id}`} product={it.id}>จองผ่าน LINE</LineLink></div>
      </article>)}</div>
      <p className="market-note">มีแพ็กอื่นด้วย: 3 วัน (ศุกร์–อาทิตย์) {thb(RENTAL_PRICES.eventWeekend)} · 14 วัน {thb(RENTAL_PRICES.eventFortnight)} · ใช้ต่อเนื่อง {RENTAL_PRICES.flexMinMonths}–11 เดือน {thb(RENTAL_PRICES.flexMonthly)}/เดือน — <a href={LINE_OA} target="_blank" rel="noopener noreferrer" data-line-cta="rent_short_other" className="market-text-link">ทักถามได้</a> · ราคายังไม่รวม VAT</p>
    </div></section>

    <section id="yearly" className="market-section"><div className="market-container">
      <div className="market-section-head"><div><p className="market-eyebrow">② ติดตั้งประจำ</p><h2>สัญญารายปี<br /><em>มีทีมดูแลตลอด.</em></h2></div><p>ทุกระดับใช้เครื่อง Yuwell GPS รวมติดตั้ง เปลี่ยนแบตและแผ่นตามอายุ เครื่องสำรองถ้าเสีย และแผ่นฟรีเมื่อใช้ช่วยชีวิตจริง</p></div>
      <div className="market-grid-3">{subscriptionTiers.map((t, i) => <article className={`market-card ${t.badge ? "market-card-featured" : ""}`} key={t.id}>
        <div className="market-card-photo"><Image src={tierImages[t.id]} alt={`เช่า AED ระดับ ${t.name}`} width={500} height={400} sizes="(max-width: 700px) 100vw, 33vw" />{t.badge && <span className="market-card-tag">{t.badge}</span>}</div>
        <div className="market-card-body"><span className="market-card-kicker">เหมาะกับ {t.bestFor}</span><h3>{t.name}</h3><div className="market-price"><small>{i === 0 ? "เฉลี่ย" : "เดือนละ"}</small><strong>{thb(t.pricePerMonth)}</strong><span>/เดือน</span></div><p className="market-note">{t.specialNote ? `${t.specialNote} · ` : ""}สัญญา 3 ปี {thb(t.threeYearPerMonth)}/เดือน</p><ul>{tierBullets(t.id).map((f) => <li key={f}>{f}</li>)}</ul><LineLink cta={`rent_yearly_${t.id}`} product={t.id}>ขอใบเสนอราคาแผนนี้</LineLink></div>
      </article>)}</div>
      <div className="market-feature-grid market-rental-extras">
        <div className="market-feature"><b>หลายเครื่อง ราคาถูกลง</b><p>STANDARD {multiUnitPricing.map((m) => `${m.units} ${thb(m.pricePerUnit)}/เครื่อง/ปี`).join(" · ")}</p></div>
        <div className="market-feature"><b>สัญญา 3 ปี ลด {threeYearPct}%</b><p>ล็อกราคาไว้ 3 ปี ไม่ต้องต่อสัญญาทุกปี</p></div>
        <div className="market-feature"><b>เป็นค่าใช้จ่าย ไม่ใช่สินทรัพย์</b><p>{RENTAL_EXPENSE_NOTE}</p></div>
      </div>
      <p className="market-note">ราคายังไม่รวม VAT · มัดจำ {plan("rent-annual").deposit} · <Link href="/aed/subscription" className="market-text-link">ดูตารางเทียบระดับบริการ ↗</Link></p>
    </div></section>

    <section id="why" className="market-section market-section-cream"><div className="market-container">
      <div className="market-section-head"><div><p className="market-eyebrow">MORE THAN A DEVICE</p><h2>เช่ากับเรา<br /><em>ได้มากกว่าเครื่อง.</em></h2></div><p>เครื่องจะช่วยชีวิตได้ ต้องมีคนกล้าใช้ เราเป็นทั้งศูนย์อบรม คอร์สออนไลน์ และร้านอุปกรณ์ในเครือเดียวกัน ทีมของคุณจึงพร้อมตั้งแต่วันแรก</p></div>
      <div className="market-table-wrap"><table className="market-table"><thead><tr><th scope="col">สิ่งที่ได้</th><th scope="col">เช่ากับ JiaAED</th><th scope="col">เช่าเครื่องทั่วไป</th></tr></thead><tbody>{rentalAdvantages.map((r) => <tr key={r.item}><th scope="row">{r.item}</th><td>{r.jiaaed}</td><td>{r.plain}</td></tr>)}</tbody></table></div>
      <div className="market-feature-grid market-rental-extras">
        <a className="market-feature" href={SISTER_SITES.onlineCpr.url} target="_blank" rel="noopener noreferrer" data-cta="rental_eco_cpr"><b>{SISTER_SITES.onlineCpr.label} ↗</b><p>พนักงานเรียนผ่านมือถือ รับใบประกาศภาคทฤษฎี ทุกแผนรายปีได้สิทธิ์เรียนตามระดับ</p></a>
        <a className="market-feature" href={SISTER_SITES.onlineFirstAid.url} target="_blank" rel="noopener noreferrer" data-cta="rental_eco_firstaid"><b>{SISTER_SITES.onlineFirstAid.label} ↗</b><p>24 บทเรียนสั้น สถานการณ์จำลอง 40 แบบ ส่งลิงก์ให้ทั้งองค์กรได้เลย</p></a>
        <a className="market-feature" href={SISTER_SITES.accessories.url} target="_blank" rel="noopener noreferrer" data-cta="rental_eco_accessories"><b>{SISTER_SITES.accessories.label} ↗</b><p>ตู้ติดผนัง ป้ายจุดติดตั้ง แผ่นและแบตสำรอง AMBU และชุด pocket mask</p></a>
      </div>
    </div></section>

    <section id="own" className="market-section"><div className="market-container">
      <div className="market-section-head"><div><p className="market-eyebrow">③ อยากเป็นเจ้าของ</p><h2>ผ่อนครบ<br /><em>แล้วเป็นเจ้าของ.</em></h2></div><p>สำหรับองค์กรที่อยากได้เครื่องเป็นทรัพย์สินของตัวเอง รู้ยอดรวมตลอดสัญญาก่อนตัดสินใจ</p></div>
      <div className="market-grid-3">
        {rentToOwnBreakdowns.map((p) => <article className="market-card" key={p.packageId}><div className="market-card-body"><span className="market-card-kicker">เช่าซื้อ</span><h3>{p.model}</h3><div className="market-price"><small>เดือนละ</small><strong>{thb(p.monthly)}</strong><span>× {p.months} เดือน</span></div><ul><li>มัดจำ {thb(p.deposit)} (นิติบุคคล)</li><li>รวมทั้งสัญญา {thb(rentToOwnTotal(p))} · {p.cashPriceLabel}</li><li>ผ่อนครบ เครื่องเป็นของท่าน</li></ul><LineLink cta={`rent_own_${p.packageId}`} product={p.packageId}>ขอเงื่อนไขเช่าซื้อ</LineLink></div></article>)}
        <article className="market-card"><div className="market-card-body"><span className="market-card-kicker">ซื้อขาด</span><h3>จ่ายครั้งเดียว</h3><div className="market-price"><small>เริ่ม</small><strong>{thb(cheapestBuy)}</strong><span>ก่อน VAT</span></div><ul><li>เทียบรุ่น Y0 / Y8 / Y2</li><li>จัดส่ง ติดตั้ง และอบรมการใช้งาน</li><li>ออกใบกำกับภาษีได้</li></ul><Link href="/aed" className="market-card-link" data-cta="rent_own_buy">ดูรุ่นและราคาซื้อ <span aria-hidden="true">↗</span></Link></div></article>
      </div>
      <p className="market-note">{RENT_TO_OWN_ELIGIBILITY} · {RENT_TO_OWN_OWNERSHIP_NOTE} · เมื่อชำระครบสัญญา เครื่องเป็นของผู้เช่าซื้อ เงื่อนไขบริการและภาษีให้ยืนยันในใบเสนอราคา</p>
    </div></section>

    <section className="market-section market-section-cream"><div className="market-container market-faq"><div><p className="market-eyebrow">BEFORE YOU DECIDE</p><h2>คำถามเรื่องการเช่า.</h2></div><div>{rentalFaqs.map((f) => <details key={f.question}><summary>{f.question}</summary><p>{f.answer}</p></details>)}</div></div></section>
    <section className="market-section"><div className="market-container market-form-section"><div><p className="market-eyebrow">LET’S PLAN</p><h2>บอกวันและสถานที่<br />ทีมงานช่วยเลือกแผน.</h2><p>ฝากเบอร์ให้ติดต่อกลับ หรือส่งรายละเอียดหน้างานผ่านแบบฟอร์ม</p><div className="market-mini-nav"><Link href="/quote">กรอกแบบฟอร์มละเอียด ↗</Link><Link href="/aed">เทียบรุ่นสำหรับซื้อ</Link></div></div><MiniLeadForm variant="rental_redesign" theme="light" title="ฝากเบอร์ ทีมงานโทรกลับ" /></div></section>
    <MarketLead title="พร้อมเช่า AED สำหรับหน้างาน?" description="ทีมงานช่วยสรุปแผน ราคา มัดจำ และค่าใช้จ่ายรวมก่อนตัดสินใจ" />
  </MarketPage>;
}
