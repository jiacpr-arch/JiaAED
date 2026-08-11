import { describe, expect, it } from "vitest";

import { rentalKnowledgeBlock, rentToOwnBreakdowns, rentToOwnTotal } from "./rental";
import { buildSystemPrompt } from "./system-prompt";
import { WEB_CHAT_SYSTEM_PROMPT } from "./web-chat-prompt";

// ลูกค้าที่กดปุ่ม "สนใจเช่า AED" จากหน้าเว็บเคยถูกบอทตอบว่า "มีบริการขาย
// เท่านั้น" เพราะ prompt ไม่มีข้อมูลเช่าเลย — เทสต์ชุดนี้ล็อกว่า prompt ของ
// ทั้งสองบอทมีความรู้เรื่องเช่า/เช่าซื้อเสมอ และตัวเลขมาจาก data จริง
describe("rentalKnowledgeBlock", () => {
  it("carries the real plan prices from rental data", () => {
    const block = rentalKnowledgeBlock();
    expect(block).toContain("แผนรายปี (ANNUAL)");
    expect(block).toContain("฿22,000");
    expect(block).toContain("แผนยืดหยุ่น (FLEX)");
    expect(block).toContain("฿1,990");
    expect(block).toContain("แผนอีเวนต์ (EVENT)");
  });

  it("derives rent-to-own totals instead of hardcoding them", () => {
    const block = rentalKnowledgeBlock();
    for (const b of rentToOwnBreakdowns) {
      expect(block).toContain(`฿${rentToOwnTotal(b).toLocaleString("th-TH")}`);
    }
  });
});

describe("bot prompts include rental knowledge", () => {
  it("LINE bot prompt covers rental and forbids the sale-only answer", () => {
    const prompt = buildSystemPrompt(null);
    expect(prompt).toContain("เช่าซื้อ (Rent-to-Own)");
    expect(prompt).toContain("ห้ามบอกว่ามีขายอย่างเดียว");
  });

  it("web chat prompt covers rental and links the rental page", () => {
    expect(WEB_CHAT_SYSTEM_PROMPT).toContain("เช่าซื้อ (Rent-to-Own)");
    expect(WEB_CHAT_SYSTEM_PROMPT).toContain("/aed/rental");
  });
});
