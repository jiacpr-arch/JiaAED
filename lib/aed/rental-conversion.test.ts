import { describe, expect, it } from "vitest";
import { MIN_PAYABLE_THB, conversionQuote, conversionSummary, conversionTargets, depositOf, findConversionTarget } from "./rental-conversion";

const t = (id: string) => findConversionTarget(id)!;

describe("rental → buy / rent-to-own conversion", () => {
  it("buy Y2 with the ฿10,000 FLEX deposit: VAT stays on the full price", () => {
    // 49,900 + 3,493 VAT = 53,393 − 10,000 deposit
    expect(conversionQuote(t("buy-y2"), 1, 10_000)).toEqual({
      grossToday: 53_393,
      creditApplied: 10_000,
      creditUnused: 0,
      payableToday: 43_393,
      monthlyTotal: null,
      monthlyCharges: null,
    });
  });

  it("deposit + rent credit on Y2: 53,393 − (10,000 + 2 × 3,199.30)", () => {
    expect(conversionQuote(t("buy-y2"), 1, 10_000 + 6_398.6).payableToday).toBe(36_994.4);
  });

  it("rent-to-own: credit comes off the down payment, instalments unchanged", () => {
    const q = conversionQuote(t("rto-y2"), 1, 7_000);
    expect(q).toMatchObject({ grossToday: 17_120, creditApplied: 7_000, payableToday: 10_120, monthlyTotal: 3_103, monthlyCharges: 18 });
  });

  it("caps credit so something is still charged, and reports the rest", () => {
    const q = conversionQuote(t("rto-y2"), 1, 20_000);
    expect(q.payableToday).toBe(MIN_PAYABLE_THB);
    expect(q.creditApplied + q.creditUnused).toBe(20_000);
  });

  it("negative credit is ignored", () => {
    expect(conversionQuote(t("buy-y0"), 1, -5).creditApplied).toBe(0);
  });

  it("only FLEX rows have a deposit to credit", () => {
    expect(depositOf({ plan_id: "flex", units: 2 })).toBe(20_000);
    expect(depositOf({ plan_id: "flex-corp", units: 1 })).toBe(7_000);
    expect(depositOf({ plan_id: "rto-y2", units: 1 })).toBe(0);
  });

  it("every target resolves and has a Thai summary", () => {
    for (const target of conversionTargets) {
      expect(conversionSummary(target, 1, 10_000)).toContain("จ่ายวันนี้");
    }
  });
});
