import Anthropic from "@anthropic-ai/sdk";
import type { GrowthConfig } from "./types";

// Turn a structured metrics object into plain-language, prioritised
// recommendations using Claude. The persona / rules live in cfg.llm.systemPrompt
// so each brand can tune the voice without touching code.
export async function analyze(context: unknown, cfg: GrowthConfig): Promise<string> {
  const anthropic = new Anthropic({ apiKey: cfg.llm.apiKey });

  const response = await anthropic.messages.create({
    model: cfg.llm.model,
    max_tokens: cfg.llm.maxTokens,
    system: cfg.llm.systemPrompt,
    messages: [
      {
        role: "user",
        content: `ข้อมูลของ ${cfg.brand}:\n\n${JSON.stringify(context, null, 2)}\n\nช่วยวิเคราะห์ + แนะนำ action items ให้หน่อยครับ`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return text || "🤖 ยังไม่มี insight สำหรับช่วงนี้";
}
