import type { Metadata } from "next";
import Link from "next/link";
import { MarketButton, MarketHero, MarketLead, MarketPage } from "@/app/components/MarketShell";
import { BreadcrumbStructuredData } from "@/app/components/StructuredData";
import { rentalContractClauses, rentalTermsTable, replacementValueLine } from "@/lib/aed/rental-terms";
import { LINE_OA, LINE_DISPLAY_ID } from "@/lib/aed/line";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "เงื่อนไขการเช่า AED — มัดจำ คืนช้า ยกเลิก และความเสียหาย",
  description:
    "เงื่อนไขการเช่าเครื่อง AED ทุกแผนของเจี่ยรักษา: มัดจำ การคืนเครื่องช้า การยกเลิกก่อนกำหนด การต่อสัญญา เครื่องสำรอง และการชดใช้เมื่อเสียหายหรือสูญหาย",
  alternates: { canonical: "/aed/rental/terms" },
};

const cols = [
  { key: "short", label: "ใช้ชั่วคราว (อีเวนต์ / 1 เดือน)" },
  { key: "flex", label: "FLEX" },
  { key: "annual", label: "รายปี" },
] as const;

export default function RentalTermsPage() {
  return <MarketPage>
    <BreadcrumbStructuredData items={[{ name: "หน้าแรก", path: "/" }, { name: "เช่า AED", path: "/aed/rental" }, { name: "เงื่อนไขการเช่า", path: "/aed/rental/terms" }]} />
    <MarketHero eyebrow="RENTAL TERMS" title="เงื่อนไขการเช่า." description="ทุกแผนในหน้าเดียว รู้ก่อนเช่าว่ามัดจำคืนเมื่อไร คืนช้าคิดเท่าไร ยกเลิกได้ไหม และถ้าเครื่องเสียหายใครรับผิดชอบ">
      <MarketButton href="/aed/rental" lineCta="terms_hero_plans">ดูแผนและราคาเช่า</MarketButton>
      <MarketButton href={LINE_OA} lineCta="terms_hero_line" secondary>ขอสัญญาฉบับจริง ทาง LINE {LINE_DISPLAY_ID}</MarketButton>
    </MarketHero>

    <section className="market-section"><div className="market-container">
      <div className="market-section-head"><div><p className="market-eyebrow">AT A GLANCE</p><h2>เทียบเงื่อนไข<br /><em>ทุกแผน.</em></h2></div><p>ค่าเช่าและมัดจำของแต่ละแผนดูได้ในหน้าเช่า ทุกราคายังไม่รวม VAT</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[640px] border-collapse text-sm bg-white border border-[#dfe5df]">
        <thead><tr className="bg-[#f4f1ea] text-left"><th className="p-3 w-1/5">หัวข้อ</th>{cols.map((c) => <th key={c.key} className="p-3">{c.label}</th>)}</tr></thead>
        <tbody>{rentalTermsTable.map((r) => <tr key={r.topic} className="border-t border-[#dfe5df] align-top"><th scope="row" className="p-3 text-left font-bold text-[#26352b]">{r.topic}</th>{cols.map((c) => <td key={c.key} className="p-3 text-[#48584e]">{r[c.key]}</td>)}</tr>)}</tbody>
      </table></div>
      <p className="market-note">{replacementValueLine} · ชำรุดจากการใช้งานปกติไม่มีค่าใช้จ่าย</p>
    </div></section>

    <section className="market-section market-section-cream"><div className="market-container">
      <div className="market-section-head"><div><p className="market-eyebrow">FULL TERMS</p><h2>ข้อสัญญาเช่า<br /><em>ทั้งหมด.</em></h2></div><p>สัญญาเช่าทำระหว่างบริษัท เจี่ยรักษา จำกัด (ผู้ให้เช่า) กับผู้เช่า แผนอีเวนต์ใช้ใบเสนอราคาที่ลงนามแทนสัญญาเต็มได้</p></div>
      <div className="max-w-3xl space-y-8">
        {rentalContractClauses.map((c) => <article key={c.title}>
          <h3 className="text-lg font-bold mb-2 text-[#26352b]">{c.title}</h3>
          {c.items.map((item) => <p key={item} className="text-sm leading-7 text-[#48584e] mb-2">{item}</p>)}
        </article>)}
      </div>
      <p className="market-note">เอกสารนี้เป็นตัวอย่างเพื่อประกอบการพิจารณา เงื่อนไขที่ผูกพันคือสัญญาหรือใบเสนอราคาที่ลงนาม · อยากเป็นเจ้าของเครื่อง? <Link href="/aed/rental/contract" className="market-text-link">ดูตัวอย่างสัญญาเช่าซื้อ</Link></p>
    </div></section>

    <MarketLead title="พร้อมเช่าแล้ว หรืออยากให้ฝ่ายจัดซื้อตรวจสัญญาก่อน?" description="ส่งแผนที่สนใจและจำนวนเครื่อง ทีมงานออกใบเสนอราคาพร้อมสัญญาฉบับจริงให้" />
  </MarketPage>;
}
