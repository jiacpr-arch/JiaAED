import { describe, expect, it } from "vitest";
import { RENT_TO_OWN_TERMS } from "./packages";
import { SAMPLE_CONTRACT_TERMS, sampleContractClauses } from "./rent-to-own-contract";

describe("sample rent-to-own contract", () => {
  it("uses the Y8 terms shown on the site", () => {
    const t = RENT_TO_OWN_TERMS["pkg-start-y8"];
    expect(SAMPLE_CONTRACT_TERMS).toMatchObject(t);
    expect(SAMPLE_CONTRACT_TERMS.total).toBe(t.deposit + t.monthly * t.months);
  });

  it("calls the first payment เงินดาวน์, never มัดจำ as a deposit", () => {
    const text = sampleContractClauses.flatMap((c) => c.items).join(" ");
    expect(text).toContain("เงินดาวน์");
    expect(text.replace("มิใช่มัดจำ", "")).not.toContain("มัดจำ");
  });
});
