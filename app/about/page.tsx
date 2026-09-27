import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketButton, MarketHero, MarketLead, MarketPage } from "@/app/components/MarketShell";
import { trustStats, trustedBy } from "@/lib/aed/trust";
import { PRIMEDIC_REGULATORY } from "@/lib/aed/regulatory";

export const metadata: Metadata = { title: "เกี่ยวกับ JiaAED และเจี่ยรักษา", description: "ทีมเจี่ยรักษาดูแลเครื่อง AED ให้องค์กร พร้อมบริการเลือกเครื่อง ติดตั้ง และอบรม CPR", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return <MarketPage>
    <MarketHero eyebrow="ABOUT JIAAED" title="เครื่องพร้อมใช้ เพราะมีคนดูแล." description="เจี่ยรักษาช่วยองค์กรตั้งแต่เลือกเครื่อง AED และจุดติดตั้ง ไปจนถึงอบรมคนใช้และดูแลหลังการขาย" image="/images/jiaaed-hero-2026.png"><MarketButton href="#story">รู้จักเรา</MarketButton><MarketButton href="/quote" secondary>คุยกับทีมงาน</MarketButton></MarketHero>
    <div className="market-trust"><div className="market-container market-trust-inner">{trustStats.map((s) => <span key={s.label}><b>{s.value}</b> {s.label}</span>)}</div></div>
    <section className="market-section" id="story"><div className="market-container market-split"><div className="market-split-photo"><Image src="/images/training-bls-2.jpg" alt="ทีมเจี่ยรักษาอบรม CPR และการใช้ AED" fill sizes="(max-width: 700px) 100vw, 45vw" /></div><div><p className="market-eyebrow">WHO WE ARE</p><h2>ดูแลตั้งแต่เลือก<br /><em>จนพร้อมใช้จริง.</em></h2><p>{trustedBy} เราช่วยให้ทีมงานเลือกเครื่องที่ตรงการใช้งานและรู้วิธีใช้เมื่อต้องช่วยเหลือคน</p><div className="market-step-list"><div className="market-step"><b>01</b><strong>เลือกและจัดหาเครื่อง</strong><span>เทียบรุ่นตามสถานที่ งบ และจำนวนจุดติดตั้ง</span></div><div className="market-step"><b>02</b><strong>จัดส่ง ติดตั้ง และอบรม</strong><span>ช่วยวางเครื่องในจุดที่หยิบใช้ได้สะดวก</span></div><div className="market-step"><b>03</b><strong>ดูแลต่อเนื่อง</strong><span>มีทางเลือกเช่าและบริการดูแลตามแผนที่ตกลง</span></div></div></div></div></section>
    <section className="market-section market-section-cream"><div className="market-container"><div className="market-section-head"><div><p className="market-eyebrow">EXPLORE SERVICES</p><h2>เริ่มจากสิ่งที่ต้องการ.</h2></div></div><div className="market-feature-grid"><div className="market-feature"><b>ซื้อเครื่อง AED</b><p>เทียบ HeartSave Y0, Y8 และ Yuwell Y2 พร้อมราคาเริ่มต้น</p><Link href="/aed" className="market-text-link">ดูรุ่นและราคา ↗</Link></div><div className="market-feature"><b>เช่าหรือเช่าซื้อ</b><p>เลือกระยะเวลาและรูปแบบค่าใช้จ่ายตามหน้างาน</p><Link href="/aed/rental" className="market-text-link">ดูแผนเช่า ↗</Link></div><div className="market-feature"><b>อบรม CPR &amp; AED</b><p>ฝึกปฏิบัติจริงกับทีมงานถึงสถานที่</p><Link href="/training" className="market-text-link">ดูหลักสูตร ↗</Link></div></div><p className="market-note">{PRIMEDIC_REGULATORY.published ? PRIMEDIC_REGULATORY.disclaimer : PRIMEDIC_REGULATORY.pendingNote}</p></div></section>
    <MarketLead title="ให้ทีมเราช่วยวางแผน AED." description="ส่งประเภทสถานที่และจำนวนจุดติดตั้ง ทีมงานช่วยแนะนำทางเลือกที่เหมาะ" />
  </MarketPage>;
}
