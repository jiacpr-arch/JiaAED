import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketButton, MarketHero, MarketLead, MarketPage } from "@/app/components/MarketShell";
import { ModelLadder } from "@/app/components/ModelLadder";
import { PriceViewTracker } from "@/app/components/PriceViewTracker";
import { BreadcrumbStructuredData } from "@/app/components/StructuredData";
import { modelChooser, PRICE_ON_REQUEST, primedicModels, Y8_ON_REQUEST_NOTE, Y8_STATUS, yuwellGpsAed } from "@/lib/aed/primedic";
import { PRIMEDIC_REGULATORY } from "@/lib/aed/regulatory";
import { LINE_OA } from "@/lib/aed/line";

// One-page "which AED should I buy" sheet (owner, 15 พ.ย. 2026): the Y0 → Y8 →
// Y2 ladder with photos, a plain-language table and who-should-buy-what, in one
// place the sales team can send as a link. Prices come from primedic.ts.
// Warranty is left off on purpose until Yuwell confirms Y0/Y8 terms.

export const revalidate = 3600;

const gpsPrice = yuwellGpsAed.price === null ? PRICE_ON_REQUEST : `฿${yuwellGpsAed.price.toLocaleString("en-US")}`;
const price = (id: string) => `฿${primedicModels.find((m) => m.id === id)!.price.toLocaleString("en-US")}`;

export const metadata: Metadata = {
  title: "เปรียบเทียบเครื่อง AED Y0 / Y8 / Y8 GPS / Y2 — ควรซื้อรุ่นไหน",
  description: `ทุกรุ่นช็อกหัวใจได้และมีเสียงนำทางภาษาไทย ต่างกันที่ช่วยให้ปั๊มหัวใจถูกได้แค่ไหน — Yuwell Y2 ${price("primedic-y2")} (แผ่น feedback + จอแสดงผลสด) · HeartSave Y0 ${price("primedic-y0")} · Y8 ${Y8_STATUS}`,
  alternates: { canonical: "/aed/compare" },
  robots: { index: PRIMEDIC_REGULATORY.published, follow: true },
};

type Cell = string | boolean;
const rows: { label: string; y0: Cell; y8: Cell; y2: Cell; gps: Cell }[] = [
  { label: "ตัวเครื่อง", y0: "HeartSave", y8: "HeartSave (เครื่องเดียวกับ Y0)", y2: "Yuwell Y2 (รุ่นมีจอ)", gps: "HeartSave Y8 + โมดูล GPS" },
  { label: "ช็อกหัวใจ + เสียงนำทางภาษาไทยทีละขั้น", y0: true, y8: true, y2: true, gps: true },
  { label: "ใช้กับเด็กได้ (ปุ่มโหมดเด็ก)", y0: true, y8: true, y2: true, gps: true },
  { label: "แผ่นที่แถมมา", y0: "แบบธรรมดา", y8: "แบบ CPR feedback", y2: "แบบ CPR feedback", gps: "แบบ CPR feedback" },
  { label: "บอกว่ากดหน้าอกแรง/เร็วพอไหม", y0: false, y8: "เสียงบอก", y2: "เสียงบอก + บนจอ", gps: "เสียงบอก" },
  { label: "จอแสดงความเร็ว / ความลึก / การปล่อยหน้าอก สด ๆ", y0: false, y8: false, y2: true, gps: false },
  { label: "จอสีแสดงคลื่นหัวใจ (EKG)", y0: false, y8: false, y2: true, gps: false },
  { label: "GPS ติดตามตำแหน่ง + เช็คสถานะเครื่องออนไลน์", y0: false, y8: false, y2: false, gps: true },
  { label: "เอกสารสเปกสำหรับจัดซื้อ (TOR)", y0: "สอบถาม", y8: "—", y2: true, gps: "สอบถาม" },
  { label: "ราคา (ex VAT)", y0: price("primedic-y0"), y8: Y8_STATUS, y2: price("primedic-y2"), gps: gpsPrice },
];

