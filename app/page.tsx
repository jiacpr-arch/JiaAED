import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketButton, MarketHero, MarketLead, MarketPage } from "./components/MarketShell";
import { FaqStructuredData, ProductStructuredData } from "./components/StructuredData";
import { PriceViewTracker } from "./components/PriceViewTracker";
import { MiniLeadForm } from "./components/MiniLeadForm";
import { primedicModels } from "@/lib/aed/primedic";
import { PRIMEDIC_REGULATORY } from "@/lib/aed/regulatory";
import { LINE_OA } from "@/lib/aed/line";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/aed/contact";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "ซื้อเครื่อง AED สำหรับองค์กร | เทียบรุ่น ราคา และขอใบเสนอราคา",
  description: "เปรียบเทียบ AED HeartSave Y0, Y8 และ Yuwell Y2 พร้อมราคาเริ่มต้น บริการติดตั้ง อบรม CPR และขอใบเสนอราคาจาก JiaAED",
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

// Rendered as the visible FAQ section AND as FAQPage JSON-LD, so the markup
// always mirrors what's on the page (the weekly AI SEO check asserts it).
const homeFaqs: { question: string; answer: string; link?: { href: string; label: string } }[] = [
  { question: "ราคาในหน้านี้รวม VAT แล้วหรือยัง?", answer: "ยังไม่รวม VAT ราคาขึ้นอยู่กับรุ่น ชุดอุปกรณ์ และเงื่อนไขการจัดซื้อ ขอใบเสนอราคาที่ระบุรายการทั้งหมดได้ทาง LINE หรือแบบฟอร์ม" },
  { question: "มีเอกสารสำหรับการจัดซื้อหรือไม่?", answer: "JiaAED ออกใบเสนอราคาและใบกำกับภาษีได้ เอกสารทะเบียน อย. และสเปกสินค้าอยู่ในหน้า", link: { href: "/docs", label: "เอกสารดาวน์โหลด" } },
  { question: "ซื้อแล้วมีการสอนใช้เครื่องไหม?", answer: "มีบริการติดตั้งและอบรม CPR & AED ถึงหน่วยงาน ให้ทีมงานยืนยันขอบเขตและพื้นที่ให้บริการในใบเสนอราคา" },
];

