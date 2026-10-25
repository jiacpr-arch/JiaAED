import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketButton, MarketHero, MarketLead, MarketPage } from "./components/MarketShell";
import { FaqStructuredData, ProductStructuredData } from "./components/StructuredData";
import { PriceViewTracker } from "./components/PriceViewTracker";
import { MiniLeadForm } from "./components/MiniLeadForm";
import { primedicModels } from "@/lib/aed/primedic";
import { PRIMEDIC_REGULATORY } from "@/lib/aed/regulatory";
import { LINE_OA, LINE_DISPLAY_ID } from "@/lib/aed/line";
import { subscriptionMatrix, subscriptionTiers } from "@/lib/aed/subscription";
import { RENTAL_PRICES, THREE_YEAR_DISCOUNT } from "@/lib/aed/rental-prices";
import { RENT_TO_OWN_TERMS } from "@/lib/aed/packages";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/aed/contact";

export const revalidate = 3600;
export const metadata: Metadata = {
  // The layout's "%s · JiaAED" template only applies to child segments, so the
  // root page has to carry the brand itself.
  title: { absolute: "เช่าเครื่อง AED สำหรับองค์กร พร้อมทีมดูแล | เช่า · เช่าซื้อ · ซื้อขาด · JiaAED" },
  description: "เช่า AED พร้อมใช้สำหรับองค์กร ทีมดูแลแบต แผ่น เครื่องสำรอง และอบรม CPR ให้ตลอดสัญญา — หรือเช่าซื้อ ซื้อขาด Yuwell HeartSave Y0, Y8, Y2 ขอใบเสนอราคาจาก JiaAED",
  alternates: { canonical: "/" },
};

const fits: Record<string, string> = {
  "primedic-y0": "เหมาะกับออฟฟิศ ร้านค้า และพื้นที่ส่วนกลางที่ต้องการเครื่องใช้ง่าย",
  "primedic-y8": "เหมาะกับโรงเรียน ฟิตเนส และโรงงานที่ต้องการตัวช่วยระหว่างทำ CPR",
  "primedic-y2": "เหมาะกับคลินิก หน่วยกู้ชีพ และองค์กรที่ต้องการเห็นข้อมูล CPR บนจอ",
};
const features: Record<string, string[]> = {
  "primedic-y0": ["เสียงนำทางภาษาไทยทีละขั้นตอน", "CPR feedback เพิ่มเป็นอุปกรณ์เสริมได้"],
  "primedic-y8": ["เซ็นเซอร์ช่วยบอกจังหวะและแรงกดหน้าอก", "เสียงนำทางภาษาไทยทีละขั้นตอน"],
  "primedic-y2": ["จอสีแสดง EKG และข้อมูล CPR", "เซ็นเซอร์ CPR feedback ในรุ่น"],
};

// Home rental ladder (owner, 25 ต.ค. 2026: rental first, buying as the fallback
// for customers who hesitate). Prices and inclusions come from ./subscription.ts.
const standardMonthly = subscriptionTiers[0].pricePerMonth;
const tierImages: Record<string, string> = {
  "managed-basic": "/images/yuwell-gps-aed.webp",
  "managed-pro": "/images/aed-gps-tracking.png",
  "managed-elite": "/images/cloud-dashboard.png",
};
const tierBullets = (id: (typeof subscriptionTiers)[number]["id"]) =>
  subscriptionMatrix
    .filter((row) => row.values[id] !== false)
    .slice(0, 6)
    .map((row) => (row.values[id] === true ? row.feature : `${row.feature.replace(/ \(ครั้ง\/ปี\)$/, "")}: ${row.values[id]}`));
const rtoY8 = RENT_TO_OWN_TERMS["pkg-start-y8"];

