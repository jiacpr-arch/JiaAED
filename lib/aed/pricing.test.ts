import { describe, it, expect } from "vitest";
import {
  calculatePrice,
  evaluateNegotiation,
  assertAboveMarketFloor,
  getProduct,
  formatThaiPrice,
  AED_PRODUCTS,
} from "./pricing";

describe("calculatePrice", () => {
  it("returns null for an unknown product", () => {
    expect(calculatePrice("does-not-exist", 1)).toBeNull();
  });

  it("quotes startingPrice for a single individual unit", () => {
    const r = calculatePrice("i7", 1, "individual")!;
    expect(r.unitPrice).toBe(AED_PRODUCTS.i7.startingPrice); // 39,999
    expect(r.priceLevel).toBe("standard");
    expect(r.canDiscount).toBe(true);
  });

  it("computes VAT and grand total correctly", () => {
    const r = calculatePrice("i7", 1, "individual")!;
    const subtotal = AED_PRODUCTS.i7.startingPrice;
    const vat = Math.round(subtotal * 0.07 * 100) / 100;
    expect(r.subtotal).toBe(subtotal);
    expect(r.vatAmount).toBe(vat);
    expect(r.grandTotal).toBe(subtotal + vat);
  });

  it("uses the midpoint price for qty 2-4", () => {
    const r = calculatePrice("i7", 3, "individual")!;
    const expected = Math.round((AED_PRODUCTS.i7.startingPrice + AED_PRODUCTS.i7.bestPrice) / 2);
    expect(r.unitPrice).toBe(expected);
    expect(r.subtotal).toBe(expected * 3);
  });

  it("drops to bestPrice and forbids further discount for bulk (>=5)", () => {
    const r = calculatePrice("i7", 5, "individual")!;
    expect(r.unitPrice).toBe(AED_PRODUCTS.i7.bestPrice);
    expect(r.priceLevel).toBe("best");
    expect(r.canDiscount).toBe(false);
  });

  it("treats government buyers as bestPrice regardless of quantity", () => {
    const r = calculatePrice("i7", 1, "government")!;
    expect(r.unitPrice).toBe(AED_PRODUCTS.i7.bestPrice);
    expect(r.priceLevel).toBe("best");
    expect(r.canDiscount).toBe(false);
  });

  it("never quotes below minPrice across every product/quantity/type", () => {
    const types = ["individual", "corporate", "government"] as const;
    for (const id of Object.keys(AED_PRODUCTS)) {
      for (const qty of [1, 2, 5, 10]) {
        for (const t of types) {
          const r = calculatePrice(id, qty, t)!;
          expect(r.unitPrice).toBeGreaterThanOrEqual(AED_PRODUCTS[id].minPrice);
        }
      }
    }
  });
});

describe("evaluateNegotiation", () => {
  it("approves outright at or above bestPrice with no counter", () => {
    const r = evaluateNegotiation("i7", 1, AED_PRODUCTS.i7.bestPrice);
    expect(r).toEqual({ approved: true, counterOffer: null, needsEscalation: false });
  });

  it("approves between minPrice and bestPrice but counters at minPrice", () => {
    const mid = Math.round((AED_PRODUCTS.i7.minPrice + AED_PRODUCTS.i7.bestPrice) / 2);
    const r = evaluateNegotiation("i7", 1, mid);
    expect(r.approved).toBe(true);
    expect(r.counterOffer).toBe(AED_PRODUCTS.i7.minPrice);
    expect(r.needsEscalation).toBe(false);
  });

  it("escalates and refuses anything below minPrice", () => {
    const r = evaluateNegotiation("i7", 1, AED_PRODUCTS.i7.minPrice - 1);
    expect(r.approved).toBe(false);
    expect(r.needsEscalation).toBe(true);
    expect(r.counterOffer).toBe(AED_PRODUCTS.i7.minPrice);
  });

  it("is safe for an unknown product", () => {
    const r = evaluateNegotiation("nope", 1, 1000);
    expect(r).toEqual({ approved: false, counterOffer: null, needsEscalation: false });
  });
});

describe("assertAboveMarketFloor", () => {
  it("confirms no catalog price sits at or below the market floor", () => {
    // This is the CI guard the pricing policy documents — keep the catalog from
    // silently undercutting the market on consumables. Must stay green.
    expect(assertAboveMarketFloor()).toEqual([]);
  });
});

describe("helpers", () => {
  it("getProduct round-trips a known id and rejects unknowns", () => {
    expect(getProduct("i7")?.id).toBe("i7");
    expect(getProduct("nope")).toBeNull();
  });

  it("formats Thai prices with the บาท suffix", () => {
    expect(formatThaiPrice(39999)).toContain("บาท");
    expect(formatThaiPrice(39999)).toContain("39,999");
  });
});