export default function Home() {
  return <MarketPage>
    <ProductStructuredData include="homepage" />
    <FaqStructuredData items={homeFaqs.map((f) => ({ question: f.question, answer: f.link ? `${f.answer} ${f.link.label}` : f.answer }))} />
    <MarketHero eyebrow="AED สำหรับองค์กรและพื้นที่สาธารณะ" title={"ซื้อเครื่อง AED\nให้พร้อมใช้จริง."} description="เปรียบเทียบรุ่นและราคาได้ในหน้าเดียว พร้อมทีมช่วยเลือกเครื่อง จัดส่ง ติดตั้ง และอบรมการใช้ AED ถึงหน่วยงาน" image="/images/jiaaed-hero-2026.png">
      <MarketButton href="#models" lineCta="hero_models">ดูรุ่นและราคา</MarketButton>
      <MarketButton href="/quote" lineCta="hero_quote" secondary>ขอใบเสนอราคา</MarketButton>
      <p className="market-hero-price">ราคาเริ่มต้น <strong>฿{Math.min(...primedicModels.map((m) => m.price)).toLocaleString()}</strong> ก่อน VAT</p>
    </MarketHero>
    <div className="market-trust"><div className="market-container market-trust-inner">
      <span><b>✓</b> {PRIMEDIC_REGULATORY.published ? `อย. ${PRIMEDIC_REGULATORY.fda}` : PRIMEDIC_REGULATORY.pendingNote}</span>
      <span><b>✓</b> เสียงแนะนำภาษาไทย</span><span><b>✓</b> จัดส่งและอบรมถึงที่</span><span><b>✓</b> ออกใบกำกับภาษีได้</span>
    </div></div>
    <section className="market-section market-section-cream" id="models"><div className="market-container">
      <PriceViewTracker targetId="models" />
      <div className="market-section-head"><div><p className="market-eyebrow">FIND YOUR AED</p><h2>3 รุ่นที่เลือกง่าย<br /><em>ตรงกับหน้างาน.</em></h2></div><p>เริ่มจากการใช้งานจริงขององค์กรคุณ แล้วเลือกระดับฟังก์ชันที่ต้องการ ราคาทุกรุ่นแสดงชัดก่อนขอใบเสนอราคา</p></div>
      <div className="market-grid-3">{primedicModels.map((m, i) => <article className={`market-card ${m.id === "primedic-y8" ? "market-card-featured" : ""}`} key={m.id}>
        <div className="market-card-photo"><Image src={m.image} alt={`เครื่อง AED ${m.name}`} width={500} height={400} sizes="(max-width: 700px) 100vw, 33vw" />{m.id === "primedic-y8" && <span className="market-card-tag">รุ่นแนะนำ</span>}</div>
        <div className="market-card-body"><span className="market-card-kicker">0{i + 1} / {i === 0 ? "ESSENTIAL" : i === 1 ? "RECOMMENDED" : "ADVANCED"}</span><h3>{m.name}</h3><p>{fits[m.id]}</p><div className="market-price"><small>เริ่มต้น</small><strong>฿{m.price.toLocaleString()}</strong><span>ก่อน VAT</span></div><ul>{features[m.id].map((f) => <li key={f}>{f}</li>)}</ul><Link href={m.id === "primedic-y2" ? "/aed/yuwell-y2" : "/aed/primedic"} className="market-card-link" data-cta={`home_model_${m.id}`}>ดูรายละเอียดและขอราคา <span aria-hidden="true">↗</span></Link></div>
      </article>)}</div>
      <p className="market-note">ราคาเริ่มต้นก่อน VAT ขึ้นอยู่กับชุดอุปกรณ์และเงื่อนไขจัดซื้อ <Link href="/aed" className="market-text-link">ดูตารางเทียบรุ่นและสเปก ↗</Link></p>
    </div></section>
    <div className="market-help"><div className="market-container market-help-inner"><strong>ยังไม่แน่ใจว่ารุ่นไหนเหมาะ?</strong><p>บอกประเภทสถานที่และงบประมาณ ทีมงานช่วยแนะนำรุ่นที่ตรงการใช้งาน</p><a href={LINE_OA} target="_blank" rel="noopener noreferrer" data-line-cta="home_model_help">ปรึกษาผ่าน LINE ↗</a></div></div>
    <section className="market-section"><div className="market-container market-split"><div className="market-split-photo"><Image src="/images/training-bls-1.jpg" alt="ทีมวิทยากรสอนการทำ CPR แบบลงมือจริง" fill sizes="(max-width: 700px) 100vw, 45vw" /></div><div><p className="market-eyebrow">MORE THAN A DEVICE</p><h2>ได้เครื่อง.<br /><em>ได้ความพร้อม.</em></h2><p>การซื้อ AED ไม่ควรจบที่กล่องสินค้า ทีม JiaAED ช่วยให้องค์กรเลือกจุดติดตั้ง และฝึกทีมให้รู้จักเครื่องก่อนถึงเวลาจำเป็น</p><div className="market-step-list"><div className="market-step"><b>01</b><strong>เลือกเครื่องให้ตรงงาน</strong><span>เทียบรุ่นและฟังก์ชันตามพื้นที่ งบ และคนในทีม</span></div><div className="market-step"><b>02</b><strong>จัดส่งและติดตั้ง</strong><span>เตรียมจุดวางเครื่องให้มองเห็นและหยิบใช้สะดวก</span></div><div className="market-step"><b>03</b><strong>อบรม CPR &amp; AED</strong><span>ฝึกการใช้งานกับทีมงานถึงสถานที่</span></div></div><Link className="market-text-link" href="/training">ดูรายละเอียดการอบรม ↗</Link></div></div></section>
    <section className="market-section market-section-cream"><div className="market-container market-section-head"><div><p className="market-eyebrow">EASY TO START</p><h2>เริ่มจากคำถามเดียว<br /><em>“ติดตั้งที่ไหน?”</em></h2></div><div><p className="market-muted">ส่งประเภทสถานที่ จำนวนจุดติดตั้ง และงบประมาณคร่าว ๆ แล้วรับคำแนะนำรุ่นพร้อมใบเสนอราคาที่ตรงความต้องการ</p><div className="market-mini-nav"><Link href="/quote">กรอกแบบฟอร์ม ↗</Link><a href={PHONE_HREF} data-cta="home_phone">โทร {PHONE_DISPLAY}</a><Link href="/aed/rental">ดูทางเลือกเช่า AED</Link></div></div></div></section>
    <section className="market-section"><div className="market-container market-faq"><div><p className="market-eyebrow">QUICK ANSWERS</p><h2>ก่อนตัดสินใจซื้อ.</h2><p className="market-muted">คำตอบสั้น ๆ สำหรับการจัดซื้อเครื่อง AED ในองค์กร</p></div><div>{homeFaqs.map((f) => <details key={f.question}><summary>{f.question}</summary><p>{f.answer}{f.link && <> <Link href={f.link.href} className="market-text-link">{f.link.label}</Link></>}</p></details>)}</div></div></section>
    <section className="market-section market-section-cream" id="contact"><div className="market-container market-form-section"><div><p className="market-eyebrow">LET’S TALK</p><h2>ให้ทีมงาน<br />ติดต่อกลับ.</h2><p>ฝากเบอร์ไว้ แล้วบอกประเภทสถานที่หรือรุ่นที่สนใจ ทีมงานจะช่วยคัดทางเลือกที่เหมาะให้</p></div><div><MiniLeadForm variant="home_purchase_redesign" theme="light" title="ฝากเบอร์ ทีมงานโทรกลับ" subtitle="หรือขอใบเสนอราคาแบบละเอียดได้ในหน้าแบบฟอร์ม" /></div></div></section>
    <MarketLead />
  </MarketPage>;
}