// Rendered as the visible FAQ section AND as FAQPage JSON-LD, so the markup
// always mirrors what's on the page (the weekly AI SEO check asserts it).
const homeFaqs: { question: string; answer: string; link?: { href: string; label: string } }[] = [
  { question: "เช่ากับซื้อ AED แบบไหนดีกว่า?", answer: `ถ้าไม่อยากจ่ายก้อนใหญ่และไม่อยากดูแลเอง แนะนำเช่า เริ่มเฉลี่ย ฿${standardMonthly.toLocaleString("en-US")}/เดือน ทีมงานเปลี่ยนแบต แผ่น และมีเครื่องสำรองให้ตลอดสัญญา ถ้าอยากเป็นเจ้าของเครื่อง เลือกเช่าซื้อหรือซื้อขาดได้ ดูเปรียบเทียบทั้ง 3 แบบในหน้า`, link: { href: "/aed/packages", label: "แพ็กเกจ AED" } },
  { question: "ราคาในหน้านี้รวม VAT แล้วหรือยัง?", answer: "ยังไม่รวม VAT ราคาขึ้นอยู่กับรุ่น ชุดอุปกรณ์ และเงื่อนไขการจัดซื้อ ขอใบเสนอราคาที่ระบุรายการทั้งหมดได้ทาง LINE หรือแบบฟอร์ม" },
  { question: "มีเอกสารสำหรับการจัดซื้อหรือไม่?", answer: "JiaAED ออกใบเสนอราคาและใบกำกับภาษีได้ เอกสารทะเบียน อย. และสเปกสินค้าอยู่ในหน้า", link: { href: "/docs", label: "เอกสารดาวน์โหลด" } },
  { question: "ซื้อแล้วมีการสอนใช้เครื่องไหม?", answer: "มีบริการติดตั้งและอบรม CPR & AED ถึงหน่วยงาน ให้ทีมงานยืนยันขอบเขตและพื้นที่ให้บริการในใบเสนอราคา" },
];

