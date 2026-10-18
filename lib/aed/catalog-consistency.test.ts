import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { AED_PRODUCTS } from "./pricing";
import { CONSUMABLE_LIFETIME_YEARS, PRICE_ON_REQUEST, primedicModels, warrantyLine, yuwellGpsAed } from "./primedic";
import { products } from "./products";
import {
  RENT_TO_OWN_TERMS,
  SAFETY_CARE_DEPOSIT,
  SAFETY_PREMIUM_PRICING,
  acquisitionPackages,
} from "./packages";
import { acquisitionComparison, rentalPlans, rentToOwnBreakdowns } from "./rental";
import { subscriptionTiers } from "./subscription";
import { faqs, packageFaqCategories, subscriptionFaqCategories } from "./faqs";
import { survivorReward, TRAINING_POLICY } from "./promotion";
import { documents } from "./documents";
import { knowledgeBlock } from "./knowledge";
import { buildSystemPrompt } from "./system-prompt";
import { WEB_CHAT_SYSTEM_PROMPT } from "./web-chat-prompt";
import {
  PRIMEDIC_LICENSE_EXPIRIES,
  PRIMEDIC_REGULATORY,
  thaiDate,
} from "./regulatory";

// The same physical product used to be priced in up to six files by hand, and
// they drifted (FAQ, bots and articles each quoted different pad lifetimes,
// rental totals, etc.). These checks pin every copy to its single source.

const model = (id: string) => primedicModels.find((m) => m.id === id)!;

describe("one price per physical product", () => {
  it("quote catalog (pricing.ts) matches the public model prices (primedic.ts)", () => {
    for (const id of ["primedic-y0", "primedic-y8", "primedic-y2"]) {
      expect(AED_PRODUCTS[id].startingPrice, id).toBe(model(id).price);
    }
    // GPS is "price on request" on the site (null) — the LINE bot still quotes
    // from AED_PRODUCTS. Once the owner publishes a price, the two must agree.
    if (yuwellGpsAed.price !== null) {
      expect(AED_PRODUCTS["yuwell-gps"].startingPrice).toBe(yuwellGpsAed.price);
    }
  });

  it('the legacy "i7" SKU slot is priced exactly like Yuwell Y2', () => {
    expect(AED_PRODUCTS.i7.startingPrice).toBe(model("primedic-y2").price);
    expect(products.find((p) => p.id === "i7")!.price).toBe(model("primedic-y2").price);
  });

  it("product bundles take their prices from the quote catalog", () => {
    for (const p of products) {
      expect(p.price, p.id).toBe(AED_PRODUCTS[p.id].startingPrice);
      expect(p.msrp, p.id).toBe(AED_PRODUCTS[p.id].msrp);
    }
  });
});

describe("packages", () => {
  it("Safety Premium build-up matches the owner-confirmed prices", () => {
    // Owner confirmed 2026-09-24 — change only with a new confirmation.
    expect(SAFETY_PREMIUM_PRICING.cash).toBe(42_900);
    expect(SAFETY_PREMIUM_PRICING.cashWithCabinet).toBe(49_000);
  });

  it("the GPS upgrade shows no price while the GPS unit is price-on-request", () => {
    if (yuwellGpsAed.price !== null) return;
    const premium = acquisitionPackages.find((p) => p.id === "pkg-premium")!;
    const copy = [premium.priceNote, ...premium.features, ...allFaqAnswers()].join("\n");
    expect(copy).toContain(PRICE_ON_REQUEST);
    // The unsourced figures that used to be printed for it.
    expect(copy).not.toMatch(/63,900|69,900/);
  });

  it("Safety Care headline price is the cheapest subscription tier", () => {
    const cheapest = Math.min(...subscriptionTiers.map((t) => t.pricePerMonth));
    const care = acquisitionPackages.find((p) => p.id === "pkg-care")!;
    expect(care.priceLabel).toContain(`฿${cheapest.toLocaleString("en-US")}`);
    expect(care.priceNote).toContain(`฿${SAFETY_CARE_DEPOSIT.toLocaleString("en-US")}`);
  });

  it("no package shows a struck-through list price", () => {
    for (const p of acquisitionPackages) {
      expect(p).not.toHaveProperty("listPriceLabel");
    }
  });
});

describe("rental numbers are derived, not re-typed", () => {
  it("rent-to-own breakdowns use the package terms and the model cash price", () => {
    const cash: Record<string, number> = {
      "pkg-start-y8": model("primedic-y8").price,
      "pkg-start-y2": model("primedic-y2").price,
    };
    for (const b of rentToOwnBreakdowns) {
      expect(b).toMatchObject(RENT_TO_OWN_TERMS[b.packageId]);
      expect(b.cashPrice).toBe(cash[b.packageId]);
    }
  });

  it("each plan's deposit text shows its own deposit range", () => {
    for (const p of rentalPlans) {
      for (const n of p.depositRange) {
        expect(p.deposit, p.id).toContain(`฿${n.toLocaleString("th-TH")}`);
      }
    }
  });

  it("the comparison table's deposit range covers every plan (incl. EVENT)", () => {
    const lo = Math.min(...rentalPlans.map((p) => p.depositRange[0]));
    const hi = Math.max(...rentalPlans.map((p) => p.depositRange[1]));
    const row = acquisitionComparison.find((r) => r.dimension === "เงินก้อนแรก")!;
    expect(row.rent).toContain(`฿${lo.toLocaleString("th-TH")}`);
    expect(row.rent).toContain(hi.toLocaleString("th-TH"));
    expect(row.buy).toContain(SAFETY_PREMIUM_PRICING.cash.toLocaleString("th-TH"));
  });
});

