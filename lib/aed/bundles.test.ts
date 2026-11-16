import { describe, expect, it } from "vitest";
import { bundleCompareAt, bundles, findBundle, separatePrice } from "./bundles";
import { findCheckoutItem } from "./checkout";
import { AED_PRODUCTS } from "./pricing";
import { primedicModels } from "./primedic";
import { accessories } from "./products";

const price = (id: string) => primedicModels.find((m) => m.id === id)?.price ?? accessories.find((a) => a.id === id)!.price!;

describe("ready-to-use sets", () => {
  it("'ซื้อแยก' is the real sum of the parts' own site prices", () => {
    expect(separatePrice(findBundle("set-y2-ready")!)).toBe(price("primedic-y2") + price("cabinet-wall")); // 55,800
    expect(separatePrice(findBundle("set-y2-org")!)).toBe(price("primedic-y2") + price("cabinet-wall") + price("training-course")); // 64,300
  });

  it("free extras (online seats, sign) are never counted in the struck price", () => {
    for (const b of bundles) {
      const free = b.parts.filter((p) => p.price == null);
      expect(free.length, b.id).toBeGreaterThan(0);
      expect(free.every((p) => /แถม|ออนไลน์|ป้าย/.test(p.label)), b.id).toBe(true);
    }
  });

  it("current set prices: Y0 39,999 (no strike) · Y2 ready 54,900 vs 55,800 · Y2 org 59,900 vs 64,300", () => {
    expect([findBundle("set-y0-start")!.price, bundleCompareAt(findBundle("set-y0-start")!)]).toEqual([39_999, null]);
    expect([findBundle("set-y2-ready")!.price, bundleCompareAt(findBundle("set-y2-ready")!)]).toEqual([54_900, 55_800]);
    expect([findBundle("set-y2-org")!.price, bundleCompareAt(findBundle("set-y2-org")!)]).toEqual([59_900, 64_300]);
  });

  it("Y2 + cabinet set uses the same price as the quote catalog", () => {
    expect(findBundle("set-y2-ready")!.price).toBe(AED_PRODUCTS["i7-cabinet"].startingPrice);
  });

  it("no set undercuts its machine's own price (Yuwell minimum advertised price)", () => {
    for (const b of bundles) expect(b.price, b.id).toBeGreaterThanOrEqual(price(b.model));
  });

  it("every set can be bought online, + 7% VAT at checkout", () => {
    expect(findCheckoutItem("set-y2-ready")).toMatchObject({ net: 54_900, vat: 3_843, gross: 58_743 });
    expect(findCheckoutItem("set-y2-org")).toMatchObject({ net: 59_900, gross: 64_093 });
    for (const b of bundles) expect(findCheckoutItem(b.id)?.returnPath).toBe("/aed/sets");
  });
});
