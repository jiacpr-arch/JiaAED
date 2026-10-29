import { describe, expect, it } from "vitest";
import { RENTAL_PRICES, RENTAL_REPLACEMENT_VALUE } from "./rental-prices";
import { rentalFaqs, rentalKnowledgeBlock } from "./rental";
import { rentalContractClauses, rentalTermsTable } from "./rental-terms";

const thb = (n: number) => `฿${n.toLocaleString("en-US")}`;

describe("rental terms", () => {
  it("charges late returns at the next-day event rate", () => {
    const late = rentalTermsTable.find((r) => r.topic === "คืนเครื่องช้า")!;
    expect(late.short).toContain(thb(RENTAL_PRICES.eventNextDay));
  });

  it("states the same replacement value in the FAQ and the contract", () => {
    const faq = rentalFaqs.find((f) => f.question.includes("สูญหาย"))!;
    const clauses = rentalContractClauses.flatMap((c) => c.items).join(" ");
    for (const v of Object.values(RENTAL_REPLACEMENT_VALUE)) {
      expect(faq.answer).toContain(v.toLocaleString("th-TH"));
      expect(clauses).toContain(thb(v));
    }
  });

  it("gives the bots the terms link", () => {
    expect(rentalKnowledgeBlock()).toContain("/aed/rental/terms");
  });
});