describe("FAQ #1 doesn't present the flagship as the entry price", () => {
  it("names the cheaper Y0 alongside the Y2 price", () => {
    const answer = faqs[0].answer;
    expect(answer).toContain(model("primedic-y2").price.toLocaleString("en-US"));
    expect(answer).toContain(model("primedic-y0").price.toLocaleString("en-US"));
  });
});

describe("consumable lifetimes are quoted from one constant", () => {
  const padText = `ไม่น้อยกว่า ${CONSUMABLE_LIFETIME_YEARS.pads} ปี`;

  it("both bots quote the spec-sheet lifetime", () => {
    expect(buildSystemPrompt(null)).toContain(padText);
    expect(WEB_CHAT_SYSTEM_PROMPT).toContain(padText);
  });

  it("no bot prompt repeats the old, conflicting figures", () => {
    for (const prompt of [buildSystemPrompt(null), WEB_CHAT_SYSTEM_PROMPT]) {
      expect(prompt).not.toMatch(/≥ ?5 ปี|~5 ปี|2[–-]3 ปี|อายุ 3 ปี แบต/);
    }
  });
});

describe("regulatory numbers have a single source", () => {
  const fda = PRIMEDIC_REGULATORY.fda!;
  const libDir = dirname(fileURLToPath(import.meta.url));

  it("no other lib/aed source file hand-types the อย. registration number", () => {
    const offenders = readdirSync(libDir).filter(
      (f) =>
        /\.tsx?$/.test(f) &&
        f !== "regulatory.ts" &&
        !f.endsWith(".test.ts") &&
        readFileSync(join(libDir, f), "utf8").includes(fda),
    );
    expect(offenders).toEqual([]);
  });

  it("the expiry date exists once and feeds both the copy and the cron", () => {
    expect(PRIMEDIC_REGULATORY.validUntil).toBe(thaiDate(PRIMEDIC_REGULATORY.fdaValidUntil!, "long"));
    expect(PRIMEDIC_REGULATORY.disclaimer).toContain(thaiDate(PRIMEDIC_REGULATORY.fdaValidUntil!));
    expect(PRIMEDIC_LICENSE_EXPIRIES[0].validUntil).toBe(PRIMEDIC_REGULATORY.fdaValidUntil);
    expect(PRIMEDIC_LICENSE_EXPIRIES.map((e) => e.validUntil)).toEqual([
      PRIMEDIC_REGULATORY.fdaValidUntil,
      ...PRIMEDIC_REGULATORY.adLicenses.map((l) => l.validUntil),
    ]);
  });

  it("thaiDate renders Buddhist-era dates", () => {
    expect(thaiDate("2026-12-31")).toBe("31 ธ.ค. 2569");
    expect(thaiDate("2026-12-31", "long")).toBe("31 ธันวาคม 2569");
    expect(thaiDate("2027-02-01")).toBe("1 ก.พ. 2570");
  });

  it("published copy carries the number; the FAQ never calls เจี่ยรักษา the importer", () => {
    if (PRIMEDIC_REGULATORY.published) {
      expect(knowledgeBlock()).toContain(fda);
      expect(faqs[1].answer).toContain(fda);
      expect(documents.some((d) => d.href === PRIMEDIC_REGULATORY.certificateHref)).toBe(true);
    }
    for (const f of faqs) expect(f.answer).not.toContain("ผู้นำเข้าเครื่องมือแพทย์โดยตรง");
  });
});

function allFaqAnswers(): string[] {
  return [faqs, ...[...packageFaqCategories, ...subscriptionFaqCategories].map((c) => c.items)]
    .flat()
    .map((f) => f.answer);
}

describe("training and warranty read the same everywhere", () => {
  it("free training is promised with Safety Premium only, never with every machine", () => {
    const copy = [...allFaqAnswers(), ...survivorReward.points, WEB_CHAT_SYSTEM_PROMPT];
    for (const text of copy) expect(text).not.toMatch(/ทุกเครื่อง[^\n·]{0,12}(มาพร้อม|รวม|ฟรี)[^\n·]{0,10}(คอร์ส|อบรม)/);
    expect(faqs.some((f) => f.answer.includes(TRAINING_POLICY))).toBe(true);
    expect(WEB_CHAT_SYSTEM_PROMPT).toContain(TRAINING_POLICY);
  });

  it("every model's warranty comes from primedic.ts, in both bots and the FAQs", () => {
    for (const m of [...primedicModels, yuwellGpsAed]) expect(warrantyLine).toContain(`${m.warrantyYears} ปี`);
    expect(buildSystemPrompt(null)).toContain(warrantyLine);
    expect(WEB_CHAT_SYSTEM_PROMPT).toContain(warrantyLine);
    expect(knowledgeBlock()).toContain(warrantyLine);
    expect(allFaqAnswers().some((a) => a.includes(warrantyLine))).toBe(true);
  });
});
