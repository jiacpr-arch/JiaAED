import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LINE_OA } from "@/lib/aed/line";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/aed/contact";
import { PRIMEDIC_REGULATORY } from "@/lib/aed/regulatory";

const links = [
  { href: "/aed", label: "ซื้อ AED" },
  { href: "/aed/rental", label: "เช่า AED" },
  { href: "/training", label: "อบรม" },
  { href: "/docs", label: "เอกสาร" },
];

export function MarketHeader() {
  return (
    <header className="market-header">
      <div className="market-container market-header-inner">
        <Link href="/" className="market-brand" aria-label="JiaAED หน้าแรก"><span>JIA</span><b>AED</b><small>เจี่ยรักษา</small></Link>
        <nav aria-label="เมนูหลัก">{links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}</nav>
        <Link href="/quote" className="market-header-cta">ขอใบเสนอราคา <span aria-hidden="true">↗</span></Link>
        <details className="market-menu"><summary aria-label="เปิดเมนู">☰</summary><div>{[...links, { href: "/about", label: "เกี่ยวกับเรา" }, { href: "/quote", label: "ขอใบเสนอราคา" }].map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}</div></details>
      </div>
    </header>
  );
}

export function MarketFooter() {
  return (
    <footer className="market-footer">
      <div className="market-container market-footer-grid">
        <div><Link href="/" className="market-brand"><span>JIA</span><b>AED</b></Link><p>เครื่อง AED พร้อมบริการสำหรับองค์กร<br />โดย เจี่ยรักษา</p></div>
        <div><strong>สำรวจเว็บไซต์</strong><Link href="/aed">ซื้อเครื่อง AED</Link><Link href="/aed/packages">แพ็กเกจ AED</Link><Link href="/aed/rental">เช่าและเช่าซื้อ AED</Link><Link href="/aed/subscription">บริการดูแล AED</Link><Link href="/training">อบรม CPR &amp; AED</Link><Link href="/about">เกี่ยวกับเรา</Link><Link href="/docs">เอกสารดาวน์โหลด</Link></div>
        <div><strong>ติดต่อและข้อมูล</strong><Link href="/quote">ขอใบเสนอราคา ↗</Link><a href={LINE_OA} data-line-cta="market_footer" target="_blank" rel="noopener noreferrer">LINE JiaAED ↗</a><a href={PHONE_HREF} data-cta="tel_market_footer">{PHONE_DISPLAY}</a><Link href="/articles">บทความ</Link><Link href="/news">ข่าว</Link><Link href="/privacy">นโยบายความเป็นส่วนตัว</Link></div>
      </div>
      <div className="market-container market-footer-bottom"><span>© {new Date().getFullYear()} JiaAED · เจี่ยรักษา</span><span>{PRIMEDIC_REGULATORY.published ? `อย. ${PRIMEDIC_REGULATORY.fda} · ฆพ.2475/2569 (Y0/Y2) · ฆพ.287/2567 (Y8)` : PRIMEDIC_REGULATORY.pendingNote}</span><span>เครื่องมือแพทย์ โปรดอ่านคำเตือนและศึกษาวิธีใช้</span></div>
    </footer>
  );
}

export function MarketPage({ children }: { children: ReactNode }) {
  return <div className="market"><a className="market-skip" href="#main">ข้ามไปยังเนื้อหา</a><MarketHeader /><main id="main">{children}</main><MarketFooter /></div>;
}

export function MarketHero({ eyebrow, title, description, image, children }: { eyebrow: string; title: string; description: string; image?: string; children?: ReactNode }) {
  return <section className={`market-hero ${image ? "market-hero-photo" : ""}`}>
    {image && <Image src={image} alt="" fill priority sizes="100vw" className="market-hero-image" />}
    <div className="market-container market-hero-content"><p className="market-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="market-hero-desc">{description}</p><div className="market-actions">{children}</div></div>
  </section>;
}

export function MarketButton({ href, children, secondary = false, lineCta, product }: { href: string; children: ReactNode; secondary?: boolean; lineCta?: string; product?: string }) {
  const cls = `market-button ${secondary ? "market-button-outline" : "market-button-primary"}`;
  return href.startsWith("/") || href.startsWith("#")
    ? <Link href={href} className={cls} data-cta={lineCta}>{children}<span aria-hidden="true">↗</span></Link>
    : <a href={href} className={cls} data-line-cta={lineCta} data-product={product} data-cta={!lineCta ? "market_external" : undefined} target={href.startsWith("https:") ? "_blank" : undefined} rel={href.startsWith("https:") ? "noopener noreferrer" : undefined}>{children}<span aria-hidden="true">↗</span></a>;
}

export function MarketLead({ title = "พร้อมเลือก AED สำหรับพื้นที่ของคุณ?", description = "ส่งคำถามหรือขอใบเสนอราคาได้ทันที ทีมงานช่วยเทียบรุ่นให้ก่อนตัดสินใจ" }: { title?: string; description?: string }) {
  return <section className="market-lead"><div className="market-container market-lead-inner"><div><p className="market-eyebrow">LET’S GET READY</p><h2>{title}</h2><p>{description}</p></div><div className="market-lead-actions"><MarketButton href="/quote" lineCta="market_lead_quote">ขอใบเสนอราคา</MarketButton><MarketButton href={LINE_OA} lineCta="market_lead_line" secondary>คุยทาง LINE</MarketButton></div></div></section>;
}
