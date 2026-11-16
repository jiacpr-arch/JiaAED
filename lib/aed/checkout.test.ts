import { afterEach, describe, expect, it } from "vitest";
import { checkoutEnabled, checkoutItems, findCheckoutItem, paymentMethods, satang, thbExact, vatOf } from "./checkout";
import { activePreviousPrice, listedPrimedicModels, primedicModels } from "./primedic";
import { bundles } from "./bundles";

describe("checkout catalog", () => {
  it("sells the listed models and the sets at the site price + 7% VAT", () => {
    expect(checkoutItems.map((i) => i.id)).toEqual([...listedPrimedicModels.map((m) => m.id), ...bundles.map((b) => b.id)]);
    for (const i of checkoutItems) {
      const price = primedicModels.find((x) => x.id === i.id)?.price ?? bundles.find((b) => b.id === i.id)!.price;
      expect(i.net).toBe(price);
      expect(satang(i.vat)).toBe(Math.round(price * 7));
      expect(satang(i.gross)).toBe(satang(i.net) + satang(i.vat));
    }
  });

  it("Y2 = 49,900 + 3,493 VAT = 53,393 · Y0 = 39,999 + 2,799.93 = 42,798.93", () => {
    expect(findCheckoutItem("primedic-y2")).toMatchObject({ net: 49_900, vat: 3_493, gross: 53_393 });
    expect(findCheckoutItem("primedic-y0")).toMatchObject({ net: 39_999, vat: 2_799.93, gross: 42_798.93 });
    expect(vatOf(39_999)).toBe(2_799.93);
  });

  it("never sells an unlisted / quote-only product online", () => {
    for (const id of ["primedic-y8", "yuwell-gps", "i7", "", null, undefined, 42]) {
      expect(findCheckoutItem(id)).toBeNull();
    }
  });

  it("formats exact baht", () => {
    expect(thbExact(53_393)).toBe("฿53,393");
    expect(thbExact(42_798.93)).toBe("฿42,798.93");
  });
});

describe("checkout switches", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("is off without a Stripe key and with the kill switch", () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(checkoutEnabled()).toBe(false);
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    expect(checkoutEnabled()).toBe(true);
    process.env.CHECKOUT_DISABLED = "1";
    expect(checkoutEnabled()).toBe(false);
  });

  it("payment methods default to card + PromptPay and ignore junk", () => {
    expect(paymentMethods(undefined)).toEqual(["card", "promptpay"]);
    expect(paymentMethods("promptpay")).toEqual(["promptpay"]);
    expect(paymentMethods("PromptPay, card, bitcoin")).toEqual(["promptpay", "card"]);
    expect(paymentMethods("bitcoin")).toEqual(["card", "promptpay"]);
  });
});

describe("struck-through former price (ราคาเดิม)", () => {
  // Thai price-display rules: a struck price must be one we really sold at.
  // Every previousPrice must name the period it was sold and expire ≤ 90 days
  // after that period ended, so it can't become a permanent fake discount.
  it("is a documented, recent, higher price", () => {
    for (const m of primedicModels) {
      const p = m.previousPrice;
      if (!p) continue;
      expect(p.amount, m.id).toBeGreaterThan(m.price);
      const from = Date.parse(p.soldFrom);
      const until = Date.parse(p.soldUntil);
      const show = Date.parse(p.showUntil);
      expect(from, m.id).toBeLessThan(until);
      expect(show, m.id).toBeGreaterThan(until);
      expect((show - until) / 86_400_000, m.id).toBeLessThanOrEqual(92);
    }
  });

  it("Y2 shows ฿59,999 until 13 ก.พ. 2027 (Bangkok), then nothing", () => {
    const y2 = primedicModels.find((m) => m.id === "primedic-y2")!;
    expect(activePreviousPrice(y2, new Date("2026-11-16T12:00:00+07:00"))).toBe(59_999);
    expect(activePreviousPrice(y2, new Date("2027-02-13T23:00:00+07:00"))).toBe(59_999);
    expect(activePreviousPrice(y2, new Date("2027-02-14T00:00:01+07:00"))).toBeNull();
  });

  it("Y0 has no former price to strike (it went 39,000 → 39,999, up)", () => {
    const y0 = primedicModels.find((m) => m.id === "primedic-y0")!;
    expect(activePreviousPrice(y0)).toBeNull();
  });
});
