import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketButton, MarketHero, MarketLead, MarketPage } from "@/app/components/MarketShell";
import { BuyOnlineButton } from "@/app/components/BuyOnlineButton";
import { PriceViewTracker } from "@/app/components/PriceViewTracker";
import { bundleCompareAt, bundles } from "@/lib/aed/bundles";
import { checkoutEnabled } from "@/lib/aed/checkout";
import { lineOaUrl } from "@/lib/aed/line";
import { SURVIVOR_REWARD_ENABLED, survivorReward } from "@/lib/aed/promotion";

export const revalidate = 3600;

const thb = (n: number) => `฿${n.toLocaleString("en-US")}`;
const from = Math.min(...bundles.map((b) => b.price));

export const metadata: Metadata = {
  title: "ชุด AED พร้อมใช้ — เครื่อง + ตู้ + คอร์ส สั่งซื้อออนไลน์ได้",
  description: `ชุด AED พร้อมใช้ 3 แบบ เริ่ม ${thb(from)} (ex VAT) — เครื่อง Yuwell พร้อมตู้ติดผนัง คอร์ส CPR & AED ออนไลน์ และอบรมถึงที่ สั่งซื้อและชำระออนไลน์ได้ทันที ออกใบกำกับภาษีได้`,
  alternates: { canonical: "/aed/sets" },
};

export default function AedSetsPage() {
  const online = checkoutEnabled();
  return (
    <MarketPage>
      <MarketHero
        eyebrow="READY-TO-USE SETS"
        title="ไม่ได้ขายแค่เครื่อง — ขายความพร้อมช่วยชีวิต."
        description="เครื่อง AED + ตู้ติดผนัง + คนที่ใช้เป็น ในชุดเดียว ราคาถูกกว่าซื้อแยก สั่งซื้อและชำระออนไลน์ได้ทันที"
        image="/images/jiaaed-hero-2026.png"
      >
        <MarketButton href="#sets">ดูชุดและราคา</MarketButton>
        <MarketButton href="/quote" secondary>
          ขอใบเสนอราคาหลายเครื่อง
        </MarketButton>
      </MarketHero>

      <section id="sets" className="market-section market-section-cream">
        <div className="market-container">
          <PriceViewTracker targetId="sets" />
          <div className="market-section-head">
            <div>
              <p className="market-eyebrow">CHOOSE YOUR SET</p>
              <h2>เลือกชุดที่ใช่.</h2>
            </div>
            <p>ทุกชุดมีเครื่อง AED เสียงภาษาไทย แผ่นอิเล็กโทรด และแบตเตอรี่ · ราคา ex VAT (ยังไม่รวมภาษีมูลค่าเพิ่ม 7%) · ออกใบกำกับภาษีได้</p>
          </div>

          <div className="market-grid-3">
            {bundles.map((b) => {
              const compareAt = bundleCompareAt(b);
              const line = lineOaUrl(`สนใจ ${b.name} ราคา ${thb(b.price)} (ex VAT) ขอรายละเอียด/ใบเสนอราคาครับ`);
              return (
                <article key={b.id} className={`market-card ${b.featured ? "market-card-featured" : ""}`}>
                  <div className="market-card-photo">
                    <Image src={b.image} alt={b.name} width={500} height={400} sizes="(max-width: 700px) 100vw, 33vw" />
                    {b.featured && <span className="market-card-tag">⭐ แนะนำ</span>}
                  </div>
                  <div className="market-card-body">
                    <span className="market-card-kicker">{b.kicker}</span>
                    <h3>{b.name}</h3>
                    <p>เหมาะกับ {b.bestFor}</p>
                    <div className="market-price market-price-set">
                      {compareAt != null ? (
                        <small className="market-was">
                          ซื้อแยก <del>{thb(compareAt)}</del>
                        </small>
                      ) : (
                        <small>ราคาชุด</small>
                      )}
                      <strong>{thb(b.price)}</strong>
                      <span className="market-exvat">ex VAT</span>
                    </div>
                    {compareAt != null && <p className="market-save">ประหยัด {thb(compareAt - b.price)}</p>}
                    <ul>
                      {b.parts.map((p) => (
                        <li key={p.label}>
                          {p.label}
                          {p.price == null ? <b className="market-free"> แถมฟรี</b> : null}
                        </li>
                      ))}
                    </ul>
                    {b.note && <p className="market-note">{b.note}</p>}
                    <BuyOnlineButton
                      productId={b.id}
                      className="market-button market-button-primary market-buy market-buy-block"
                      noteClassName="market-buy-note-dark"
                      label="ซื้อออนไลน์ · ชำระทันที"
                    />
                    <a href={line} target="_blank" rel="noopener noreferrer" data-line-cta={`sets_${b.id}`} data-product={b.id} className="market-card-link">
                      {online ? "สอบถามก่อนซื้อทาง LINE" : "สั่งซื้อ / ขอใบเสนอราคาทาง LINE"} <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="market-note">
            ราคา ex VAT · ตอนชำระเงินระบบบวก VAT 7% ให้อัตโนมัติ · &ldquo;ซื้อแยก&rdquo; คือผลรวมราคาขายปกติของเครื่องและอุปกรณ์แต่ละชิ้นบนเว็บนี้ (ไม่นับของแถม) · ซื้อหลายชุด / หน่วยงานราชการ{" "}
            <Link href="/quote" className="market-text-link">
              ขอใบเสนอราคา ↗
            </Link>
          </p>
          {SURVIVOR_REWARD_ENABLED && (
            <p className="market-note">
              🎉 {survivorReward.title} — {survivorReward.conditionNote}
            </p>
          )}
        </div>
      </section>

      <MarketLead title="อยากเช่าก่อน หรือผ่อนเป็นรายเดือน?" description="มีทั้งเช่ารายวัน รายเดือน รายปี และเช่าแล้วได้ซื้อ — ทีมงานช่วยเลือกแบบที่เหมาะกับงบ" />
    </MarketPage>
  );
}
