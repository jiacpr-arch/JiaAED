import type { Metadata } from "next";
import { QuoteForm } from "@/app/components/QuoteForm";
import { MarketHero, MarketPage } from "@/app/components/MarketShell";
import { LINE_OA } from "@/lib/aed/line";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/aed/contact";

export const metadata: Metadata = { title: "ขอใบเสนอราคา AED สำหรับองค์กร", description: "แจ้งสถานที่ จำนวนเครื่อง และความต้องการเพื่อรับใบเสนอราคา AED จากทีม JiaAED", alternates: { canonical: "/quote" } };

export default function QuotePage() {
  return <MarketPage>
    <MarketHero eyebrow="REQUEST A QUOTE" title="ขอใบเสนอราคา AED ได้ง่าย ๆ." description="บอกประเภทสถานที่ จำนวนเครื่อง และรุ่นที่สนใจ ทีมงานจะช่วยจัดรายการให้ตรงกับการใช้งานและงบประมาณ" />
    <section className="market-section market-section-cream"><div className="market-container market-form-section"><div><p className="market-eyebrow">HOW IT WORKS</p><h2>กรอกข้อมูลสั้น ๆ<br />แล้วรอทีมงานติดต่อ.</h2><p>แบบฟอร์มนี้ส่งถึงทีมงานโดยตรง ใช้สำหรับจัดทำข้อเสนอและติดต่อเรื่อง AED เท่านั้น</p><ul className="market-list"><li>แจ้งจำนวนจุดติดตั้งหรือจำนวนเครื่อง</li><li>ระบุรุ่นที่สนใจ หรือให้ทีมงานช่วยเลือก</li><li>ขอเอกสารประกอบการจัดซื้อได้</li></ul><p>ต้องการคุยทันที? <a href={LINE_OA} target="_blank" rel="noopener noreferrer" data-line-cta="quote_side" className="market-text-link">ทัก LINE ↗</a> หรือ <a href={PHONE_HREF} data-cta="quote_phone" className="market-text-link">โทร {PHONE_DISPLAY}</a></p></div><div className="market-form-panel"><QuoteForm variant="quote_page_redesign" /></div></div></section>
  </MarketPage>;
}
