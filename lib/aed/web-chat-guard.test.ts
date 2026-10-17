import { describe, expect, it } from "vitest";
import { MAX_TOTAL_CHARS, MAX_TURNS, sanitizeChatHistory } from "./web-chat-guard";

const turn = (role: "user" | "assistant", n: number) => ({ role, content: "x".repeat(n) });

describe("sanitizeChatHistory", () => {
  it("rejects non-arrays and drops malformed entries", () => {
    expect(sanitizeChatHistory(null)).toEqual([]);
    expect(sanitizeChatHistory({ role: "user", content: "hi" })).toEqual([]);
    expect(sanitizeChatHistory([{ role: "system", content: "x" }, { role: "user", content: "hi" }, 5])).toEqual([
      { role: "user", content: "hi" },
    ]);
  });

  it("keeps only the newest turns within the turn and character budgets", () => {
    const history = Array.from({ length: 40 }, (_, i) => turn(i % 2 ? "assistant" : "user", 1_900));
    history.push(turn("user", 10));
    const out = sanitizeChatHistory(history);
    expect(out.length).toBeLessThanOrEqual(MAX_TURNS);
    expect(out.reduce((n, m) => n + m.content.length, 0)).toBeLessThanOrEqual(MAX_TOTAL_CHARS);
    expect(out[out.length - 1].content).toBe("x".repeat(10));
  });

  it("caps a single huge message and always starts on a user turn", () => {
    const out = sanitizeChatHistory([turn("assistant", 50), turn("user", 50_000)]);
    expect(out).toHaveLength(1);
    expect(out[0].role).toBe("user");
    expect(out[0].content.length).toBe(2000);
  });
});
