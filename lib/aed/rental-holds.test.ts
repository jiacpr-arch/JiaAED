import { describe, expect, it } from "vitest";
import { HOLD_PER_UNIT, captureAmount, findHoldPackage, holdExpiringText, holdQuote, holdReturnDateOk, type HoldRow } from "./rental-holds";

const pkg = (id: string) => findHoldPackage(id)!;

describe("event-rental card holds", () => {
  it("2-day rental: rent 1,500 + 900 + VAT, plus the ฿30,000 hold", () => {
    expect(holdQuote(pkg("event-day"), 2, 1)).toEqual({ rentNet: 2_400, rentGross: 2_568, hold: HOLD_PER_UNIT, authorizeTotal: 32_568 });
  });

  it("weekend × 2 units", () => {
    expect(holdQuote(pkg("event-weekend"), 3, 2)).toMatchObject({ rentNet: 7_000, rentGross: 7_490, hold: 60_000 });
  });

  it("no 7-day or longer packages: a card hold only lasts ~7 days", () => {
    expect(findHoldPackage("event-weekly")).toBeNull();
    expect(Math.max(...pkg("event-day").days)).toBeLessThanOrEqual(6);
  });

  it("6 days costs the same as the weekly package (6,000 ex VAT)", () => {
    expect(holdQuote(pkg("event-day"), 6, 1)).toMatchObject({ rentNet: 6_000, rentGross: 6_420, authorizeTotal: 36_420 });
  });

  it("return must be today … +6 days (Bangkok)", () => {
    const now = new Date("2026-11-16T22:00:00+07:00");
    expect(holdReturnDateOk("2026-11-16", now)).toBe(true);
    expect(holdReturnDateOk("2026-11-22", now)).toBe(true);
    expect(holdReturnDateOk("2026-11-23", now)).toBe(false);
    expect(holdReturnDateOk("2026-11-15", now)).toBe(false);
    expect(holdReturnDateOk("16/11/2026", now)).toBe(false);
  });

  it("capture = rent + damage, never more than the hold", () => {
    const q = holdQuote(pkg("event-day"), 1, 1); // 1,605 + 30,000
    expect(captureAmount(q, 0)).toBe(1_605);
    expect(captureAmount(q, 5_000)).toBe(6_605);
    expect(captureAmount(q, 99_999)).toBe(q.authorizeTotal);
    expect(captureAmount(q, -10)).toBe(1_605);
  });

  it("expiry reminder lists each open hold", () => {
    const h = { company_name: "บริษัท วิ่ง", event_name: "มาราธอน", rent_thb: 2_568, capture_before: "2026-11-22T10:00:00Z" } as HoldRow;
    const t = holdExpiringText([h, { ...h, company_name: "ทีม B" }]);
    expect(t).toContain("2 รายการ");
    expect(t).toContain("บริษัท วิ่ง · มาราธอน");
  });
});
