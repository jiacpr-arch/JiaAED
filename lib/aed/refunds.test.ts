import { describe, expect, it } from "vitest";
import { flexEndQuote, orderRefundAmount, refundableLeft } from "./refunds";

const paid = { total_thb: 58_743, refunded_thb: 0, status: "paid" };

describe("order refunds", () => {
  it("refund up to what is left, never more", () => {
    expect(refundableLeft(paid)).toBe(58_743);
    expect(orderRefundAmount(paid, 58_743)).toBe(58_743);
    expect(orderRefundAmount(paid, 10_000)).toBe(10_000);
    expect(orderRefundAmount(paid, 58_743.01)).toBe("bad_amount");
    expect(orderRefundAmount(paid, 0)).toBe("bad_amount");
    expect(orderRefundAmount(paid, NaN)).toBe("bad_amount");
  });

  it("partial refunds add up; fully refunded or unpaid orders refund nothing", () => {
    const part = { ...paid, refunded_thb: 50_000 };
    expect(refundableLeft(part)).toBe(8_743);
    expect(orderRefundAmount({ ...paid, refunded_thb: 58_743 }, 1)).toBe("nothing_to_refund");
    expect(orderRefundAmount({ ...paid, status: "pending" }, 1)).toBe("nothing_to_refund");
  });
});

describe("FLEX end of rental", () => {
  it("deposit back minus damage, damage capped at the deposit", () => {
    expect(flexEndQuote({ plan_id: "flex", units: 1 }, 0)).toEqual({ deposit: 10_000, damage: 0, refund: 10_000 });
    expect(flexEndQuote({ plan_id: "flex-corp", units: 2 }, 5_000)).toEqual({ deposit: 14_000, damage: 5_000, refund: 9_000 });
    expect(flexEndQuote({ plan_id: "flex", units: 1 }, 99_999)).toEqual({ deposit: 10_000, damage: 10_000, refund: 0 });
    expect(flexEndQuote({ plan_id: "flex", units: 1 }, -50)?.damage).toBe(0);
  });

  it("rent-to-own has no refundable deposit", () => {
    expect(flexEndQuote({ plan_id: "rto-y2", units: 1 }, 0)).toBeNull();
  });
});