export default function Home() {
  return <MarketPage>
    <ProductStructuredData include="homepage" />
    <FaqStructuredData items={homeFaqs.map((f) => ({ question: f.question, answer: f.link ? `${f.answer} ${f.link.label}` : f.answer }))} />
    <MarketHero eyebrow="เช่า AED สำหรับองค์กรและพื้นที่สาธารณะ" title={"เช่า AED\nพร้อมใช้ ไม่ต้องดูแลเอง."} description="ไม่ต้องจ่ายก้อนใหญ่ ทีม JiaAED ติดตั้ง ดูแลแบตและแผ่น มีเครื่องสำรองถ้าเสีย และอบรม CPR ให้ทีมของคุณตลอดสัญญา" image="/images/jiaaed-hero-2026.png">
      <MarketButton href="/aed/rental#choose" lineCta="hero_rental">เลือกระยะเวลาเช่า</MarketButton>
      <MarketButton href="/quote" lineCta="hero_quote" secondary>ขอใบเสนอราคา</MarketButton>
      <MarketButton href={LINE_OA} lineCta="hero_line" secondary>ทัก LINE {LINE_DISPLAY_ID}</MarketButton>
      <p className="market-hero-price">เช่าเริ่ม <strong>฿{standardMonthly.toLocaleString()}</strong>/เดือน · ซื้อขาดเริ่ม ฿{Math.min(...primedicModels.map((m) => m.price)).toLocaleString()} ก่อน VAT</p>
    </MarketHero>
    <div className="market-trust"><div className="market-container market-trust-inner">
      <span><b>✓</b> {PRIMEDIC_REGULATORY.published ? `อย. ${PRIMEDIC_REGULATORY.fda}` : PRIMEDIC_REGULATORY.pendingNote}</span>
      <span><b>✓</b> เครื่องสำรองถ้าเสีย</span><span><b>✓</b> เปลี่ยนแบต/แผ่นให้ตลอดสัญญา</span><span><b>✓</b> ออกใบกำกับภาษีได้</span>
    </div></div>
    <section className="market-section market-section-cream" id="rental"><div className="market-container">
      <PriceViewTracker targetId="rental" />
      <div className="market-section-head"><div><p className="market-eyebrow">RENT &amp; RELAX</p><h2>เช่า 3 ระดับ<br /><em>เลือกตามความพร้อมที่ต้องการ.</em></h2></div><p>ทุกระดับใช้เครื่อง Yuwell GPS รวมติดตั้ง เปลี่ยนแบตและแผ่นตามอายุ เครื่องสำรองถ้าเสีย และอบรม CPR สัญญา 1 ปี มัดจำคืนได้</p></div>
      <div className="market-grid-3">{subscriptionTiers.map((t, i) => <article className={`market-card ${t.badge ? "market-card-featured" : ""}`} key={t.id}>
        <div className="market-card-photo"><Image src={tierImages[t.id]} alt={`เช่า AED ระดับ ${t.name}`} width={500} height={400} sizes="(max-width: 700px) 100vw, 33vw" />{t.badge && <span className="market-card-tag">{t.badge}</span>}</div>
        <div className="market-card-body"><span className="market-card-kicker">0{i + 1} / {t.name}</span><h3>{t.name}</h3><p>เหมาะกับ {t.bestFor}</p><div className="market-price"><small>{i === 0 ? "เฉลี่ย" : "เดือนละ"}</small><strong>฿{t.pricePerMonth.toLocaleString()}</strong><span>/เดือน ก่อน VAT</span></div>{t.specialNote && <p className="market-note">{t.specialNote}</p>}<ul>{tierBullets(t.id).map((f) => <li key={f}>{f}</li>)}</ul><Link href="/aed/rental#yearly" className="market-card-link" data-cta={`home_tier_${t.id}`}>ดูรายละเอียดแผนนี้ <span aria-hidden="true">↗</span></Link></div>
      </article>)}</div>
      <div className="market-mini-nav"><Link href="/aed/rental#short" data-cta="home_shortcut_short">ใช้ชั่วคราว: รายวัน ฿{RENTAL_PRICES.eventFirstDay.toLocaleString()} · สัปดาห์ ฿{RENTAL_PRICES.eventWeekly.toLocaleString()} · เดือน ฿{RENTAL_PRICES.oneMonth.toLocaleString()}</Link><Link href="/aed/rental#yearly" data-cta="home_shortcut_yearly">สัญญา 3 ปี ลด {Math.round(THREE_YEAR_DISCOUNT * 100)}%</Link><Link href="/aed/rental#own" data-cta="home_shortcut_own">อยากเป็นเจ้าของ? เช่าซื้อ ฿{rtoY8.monthly.toLocaleString()}/เดือน</Link></div>
    </div></section>
    <section className="market-section" id="models"><div className="market-container">
      <div className="market-section-head"><div><p className="market-eyebrow">PREFER TO OWN?</p><h2>อยากเป็นเจ้าของเครื่อง?<br /><em>ซื้อขาดก็ได้.</em></h2></div><p>สำหรับองค์กรที่มีงบลงทุนและดูแลเครื่องเองได้ ราคาทุกรุ่นแสดงชัด พร้อมจัดส่ง ติดตั้ง และอบรมการใช้งาน</p></div>
      <div className="market-grid-3">{primedicModels.map((m, i) => <article className={`market-card ${m.id === "primedic-y8" ? "market-card-featured" : ""}`} key={m.id}>
        <div className="market-card-photo"><Image src={m.image} alt={`เครื่อง AED ${m.name}`} width={500} height={400} sizes="(max-width: 700px) 100vw, 33vw" />{m.id === "primedic-y8" && <span className="market-card-tag">รุ่นแนะนำ</span>}</div>
        <div className="market-card-body"><span className="market-card-kicker">0{i + 1} / {i === 0 ? "ESSENTIAL" : i === 1 ? "RECOMMENDED" : "ADVANCED"}</span><h3>{m.name}</h3><p>{fits[m.id]}</p><div className="market-price"><small>เริ่มต้น</small><strong>฿{m.price.toLocaleString()}</strong><span>ก่อน VAT</span></div><ul>{features[m.id].map((f) => <li key={f}>{f}</li>)}</ul><Link href={m.id === "primedic-y2" ? "/aed/yuwell-y2" : "/aed/primedic"} className="market-card-link" data-cta={`home_model_${m.id}`}>ดูรายละเอียดและขอราคา <span aria-hidden="true">↗</span></Link></div>
      </article>)}</div>
      <p className="market-note">ราคาเริ่มต้นก่อน VAT ขึ้นอยู่กับชุดอุปกรณ์และเงื่อนไขจัดซื้อ <Link href="/aed" className="market-text-link">ดูตารางเทียบรุ่นและสเปก ↗</Link></p>
    </div></section>
    <div className="market-help"><div className="market-container market-help-inner"><strong>ยังไม่แน่ใจว่าเช่าหรือซื้อดี?</strong><p>บอกประเภทสถานที่และงบประมาณ ทีมงานช่วยเทียบเช่า เช่าซื้อ และซื้อขาดให้</p><a href={LINE_OA} target="_blank" rel="noopener noreferrer" data-line-cta="home_model_help">ปรึกษาผ่าน LINE ↗</a></div></div>
    <section className="market-section"><div className="market-container market-split"><div className="market-split-photo"><Image src="/images/training-bls-1.jpg" alt="ทีมวิทยากรสอนการทำ CPR แบบลงมือจริง" fill sizes="(max-width: 700px) 100vw, 45vw" /></div><div><p className="market-eyebrow">MORE THAN A DEVICE</p><h2>ได้เครื่อง.<br /><em>ได้ความพร้อม.</em></h2><p>เครื่องจะช่วยชีวิตได้ ต้องมีคนกล้าใช้ JiaAED อยู่ในเครือเดียวกับศูนย์อบรม JIA TRAINER CENTER คอร์สออนไลน์ และร้านอุปกรณ์ ทีมของคุณจึงพร้อมตั้งแต่วันแรก</p><div className="market-step-list"><div className="market-step"><b>01</b><strong>เลือกเครื่องให้ตรงงาน</strong><span>เทียบรุ่นและฟังก์ชันตามพื้นที่ งบ และคนในทีม</span></div><div className="market-step"><b>02</b><strong>จัดส่งและติดตั้ง</strong><span>เตรียมจุดวางเครื่องให้มองเห็นและหยิบใช้สะดวก</span></div><div className="market-step"><b>03</b><strong>อบรม CPR &amp; AED</strong><span>เรียนออนไลน์ได้ทั้งองค์กร และฝึกภาคปฏิบัติกับครูจริง</span></div></div><Link className="market-text-link" href="/aed/rental#why">เช่ากับเราได้อะไรมากกว่า ↗</Link></div></div></section>
    <section className="market-section market-section-cream"><div className="market-container market-section-head"><div><p className="market-eyebrow">EASY TO START</p><h2>เริ่มจากคำถามเดียว<br /><em>“ติดตั้งที่ไหน?”</em></h2></div><div><p className="market-muted">ส่งประเภทสถานที่ จำนวนจุดติดตั้ง และงบประมาณคร่าว ๆ แล้วรับคำแนะนำรุ่นพร้อมใบเสนอราคาที่ตรงความต้องการ</p><div className="market-mini-nav"><Link href="/quote">กรอกแบบฟอร์ม ↗</Link><a href={PHONE_HREF} data-cta="home_phone">โทร {PHONE_DISPLAY}</a><Link href="/aed/packages">เทียบเช่า · เช่าซื้อ · ซื้อขาด</Link></div></div></div></section>
    <section className="market-section"><div className="market-container market-faq"><div><p className="market-eyebrow">QUICK ANSWERS</p><h2>ก่อนตัดสินใจ.</h2><p className="market-muted">คำตอบสั้น ๆ เรื่องเช่าและจัดซื้อเครื่อง AED ในองค์กร</p></div><div>{homeFaqs.map((f) => <details key={f.question}><summary>{f.question}</summary><p>{f.answer}{f.link && <> <Link href={f.link.href} className="market-text-link">{f.link.label}</Link></>}</p></details>)}</div></div></section>
    <section className="market-section market-section-cream" id="contact"><div className="market-container market-form-section"><div><p className="market-eyebrow">LET’S TALK</p><h2>ให้ทีมงาน<br />ติดต่อกลับ.</h2><p>ฝากเบอร์ไว้ แล้วบอกประเภทสถานที่หรือรุ่นที่สนใจ ทีมงานจะช่วยคัดทางเลือกที่เหมาะให้</p></div><div><MiniLeadForm variant="home_purchase_redesign" theme="light" title="ฝากเบอร์ ทีมงานโทรกลับ" subtitle="หรือขอใบเสนอราคาแบบละเอียดได้ในหน้าแบบฟอร์ม" /></div></div></section>
    <MarketLead />
  </MarketPage>;
}
