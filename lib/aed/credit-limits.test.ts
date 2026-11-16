import { describe, expect, it } from "vitest";
import { checkCredit, normalizeCompany, normalizePhone, type ExposureRow } from "./credit-limits";

const row = (o: Partial<ExposureRow>): ExposureRow => ({
  stripe_subscription_id: "sub_" + Math.random().toString(36).slice(2),
  plan_id: "rto-y2",
  units: 1,
  status: "active",
  installments_paid: 0,
  company_name: "บริษัท ตัวอย่าง จำกัด",
  customer_email: "buyer@example.com",
  customer_phone: "081-234-5678",
  ...o,
});
const key = { companyName: "ตัวอย่าง Co., Ltd.", email: "", phone: "" };

describe("matching the same customer", () => {
  it("normalises company names and phones", () => {
    expect(normalizeCompany("บริษัท ตัวอย่าง จำกัด (มหาชน)")).toBe(normalizeCompany("ตัวอย่าง Co., Ltd."));
    expect(normalizePhone("+66 81 234 5678")).toBe(normalizePhone("081-234-5678"));
    expect(normalizePhone("123")).toBe("");
  });

  it("matches on email or phone even when the company name differs", () => {
    const rows = [row({ company_name: "ชื่ออื่น" })];
    expect(checkCredit(rows, { companyName: "", email: "BUYER@example.com", phone: "" }, "company", 2).ok).toBe(false);
    expect(checkCredit(rows, { companyName: "", email: "", phone: "+66812345678" }, "company", 2).ok).toBe(false);
    expect(checkCredit(rows, { companyName: "คนละราย", email: "x@y.com", phone: "0899999999" }, "company", 2).ok).toBe(true);
  });
});

describe("machine ceiling per customer", () => {
  it("individual / small shop: 1 machine in total", () => {
    expect(checkCredit([], key, "individual", 1).ok).toBe(true);
    expect(checkCredit([], key, "individual", 2)).toMatchObject({ ok: false, reason: "over_limit", ceiling: 1 });
    expect(checkCredit([row({})], key, "individual", 1)).toMatchObject({ ok: false, openUnits: 1 });
  });

  it("new company: 2 machines in total", () => {
    expect(checkCredit([], key, "company", 2).ok).toBe(true);
    expect(checkCredit([row({})], key, "company", 1).ok).toBe(true);
    expect(checkCredit([row({ units: 2 })], key, "company", 1)).toMatchObject({ ok: false, ceiling: 2 });
  });

  it("company with ≥ 3 instalments paid: +2 per new link", () => {
    const rows = [row({ units: 2, installments_paid: 3 })];
    expect(checkCredit(rows, key, "company", 2)).toMatchObject({ ok: true, ceiling: 4 });
    expect(checkCredit(rows, key, "company", 3).ok).toBe(false);
    // a completed contract counts as history but not as open units
    expect(checkCredit([row({ status: "completed", installments_paid: 18, units: 5 })], key, "company", 2)).toMatchObject({ ok: true, openUnits: 0 });
  });

  it("anything overdue blocks a new link", () => {
    expect(checkCredit([row({ status: "past_due" })], key, "company", 1)).toMatchObject({ ok: false, reason: "overdue" });
  });

  it("converting a FLEX contract doesn't count its own units", () => {
    const flex = row({ plan_id: "flex", units: 2 });
    expect(checkCredit([flex], key, "company", 2).ok).toBe(false);
    expect(checkCredit([flex], key, "company", 2, flex.stripe_subscription_id).ok).toBe(true);
  });

  it("ended contracts don't count", () => {
    expect(checkCredit([row({ status: "canceled", units: 5 }), row({ status: "converted", units: 5 })], key, "individual", 1).ok).toBe(true);
  });
});
