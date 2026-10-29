import type { Metadata } from "next";
import Link from "next/link";
import { MarketButton, MarketHero, MarketLead, MarketPage } from "@/app/components/MarketShell";
import { BreadcrumbStructuredData } from "@/app/components/StructuredData";
import { RENT_TO_OWN_ELIGIBILITY } from "@/lib/aed/packages";
import { SAMPLE_CONTRACT_TERMS, sampleContractClauses, sampleContractDocuments } from "@/lib/aed/rent-to-own-contract";
import { LINE_OA, LINE_DISPLAY_ID } from "@/lib/aed/line";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "ตัวอย่างสัญญาเช่าซื้อ AED — เงื่อนไขก่อนเซ็น",
  description:
    "อ่านตัวอย่างสัญญาเช่าซื้อเครื่อง AED ของเจี่ยรักษาก่อนตัดสินใจ: เงินดาวน์ ค่างวด กรรมสิทธิ์ การรับประกัน การผิดนัด และเอกสารที่ต้องใช้",
  alternates: { canonical: "/aed/rental/contract" },
};

const s = SAMPLE_CONTRACT_TERMS;
const thb = (n: number) => `฿${n.toLocaleString("en-US")}`;
const VAT = 0.07;
const withVat = (n: number) => thb(Math.round(n * (1 + VAT) * 100) / 100);

const summary = [
  ["ทรัพย์สิน", `เครื่อง AED ${s.model} (เพิ่มตู้เก็บเครื่องได้)`],
  ["เงินดาวน์ (วันทำสัญญา)", `${thb(s.deposit)} + VAT`],
  ["ค่างวด", `${thb(s.monthly)} × ${s.months} เดือน + VAT`],
  ["ราคาเช่าซื้อรวม", `${thb(s.total)} + VAT (รวม VAT ${withVat(s.total)})`],
  ["กรรมสิทธิ์", "เป็นของผู้เช่าซื้อทันทีเมื่อชำระครบ ไม่มีค่าใช้จ่ายเพิ่ม"],
  ["รับประกันตัวเครื่อง", `${s.warrantyYears} ปี`],
  ["ตรวจเครื่องฟรี", "ทุก 6 เดือนตลอดสัญญา"],
  ["ผู้ค้ำประกัน", "กรรมการผู้มีอำนาจลงนาม 1 คน"],
];