function show(v: Cell) {
  if (v === true) return <span style={{ color: "#16a34a", fontWeight: 800 }}>✓</span>;
  if (v === false) return <span style={{ color: "#9ca3af" }}>—</span>;
  return v;
}

const faqs = [
  {
    q: "Y0, Y8 และ Y8 GPS ต่างกันยังไง?",
    a: "เป็นเครื่องรุ่นเดียวกัน ต่างกันที่แผ่นที่ใช้ — Y0 ใช้แผ่นมาตรฐาน Y8 ใช้แผ่น CPR feedback ที่มีเสียงบอกแรงและจังหวะกด และ Y8 GPS คือ Y8 ที่เพิ่มระบบติดตามตำแหน่ง ตอนนี้ Y8 แบบธรรมดางดจำหน่ายแล้ว ถ้าต้องการ feedback แนะนำ Y2 หรือ Y8 GPS ถ้าต้องการระบบติดตาม",
  },
  {
    q: "ซื้อแผ่น feedback มาใส่ Y0 ได้ไหม?",
    a: "แผ่น CPR feedback ไม่ขายแยก — มีเป็นแผ่นเปลี่ยนให้ลูกค้าที่ใช้ Y8 อยู่แล้วเท่านั้น ถ้าอยากได้ feedback เลือก Y2 ที่มีทั้งแผ่น feedback และจอในตัว",
  },
  {
    q: "รุ่น Y8 GPS ต่างจากรุ่นอื่นยังไง?",
    a: "Y8 GPS คือเครื่อง Y8 (แถมแผ่น CPR feedback) ที่เพิ่มโมดูล GPS — ทีมงานเห็นตำแหน่งและสถานะแบต/แผ่นออนไลน์ เหมาะกับองค์กรหลายสาขา ไม่มีจอแสดงผล CPR แบบ Y2 · มีแบบซื้อขาดและเช่าซื้อ",
  },
  {
    q: "มี Y8 อยู่แล้ว ยังได้รับการดูแลไหม?",
    a: "ได้ตามปกติ — รับประกัน แผ่นและแบตเตอรี่เปลี่ยน และบริการตรวจเช็คเหมือนเดิมทุกอย่าง",
  },
  {
    q: "ยังไม่แน่ใจว่าจะซื้อ ทำยังไงดี?",
    a: "เช่าก่อนได้ ทั้งแบบรายวัน รายเดือน และรายปี ทีมดูแลแบต/แผ่นให้ — หรือมาลองปั๊มหุ่นดูจอ Y2 ได้ที่ JIA TRAINER CENTER เดอะสตรีท รัชดา",
  },
];

