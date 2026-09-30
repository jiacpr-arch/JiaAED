import type { Metadata } from "next";
import { MarketButton, MarketHero, MarketLead, MarketPage } from "@/app/components/MarketShell";
import { documents } from "@/lib/aed/documents";

export const metadata: Metadata = { title: "เอกสาร AED สำหรับการจัดซื้อและตรวจสอบ", description: "ดาวน์โหลดสเปก AED Yuwell Y2 และเอกสารทะเบียน อย. สำหรับประกอบการจัดซื้อ", alternates: { canonical: "/docs" } };

// The catalog only holds documents for currently sold models (see lib/aed/documents.ts).
const currentDocuments = documents;

export default function DocsPage() {
  return <MarketPage>
    <MarketHero eyebrow="DOCUMENT CENTER" title="เอกสารพร้อมใช้ สำหรับการจัดซื้อ." description="ดาวน์โหลดสเปกสินค้าและเอกสารทะเบียน อย. ของรุ่นที่จำหน่ายอยู่ หรือติดต่อทีมงานหากต้องใช้ชุดเอกสารสำหรับโครงการเฉพาะ" image="/images/primedic-y2-open.jpg"><MarketButton href="#downloads">ดูเอกสาร</MarketButton><MarketButton href="/quote" secondary>ขอใบเสนอราคา</MarketButton></MarketHero>
    <section className="market-section market-section-cream" id="downloads"><div className="market-container"><div className="market-section-head"><div><p className="market-eyebrow">READY TO DOWNLOAD</p><h2>ไฟล์ที่ใช้บ่อย.</h2></div><p>ตรวจสอบชื่อรุ่นและวันที่ในเอกสารก่อนนำไปประกอบ TOR หรือใบเสนอราคา</p></div><div className="market-doc-list">{currentDocuments.map((d) => <a className="market-doc" href={d.href} key={d.id} target="_blank" rel="noopener noreferrer" data-doc-download={d.id} data-doc-category={d.category}><b>{d.title}</b><p>{d.description}</p><span>{d.mime === "application/pdf" ? "PDF" : "DOCX"} · {d.sizeLabel} · ดาวน์โหลด ↗</span></a>)}</div></div></section>
    <section className="market-section"><div className="market-container market-faq"><div><p className="market-eyebrow">NEED MORE?</p><h2>ต้องการเอกสารอื่น?</h2></div><div><p className="market-muted">แจ้งรุ่น หน่วยงาน และรายการเอกสารที่ต้องใช้ เช่น สเปกเต็ม ใบรับรอง หรือรายการอุปกรณ์เสริม ทีมงานจะจัดชุดเอกสารให้ตรงโครงการ</p><div className="market-mini-nav"><a href="/quote">ส่งคำขอเอกสาร ↗</a><a href="/aed">เทียบรุ่น AED</a></div></div></div></section>
    <MarketLead title="เอกสารพร้อมแล้ว ขอราคาได้เลย." description="ทีมงานช่วยจับคู่สเปกและรายการอุปกรณ์ให้ตรงกับโครงการจัดซื้อ" />
  </MarketPage>;
}