export default function RentToOwnContractPage() {
  return <MarketPage>
    <BreadcrumbStructuredData items={[{ name: "หน้าแรก", path: "/" }, { name: "เช่า AED", path: "/aed/rental" }, { name: "ตัวอย่างสัญญาเช่าซื้อ", path: "/aed/rental/contract" }]} />
    <MarketHero eyebrow="RENT-TO-OWN CONTRACT" title="ตัวอย่างสัญญาเช่าซื้อ." description="อ่านเงื่อนไขทั้งหมดก่อนตัดสินใจ ตัวเลขในตัวอย่างนี้เป็นรุ่น Y8 ตามราคาบนเว็บ รุ่นอื่นหรือเพิ่มตู้ ทีมงานจะคำนวณให้ในใบเสนอราคา">
      <MarketButton href={LINE_OA} lineCta="contract_hero_line">ขอสัญญาฉบับจริง ทาง LINE {LINE_DISPLAY_ID}</MarketButton>
      <MarketButton href="/aed/rental#own" secondary>ดูราคาเช่าซื้อทุกรุ่น</MarketButton>
    </MarketHero>

    <section className="market-section"><div className="market-container">
      <div className="market-section-head"><div><p className="market-eyebrow">AT A GLANCE</p><h2>สรุปเงื่อนไข<br /><em>ในหน้าเดียว.</em></h2></div><p>{RENT_TO_OWN_ELIGIBILITY}</p></div>
      <div className="overflow-x-auto"><table className="w-full border-collapse text-sm bg-white border border-[#dfe5df]"><tbody>
        {summary.map(([k, v]) => <tr key={k} className="border-b border-[#dfe5df]"><th scope="row" className="text-left font-bold p-3 w-2/5 align-top text-[#26352b]">{k}</th><td className="p-3 text-[#48584e]">{v}</td></tr>)}
      </tbody></table></div>

      <h3 className="text-xl font-bold mt-12 mb-4 text-[#26352b]">ตัวอย่างตารางการชำระเงิน</h3>
      <div className="overflow-x-auto"><table className="w-full border-collapse text-sm bg-white border border-[#dfe5df]">
        <thead><tr className="bg-[#f4f1ea] text-left"><th className="p-3">งวด</th><th className="p-3 text-right">ค่าเช่าซื้อ</th><th className="p-3 text-right">VAT 7%</th><th className="p-3 text-right">รวมชำระ</th></tr></thead>
        <tbody>
          <tr className="border-t border-[#dfe5df]"><td className="p-3">เงินดาวน์ (วันทำสัญญา)</td><td className="p-3 text-right">{thb(s.deposit)}</td><td className="p-3 text-right">{thb(s.deposit * VAT)}</td><td className="p-3 text-right">{withVat(s.deposit)}</td></tr>
          <tr className="border-t border-[#dfe5df]"><td className="p-3">งวดที่ 1–{s.months} (ทุกเดือน)</td><td className="p-3 text-right">{thb(s.monthly)}</td><td className="p-3 text-right">{thb(s.monthly * VAT)}</td><td className="p-3 text-right">{withVat(s.monthly)}</td></tr>
          <tr className="border-t border-[#dfe5df] font-bold"><td className="p-3">รวมทั้งสัญญา</td><td className="p-3 text-right">{thb(s.total)}</td><td className="p-3 text-right">{thb(s.total * VAT)}</td><td className="p-3 text-right">{withVat(s.total)}</td></tr>
        </tbody>
      </table></div>
    </div></section>

    <section className="market-section market-section-cream"><div className="market-container">
      <div className="market-section-head"><div><p className="market-eyebrow">FULL TERMS</p><h2>ข้อสัญญา<br /><em>ทั้งหมด.</em></h2></div><p>สัญญาทำระหว่างบริษัท เจี่ยรักษา จำกัด (ผู้ให้เช่าซื้อ) กับนิติบุคคลผู้เช่าซื้อ ทำเป็นหนังสือสองฉบับ ลงนามต่อหน้าพยาน</p></div>
      <div className="max-w-3xl space-y-8">
        {sampleContractClauses.map((c) => <article key={c.title}>
          <h3 className="text-lg font-bold mb-2 text-[#26352b]">{c.title}</h3>
          {c.items.map((item) => <p key={item} className="text-sm leading-7 text-[#48584e] mb-2">{item}</p>)}
        </article>)}
      </div>
    </div></section>

    <section className="market-section"><div className="market-container">
      <div className="market-section-head"><div><p className="market-eyebrow">PAPERWORK</p><h2>เอกสาร<br /><em>ที่ต้องเตรียม.</em></h2></div><p>เตรียมไว้ในวันทำสัญญา ทีมงานส่งสัญญาฉบับจริงให้ตรวจล่วงหน้าก่อนเซ็น</p></div>
      <ul className="list-disc pl-6 text-sm leading-8 text-[#48584e]">{sampleContractDocuments.map((d) => <li key={d}>{d}</li>)}</ul>
      <p className="market-note">เอกสารนี้เป็นตัวอย่างเพื่อประกอบการพิจารณาเท่านั้น เงื่อนไขที่ผูกพันคือสัญญาฉบับที่คู่สัญญาลงนาม ราคาและรายละเอียดทรัพย์สินจะระบุในใบเสนอราคาและสัญญาจริง · <Link href="/aed/rental#own" className="market-text-link">ดูราคาเช่าซื้อ</Link></p>
    </div></section>

    <MarketLead title="อยากได้สัญญาฉบับจริงไปตรวจก่อน?" description="ส่งชื่อบริษัทและรุ่นที่สนใจ ทีมงานออกใบเสนอราคาและร่างสัญญาให้ฝ่ายจัดซื้อหรือฝ่ายกฎหมายตรวจได้เลย" />
  </MarketPage>;
}
