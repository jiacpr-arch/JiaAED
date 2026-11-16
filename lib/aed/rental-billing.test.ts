import { describe, expect, it } from "vitest";
import {
  addMonthsUnix,
  findRentalPlan,
  firstInstalmentAnchor,
  quoteRental,
  quoteSummary,
  rentalBillingPlans,
  rentalFailedText,
  rentalPaidText,
  type RentalBillingRow,
} from "./rental-billing";
import { RENT_TO_OWN_TERMS } from "./packages";

const plan = (id: string) => findRentalPlan(id)!;
const bkk = (unix: number) => new Date(unix * 1000).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" });

describe("rental billing plans", () => {
  it("rent-to-own plans use the contract terms from packages.ts", () => {
    for (const [id, pkg] of [["rto-y2", "pkg-start-y2"], ["rto-gps", "pkg-start-y8"]] as const) {
      const p = plan(id);
      const t = RENT_TO_OWN_TERMS[pkg];
      expect(p.upfront.amount).toBe(t.deposit);
      expect(p.monthly).toBe(t.monthly);
      expect(p.months).toBe(t.months);
      expect(p.firstMonthUpfront).toBe(false); // ดาวน์ = งวดแรก, then 18 monthly
      expect(p.upfront.vat).toBe(true);
    }
  });

  it("FLEX deposit is refundable (no VAT) and rent is open-ended, paid in advance", () => {
    for (const id of ["flex", "flex-corp"]) {
      expect(plan(id)).toMatchObject({ months: null, firstMonthUpfront: true, upfront: { vat: false } });
    }
  });

  it("unknown plans are rejected", () => {
    expect(findRentalPlan("rent-annual")).toBeNull();
    expect(findRentalPlan(undefined)).toBeNull();
  });

  it("every plan id is unique", () => {
    expect(new Set(rentalBillingPlans.map((p) => p.id)).size).toBe(rentalBillingPlans.length);
  });
});

describe("quoteRental", () => {
  it("Y2 rent-to-own: 16,000 + 2,900 × 18 = 68,200 → 72,974 incl. VAT", () => {
    const q = quoteRental(plan("rto-y2"), 1);
    expect(q).toEqual({ todayTotal: 17_120, monthlyTotal: 3_103, monthlyCharges: 18, contractTotal: 72_974 });
    const t = RENT_TO_OWN_TERMS["pkg-start-y2"];
    expect(q.contractTotal).toBe((t.deposit + t.monthly * t.months) * 1.07);
  });

  it("FLEX 2 units: deposit 2 × 10,000 + first month 2 × 3,199.30 today", () => {
    expect(quoteRental(plan("flex"), 2)).toEqual({ todayTotal: 26_398.6, monthlyTotal: 6_398.6, monthlyCharges: null, contractTotal: null });
  });

  it("summary reads in Thai with VAT included", () => {
    expect(quoteSummary(plan("rto-y2"), 1)).toBe("วันนี้ ฿17,120 แล้วตัดบัตรเดือนละ ฿3,103 อีก 18 งวด (รวม ฿72,974) · รวม VAT แล้ว");
    expect(quoteSummary(plan("flex-corp"), 1)).toContain("จนกว่าจะแจ้งเลิกเช่า");
  });
});

describe("instalment dates (Bangkok)", () => {
  it("first instalment = same day next month, 10:00", () => {
    expect(bkk(firstInstalmentAnchor(new Date("2026-11-16T09:00:00+07:00")))).toBe("16/12/2026, 10:00:00");
  });

  it("clamps late-month signings to the 28th so every month has the day", () => {
    expect(bkk(firstInstalmentAnchor(new Date("2027-01-31T20:00:00+07:00")))).toBe("28/02/2027, 10:00:00");
  });

  it("uses the Bangkok date, not UTC, near midnight", () => {
    // 00:30 on 1 Dec in Bangkok is still 30 Nov in UTC.
    expect(bkk(firstInstalmentAnchor(new Date("2026-12-01T00:30:00+07:00")))).toBe("01/01/2027, 10:00:00");
  });

  it("18 months after the first instalment ends the contract exactly", () => {
    const anchor = firstInstalmentAnchor(new Date("2026-11-16T09:00:00+07:00"));
    expect(bkk(addMonthsUnix(anchor, 18))).toBe("16/06/2028, 10:00:00");
    expect(bkk(addMonthsUnix(anchor, 17))).toBe("16/05/2028, 10:00:00"); // last charge
  });
});

describe("LINE alerts", () => {
  const row: RentalBillingRow = {
    plan_id: "rto-y2",
    units: 1,
    customer_name: "คุณเอ",
    company_name: "บริษัท บี จำกัด",
    contract_ref: "RTO-2026-001",
    months_total: 18,
    installments_paid: 18,
  };

  it("announces the last instalment as ownership transfer", () => {
    const t = rentalPaidText(row, 3_103);
    expect(t).toContain("งวดที่ 18/18");
    expect(t).toContain("โอนกรรมสิทธิ์");
    expect(t).toContain("บริษัท บี จำกัด · สัญญา RTO-2026-001");
  });

  it("failed charge gives the pay link and the default rule", () => {
    const t = rentalFailedText({ ...row, installments_paid: 5 }, 3_103, "https://invoice.stripe.com/i/x", null);
    expect(t).toContain("https://invoice.stripe.com/i/x");
    expect(t).toContain("ผิดนัด 2 งวด");
    expect(rentalFailedText({ ...row, plan_id: "flex" }, 3_199.3, null, null)).not.toContain("ผิดนัด");
  });
});
