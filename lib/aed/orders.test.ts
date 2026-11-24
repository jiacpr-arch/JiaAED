import { describe, expect, it } from "vitest";
import { isJiaAedOrderSession, orderAlertText, orderFromSession, type SessionLike } from "./orders";

const session: SessionLike = {
  id: "cs_test_abc123",
  payment_status: "paid",
  amount_total: 5_339_300,
  metadata: { product_id: "primedic-y2", net_thb: "49900", vat_thb: "3493" },
  payment_intent: { id: "pi_1", payment_method: { type: "promptpay" } },
  customer_details: {
    name: "สมชาย ใจดี",
    email: "buyer@example.com",
    phone: "+66812345678",
    business_name: "บริษัท ตัวอย่าง จำกัด",
    tax_ids: [{ type: "th_vat", value: "0105555555555" }],
    address: { line1: "1 ถนนสุขุมวิท", city: "กรุงเทพฯ", postal_code: "10110", country: "TH" },
  },
  collected_information: {
    shipping_details: { name: "ฝ่ายอาคาร", address: { line1: "99 ถนนพระราม 9", city: "กรุงเทพฯ", postal_code: "10310", country: "TH" } },
  },
  custom_fields: [{ key: "tax_branch", text: { value: "สำนักงานใหญ่" } }],
};

describe("orderFromSession", () => {
  it("maps a paid Checkout session to an order row", () => {
    const now = new Date("2026-11-16T05:00:00Z");
    const o = orderFromSession(session, "paid", now);
    expect(o).toMatchObject({
      stripe_session_id: "cs_test_abc123",
      payment_intent_id: "pi_1",
      status: "paid",
      product_id: "primedic-y2",
      net_thb: 49_900,
      vat_thb: 3_493,
      total_thb: 53_393,
      payment_method: "promptpay",
      company_name: "บริษัท ตัวอย่าง จำกัด",
      tax_id: "0105555555555",
      tax_branch: "สำนักงานใหญ่",
      paid_at: now.toISOString(),
    });
    expect(o.shipping_address?.name).toBe("ฝ่ายอาคาร");
  });

  it("falls back to the older shipping_details field and leaves pending unpaid", () => {
    const o = orderFromSession(
      { ...session, collected_information: null, shipping_details: { name: "เก่า", address: null }, payment_intent: "pi_2" },
      "pending",
    );
    expect(o.shipping_address?.name).toBe("เก่า");
    expect(o.payment_intent_id).toBe("pi_2");
    expect(o.payment_method).toBeNull();
    expect(o.paid_at).toBeNull();
  });
});

describe("orderAlertText", () => {
  it("gives the team everything needed to ship and invoice", () => {
    const t = orderAlertText(orderFromSession(session, "paid"));
    expect(t).toContain("ชำระเงินแล้ว");
    expect(t).toContain("HeartSave Y2");
    expect(t).toContain("฿53,393");
    expect(t).toContain("PromptPay");
    expect(t).toContain("0105555555555");
    expect(t).toContain("99 ถนนพระราม 9");
    expect(t).toContain("cs_test_abc123");
  });
});

describe("shared Stripe account", () => {
  it("only sessions from this site's checkout count as AED orders", () => {
    expect(isJiaAedOrderSession({ product_id: "primedic-y2" })).toBe(true);
    expect(isJiaAedOrderSession({ product_id: "set-y2-ready" })).toBe(true);
    // Morroo / Roodee / PharmRoo checkouts on the same account
    expect(isJiaAedOrderSession({ plan: "premium", app: "morroo" })).toBe(false);
    expect(isJiaAedOrderSession({})).toBe(false);
    expect(isJiaAedOrderSession(null)).toBe(false);
  });
});