export default function ComparePage() {
  return (
    <MarketPage>
      <BreadcrumbStructuredData
        items={[
          { name: "หน้าแรก", path: "/" },
          { name: "ซื้อ AED", path: "/aed" },
          { name: "เปรียบเทียบรุ่น", path: "/aed/compare" },
        ]}
      />
      <MarketHero
        eyebrow="COMPARE / DECIDE"
        title="เลือก AED รุ่นไหนดี?"
        description="ทุกรุ่นช็อกหัวใจได้และมีเสียงนำทางภาษาไทย — ต่างกันที่ช่วยให้ปั๊มหัวใจถูกได้แค่ไหน ดูจบในหน้าเดียว"
      >
        <MarketButton href="/quote" lineCta="compare_hero_quote">ขอใบเสนอราคา</MarketButton>
        <MarketButton href={LINE_OA} lineCta="compare_hero_line" secondary>ถามทาง LINE</MarketButton>
      </MarketHero>

      <section id="ladder" className="market-section market-section-cream">
        <div className="market-container">
          <PriceViewTracker targetId="ladder" />
          <div className="market-section-head">
            <div>
              <p className="market-eyebrow">STEP BY STEP</p>
              <h2>4 รุ่น ต่างกันตรงไหน.</h2>
            </div>
            <p>Y0 + แผ่น feedback = Y8 · Y8 + ระบบติดตาม = Y8 GPS · Y2 = รุ่นมีจอแสดงผล CPR และ EKG</p>
          </div>
          <ModelLadder />
          <p className="market-note">{Y8_ON_REQUEST_NOTE}</p>
        </div>
      </section>

      <section className="market-section">
        <div className="market-container">
          <div className="market-section-head">
            <div>
              <p className="market-eyebrow">SIDE BY SIDE</p>
              <h2>เทียบทีละข้อ.</h2>
            </div>
          </div>
          <div className="market-table-wrap">
            <table className="market-table">
              <thead>
                <tr>
                  <th>สิ่งที่เทียบ</th>
                  <th>HeartSave Y0</th>
                  <th style={{ opacity: 0.5 }}>HeartSave Y8 ({Y8_STATUS})</th>
                  <th>Yuwell Y2 ⭐ แนะนำ</th>
                  <th>HeartSave Y8 GPS</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label}>
                    <th>{r.label}</th>
                    <td>{show(r.y0)}</td>
                    <td style={{ opacity: 0.5 }}>{show(r.y8)}</td>
                    <td>{show(r.y2)}</td>
                    <td>{show(r.gps)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="market-section market-section-cream">
        <div className="market-container">
          <div className="market-section-head">
            <div>
              <p className="market-eyebrow">WHICH ONE FOR YOU</p>
              <h2>ควรซื้อ — หรือไม่ซื้อ — รุ่นไหน.</h2>
            </div>
          </div>
          <div className="market-grid-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {modelChooser.map((c) => (
              <article className={`market-card ${c.id === "primedic-y2" ? "market-card-featured" : ""}`} key={c.id}>
                <div className="market-card-body">
                  <h3>{c.title}</h3>
                  <ul>
                    {c.pick.map((t) => <li key={t}>{t}</li>)}
                    {c.skip.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                  <Link
                    href={c.id === "rent" ? "/aed/rental" : c.id === "primedic-y2" ? "/aed/yuwell-y2" : c.id === "yuwell-gps" ? "/aed/packages" : "/aed/primedic"}
                    className="market-card-link"
                    data-cta={`compare_choose_${c.id}`}
                  >
                    {c.id === "rent" ? "ดูแพ็กเกจเช่า" : "ดูรายละเอียด"} <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="market-section">
        <div className="market-container market-split">
          <div className="market-split-photo">
            <Image src="/images/yuwell-y2-screen.png" alt="Yuwell Y2 — จอสีแนะนำ CPR แบบเรียลไทม์" fill sizes="(max-width: 700px) 100vw, 45vw" style={{ objectFit: "contain", background: "#fff" }} />
          </div>
          <div>
            <p className="market-eyebrow">WHY Y2</p>
            <h2>
              เครื่องช็อกแค่ไม่กี่วินาที.
              <br />
              <em>ที่เหลือคือการปั๊มหัวใจ.</em>
            </h2>
            <p>
              คนที่ไม่ได้ทำ CPR บ่อยมักกดตื้นหรือเร็วเกินโดยไม่รู้ตัว Y2 แสดงความเร็ว ความลึก และการปล่อยหน้าอกบนจอทันที
              ปรับท่าได้ระหว่างช่วยชีวิต — เพิ่มจาก Y0 ประมาณ ฿10,000 ใช้ 4 ปี ตกวันละไม่ถึง 7 บาท
            </p>
            <Link className="market-text-link" href="/aed/yuwell-y2">ดูรายละเอียด Yuwell Y2 ↗</Link>
          </div>
        </div>
      </section>

      <section className="market-section market-section-cream">
        <div className="market-container market-faq">
          <div>
            <p className="market-eyebrow">FAQ</p>
            <h2>คำถามที่พบบ่อย.</h2>
          </div>
          <div>
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <MarketLead title="ยังเลือกไม่ได้?" description="บอกสถานที่ จำนวนคน และงบประมาณคร่าว ๆ ทีมงานช่วยเลือกรุ่น หรือแนะนำแบบเช่าให้" />
    </MarketPage>
  );
}
