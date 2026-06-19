import { describe, it, expect } from "vitest";
import { scoreConversation, CONVERSATION_HOT_THRESHOLD, type ConversationScoreInput } from "./lead-scoring";

const emptyCustomer = {
  full_name: null,
  phone: null,
  email: null,
  company_name: null,
};

function score(partial: Partial<ConversationScoreInput>) {
  return scoreConversation({
    customer: emptyCustomer,
    toolsUsed: [],
    messageCount: 1,
    ...partial,
  });
}

describe("scoreConversation", () => {
  it("scores a brand-new anonymous chat at 0 / browsing", () => {
    const r = score({});
    expect(r.score).toBe(0);
    expect(r.intent).toBe("browsing");
    expect(r.reasons).toEqual([]);
  });

  it("rewards a captured phone number as the strongest contact signal", () => {
    const r = score({ customer: { ...emptyCustomer, phone: "0812345678" } });
    expect(r.score).toBe(4);
    expect(r.intent).toBe("contact_shared");
    expect(r.reasons).toContain("phone +4");
  });

  it("adds up multiple contact fields", () => {
    const r = score({
      customer: { full_name: "สมชาย", phone: "0812345678", email: "a@b.co", company_name: "รพ.ทดสอบ" },
    });
    // phone 4 + email 2 + company 2 + name 1 = 9
    expect(r.score).toBe(9);
    expect(r.intent).toBe("contact_shared");
  });

  it("treats a quotation as high intent", () => {
    const r = score({
      customer: { ...emptyCustomer, full_name: "สมชาย", phone: "0812345678" },
      toolsUsed: [{ name: "calculate_price", input: {} }, { name: "create_quotation", input: {} }],
    });
    // phone 4 + name 1 + viewed_price 2 + quotation 5 = 12
    expect(r.score).toBe(12);
    expect(r.intent).toBe("quotation");
    expect(r.reasons).toContain("quotation +5");
  });

  it("treats a quotation as the highest buying intent (no payment link — LINE contact instead)", () => {
    const r = score({
      toolsUsed: [{ name: "create_quotation" }],
    });
    expect(r.intent).toBe("quotation");
    expect(r.reasons).toContain("quotation +5");
  });

  it("labels an escalation as escalated when no higher signal exists", () => {
    const r = score({ toolsUsed: [{ name: "escalate_to_human" }] });
    expect(r.intent).toBe("escalated");
    expect(r.score).toBe(3);
  });

  it("merges contact info captured this turn via update_customer_info", () => {
    // customer row is still blank (info was just shared this turn), but the
    // update_customer_info tool input carries the phone — it must still count.
    const r = score({
      customer: emptyCustomer,
      toolsUsed: [{ name: "update_customer_info", input: { phone: "0898887777", company_name: "ACME" } }],
    });
    expect(r.reasons).toContain("phone +4");
    expect(r.reasons).toContain("company +2");
    expect(r.intent).toBe("contact_shared");
  });

  it("ignores blank/whitespace tool values", () => {
    const r = score({
      toolsUsed: [{ name: "update_customer_info", input: { phone: "   ", email: "" } }],
    });
    expect(r.score).toBe(0);
  });

  it("rewards engagement depth", () => {
    expect(score({ messageCount: 4 }).reasons).toContain("engaged +1");
    const deep = score({ messageCount: 8 });
    expect(deep.reasons).toContain("engaged +1");
    expect(deep.reasons).toContain("deep_engaged +1");
    expect(deep.score).toBe(2);
  });

  it("crosses the hot threshold for a realistic buying chat", () => {
    const r = score({
      customer: { full_name: "สมชาย", phone: "0812345678", email: null, company_name: "รร.ทดสอบ" },
      toolsUsed: [{ name: "calculate_price" }],
      messageCount: 5,
    });
    // phone 4 + company 2 + name 1 + viewed_price 2 + engaged 1 = 10
    expect(r.score).toBeGreaterThanOrEqual(CONVERSATION_HOT_THRESHOLD);
  });
});
