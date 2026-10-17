import { describe, expect, it } from "vitest";
import { overLimit, sameLeadFields } from "./rate-limit";

describe("sameLeadFields", () => {
  const stored = {
    id: "1",
    source: "quote_form",
    full_name: "สมชาย",
    phone: "0812345678",
    email: null,
    company_name: null,
    message: null,
  };

  it("matches a verbatim resubmit (null and blank alike)", () => {
    expect(
      sameLeadFields(stored, { source: "quote_form", full_name: "สมชาย", phone: "0812345678", email: "", company_name: null, message: null }),
    ).toBe(true);
  });

  it("treats a resubmit that adds details as a new lead", () => {
    expect(sameLeadFields(stored, { source: "quote_form", full_name: "สมชาย", phone: "0812345678", company_name: "รพ.ทดสอบ" })).toBe(false);
    expect(sameLeadFields(stored, { source: "quote_form", phone: "0812345678", email: "buyer@example.com" })).toBe(false);
  });

  it("treats the same contact on another form as a new lead", () => {
    expect(sameLeadFields(stored, { source: "mini_form", phone: "0812345678" })).toBe(false);
  });
});

describe("overLimit", () => {
  it("fails open when the count is unknown", () => {
    expect(overLimit(null, 1)).toBe(false);
    expect(overLimit(5, 5)).toBe(true);
    expect(overLimit(4, 5)).toBe(false);
  });
});
