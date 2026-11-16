import type { Metadata } from "next";
import { MarketPage, MarketButton } from "@/app/components/MarketShell";
import { getStripe } from "@/lib/aed/stripe";
import { findCheckoutItem, thbExact } from "@/lib/aed/checkout";
import { findRentalPlan, quoteSummary } from "@/lib/aed/rental-billing";
import { findHoldPackage, holdSummary } from "@/lib/aed/rental-holds";
import { lineOaUrl } from "@/lib/aed/line";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/aed/contact";

export const metadata: Metadata = {
  title: "ขอบคุณสำหรับคำสั่งซื้อ",
  robots: { index: false, follow: false },
};

type View = {
  state: "paid" | "pending" | "unknown";
  product?: string;
  total?: number;
  email?: string | null;
  /** Set for a rental card-billing link: what will be charged from now on. */
  rental?: string;
  /** Event-rental card hold: nothing charged yet. */
  hold?: boolean;
};

async function loadSession(id: string | undefined): Promise<View> {
  const stripe = getStripe();
  if (!stripe || !id || !/^cs_[A-Za-z0-9_]+$/.test(id)) return { state: "unknown" };
  try {
    const s = await stripe.checkout.sessions.retrieve(id);
    if (s.metadata?.kind === "rental_hold" && s.status === "complete") {
      const pkg = findHoldPackage(s.metadata.package_id);
      return {
        state: "paid",
        product: pkg ? `${pkg.label} ${s.metadata.days} วัน` : "เช่า AED อีเวนต์",
        rental: pkg ? holdSummary(pkg, Number(s.metadata.days), Number(s.metadata.units) || 1) : "กันวงเงินบัตรเรียบร้อย",
        hold: true,
      };
    }
    const plan = s.metadata?.kind === "rental_billing" ? findRentalPlan(s.metadata.plan_id) : null;
    return {
      state: s.payment_status === "paid" ? "paid" : s.status === "complete" ? "pending" : "unknown",
      product: plan ? plan.label : findCheckoutItem(s.metadata?.product_id)?.name,
      rental: plan ? quoteSummary(plan, Number(s.metadata?.units) || 1) : undefined,
      total: s.amount_total != null ? s.amount_total / 100 : undefined,
      email: s.customer_details?.email,
    };
  } catch {
    return { state: "unknown" };
  }
}

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const v = await loadSession(session_id);
  const ref = session_id ? session_id.slice(-8) : "";
  const line = lineOaUrl(`สั่งซื้อ AED ออนไลน์แล้ว${ref ? ` (อ้างอิง ${ref})` : ""} ขอติดตามการจัดส่งครับ`);

  return (
    <MarketPage>
      <section className="market-section">
        <div className="market-container" style={{ maxWidth: 640 }}>
          <p className="market-eyebrow">{v.state === "paid" ? "PAYMENT RECEIVED" : "ORDER RECEIVED"}</p>
          <h1 style={{ fontSize: "clamp(30px,5vw,46px)", lineHeight: 1.25, margin: "8px 0 16px" }}>
            {v.hold ? "กันวงเงินบัตรเรียบร้อย ขอบคุณครับ" : v.state === "paid" ? "ชำระเงินเรียบร้อย ขอบคุณครับ" : v.state === "pending" ? "รับคำสั่งซื้อแล้ว — รอยืนยันการชำระเงิน" : "ขอบคุณสำหรับคำสั่งซื้อ"}
          </h1>
          {v.rental ? (
            <>
              <p>
                <strong>{v.product}</strong>
                {v.total != null && <> · ชำระวันนี้ <strong>{thbExact(v.total)}</strong> (รวม VAT)</>}
              </p>
              {v.hold ? (
                <p>{v.rental} · ทีมงานจะติดต่อนัดส่งเครื่อง</p>
              ) : (
                <p>ผูกบัตรเรียบร้อย — {v.rental} · ระบบส่งใบเสร็จทางอีเมลทุกงวด และทีมงานส่งใบกำกับภาษีให้</p>
              )}
            </>
          ) : (
            <>
              {v.product && v.total != null && (
                <p>
                  <strong>AED {v.product}</strong> × 1 · ยอดชำระ <strong>{thbExact(v.total)}</strong> (รวม VAT)
                </p>
              )}
              <p>
                ทีมงานจะโทรยืนยันคำสั่งซื้อ นัดวันจัดส่ง/ติดตั้ง และส่งใบกำกับภาษีให้
                {v.email ? <> · ใบเสร็จจาก Stripe ส่งไปที่ {v.email}</> : null}
              </p>
            </>
          )}
          {ref && <p style={{ fontSize: 13, color: "#68776d" }}>เลขอ้างอิง: {ref}</p>}
          <div className="market-actions" style={{ marginTop: 24 }}>
            <MarketButton href={line} lineCta="checkout_success_line">ติดต่อทีมงานทาง LINE</MarketButton>
            <MarketButton href={PHONE_HREF} secondary>โทร {PHONE_DISPLAY}</MarketButton>
          </div>
        </div>
      </section>
    </MarketPage>
  );
}
