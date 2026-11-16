import { describe, expect, it } from "vitest";
import { dueFollowups, isStale, nextStage, orderDigestText, orderTodos, parseSerials, stageOf, type FulfillmentRow } from "./order-fulfillment";

const now = new Date("2026-11-20T03:00:00Z");
const base: FulfillmentRow = {
  id: 1,
  status: "paid",
  product_id: "primedic-y2",
  units: 1,
  total_thb: 53_393,
  refunded_thb: 0,
  customer_name: "สมชาย",
  company_name: null,
  customer_phone: "0812345678",
  fulfillment_status: "new",
  paid_at: "2026-11-18T03:00:00Z",
  created_at: "2026-11-18T02:59:00Z",
};

describe("stages", () => {
  it("walks new → confirmed → delivered → invoiced → end", () => {
    expect(nextStage("new")).toBe("confirmed");
    expect(nextStage("confirmed")).toBe("delivered");
    expect(nextStage("delivered")).toBe("invoiced");
    expect(nextStage("invoiced")).toBeNull();
  });
  it("treats missing / unknown status as new", () => {
    expect(stageOf({ fulfillment_status: null })).toBe("new");
    expect(stageOf({ fulfillment_status: "weird" })).toBe("new");
  });
});

describe("stale orders", () => {
  it("flags an order waiting > 24 h", () => {
    expect(isStale(base, now)).toBe(true);
    expect(isStale({ ...base, paid_at: "2026-11-19T12:00:00Z" }, now)).toBe(false);
  });
  it("uses the time of the last stage change", () => {
    expect(isStale({ ...base, fulfillment_status: "confirmed", stage_changed_at: "2026-11-19T20:00:00Z" }, now)).toBe(false);
  });
  it("ignores finished and fully refunded orders", () => {
    expect(isStale({ ...base, fulfillment_status: "invoiced" }, now)).toBe(false);
    expect(isStale({ ...base, refunded_thb: 53_393 }, now)).toBe(false);
    expect(isStale({ ...base, refunded_thb: 1_000 }, now)).toBe(true);
  });
});

describe("follow-ups after delivery", () => {
  const delivered = { ...base, fulfillment_status: "invoiced", delivered_at: "2026-11-10T03:00:00Z" };
  it("7-day call is due after 7 days, once", () => {
    expect(dueFollowups(delivered, now).map((f) => f.id)).toEqual(["d7"]);
    expect(dueFollowups({ ...delivered, followup_d7_at: "2026-11-18T00:00:00Z" }, now)).toEqual([]);
    expect(dueFollowups({ ...delivered, delivered_at: "2026-11-15T03:00:00Z" }, now)).toEqual([]);
  });
  it("11-month call replaces a missed 7-day one", () => {
    const old = { ...delivered, delivered_at: "2025-12-01T00:00:00Z" };
    expect(dueFollowups(old, now).map((f) => f.id)).toEqual(["m11"]);
  });
  it("nothing before delivery", () => {
    expect(dueFollowups({ ...base, fulfillment_status: "confirmed" }, now)).toEqual([]);
  });
});

describe("digest", () => {
  it("lists stale orders and calls with the phone number", () => {
    const text = orderDigestText([base, { ...base, id: 2, fulfillment_status: "invoiced", delivered_at: "2026-11-10T03:00:00Z" }], now)!;
    expect(text).toContain("ออเดอร์ค้าง");
    expect(text).toContain("โทรยืนยันกับลูกค้า");
    expect(text).toContain("ติดตาม 7 วัน");
    expect(text).toContain("0812345678");
    expect(orderTodos([base], now)).toHaveLength(1);
  });
  it("is null when nothing is due", () => {
    expect(orderDigestText([{ ...base, fulfillment_status: "invoiced" }], now)).toBeNull();
  });
});

describe("parseSerials", () => {
  it("splits on commas, spaces and new lines, deduped", () => {
    expect(parseSerials("A1, A2\nA3 A1")).toEqual(["A1", "A2", "A3"]);
    expect(parseSerials(undefined)).toEqual([]);
  });
});
