import { describe, expect, it } from "vitest";
import { PRICE_VAT_RULE } from "./checkout";
import { buildSystemPrompt } from "./system-prompt";
import { WEB_CHAT_SYSTEM_PROMPT } from "./web-chat-prompt";

// The site labels prices "ex VAT" (owner, 16 พ.ย. 2026); both bots must say
// it the same way and never fall back to "ก่อน VAT" / "ยังไม่รวม VAT".
const OLD = /ก่อน VAT|ยังไม่รวม VAT|ไม่รวม VAT/;

describe("bots word prices as 'ex VAT'", () => {
  it("LINE bot prompt carries the rule and no old wording", () => {
    const p = buildSystemPrompt(null);
    expect(p).toContain(PRICE_VAT_RULE);
    expect(p.replace(PRICE_VAT_RULE, "")).not.toMatch(OLD);
  });

  it("web chat prompt carries the rule and no old wording", () => {
    expect(WEB_CHAT_SYSTEM_PROMPT).toContain(PRICE_VAT_RULE);
    expect(WEB_CHAT_SYSTEM_PROMPT.replace(PRICE_VAT_RULE, "")).not.toMatch(OLD);
  });
});
