import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

const MIN_VIEWS_PER_VARIANT = 30;

export type AbState = {
  a_views: number;
  a_clicks: number;
  a_ctr: number;
  b_views: number;
  b_clicks: number;
  b_ctr: number;
  loser: "a" | "b";
  winner: "a" | "b";
  loser_ctr: number;
  winner_ctr: number;
  sample_too_small: boolean;
};

export async function readAbState(daysBack = 7): Promise<AbState> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  const { data: views } = await supabase
    .from("aed_analytics_events")
    .select("properties")
    .eq("event_name", "hero_cta_view")
    .gte("created_at", since);

  const { data: clicks } = await supabase
    .from("aed_analytics_events")
    .select("properties")
    .eq("event_name", "line_click")
    .gte("created_at", since);

  const variantOf = (row: { properties: Record<string, unknown> | null }, key: string) =>
    (row.properties?.[key] as string) ?? null;

  const a_views = (views ?? []).filter((r) => variantOf(r, "variant") === "a").length;
  const b_views = (views ?? []).filter((r) => variantOf(r, "variant") === "b").length;
  const a_clicks = (clicks ?? []).filter(
    (r) => variantOf(r, "hero_variant") === "a" && variantOf(r, "location") === "hero",
  ).length;
  const b_clicks = (clicks ?? []).filter(
    (r) => variantOf(r, "hero_variant") === "b" && variantOf(r, "location") === "hero",
  ).length;

  const a_ctr = a_views > 0 ? (a_clicks / a_views) * 100 : 0;
  const b_ctr = b_views > 0 ? (b_clicks / b_views) * 100 : 0;

  const winner: "a" | "b" = b_ctr > a_ctr ? "b" : "a";
  const loser: "a" | "b" = winner === "a" ? "b" : "a";

  return {
    a_views,
    a_clicks,
    a_ctr: Math.round(a_ctr * 10) / 10,
    b_views,
    b_clicks,
    b_ctr: Math.round(b_ctr * 10) / 10,
    winner,
    loser,
    winner_ctr: winner === "a" ? a_ctr : b_ctr,
    loser_ctr: loser === "a" ? a_ctr : b_ctr,
    sample_too_small: a_views < MIN_VIEWS_PER_VARIANT || b_views < MIN_VIEWS_PER_VARIANT,
  };
}

const SYSTEM_PROMPT = `คุณคือนักการตลาดที่ช่วยร้าน JiaAED (ขาย AED Amoul i7 — เครื่องกระตุกหัวใจไฟฟ้า) เขียน CTA copy

ข้อกำหนด:
- ตอบเป็น JSON เท่านั้น ไม่มี markdown
- format: {"copy": "...", "rationale": "..."}
- copy ต้องเป็น 1 บรรทัด ภาษาไทย ความยาว 20-40 ตัวอักษร
- เริ่มด้วย emoji ที่เหมาะกับ CTA (💬 📋 ☎️ 🎁 🛒 ฯลฯ)
- ห้ามใช้คำว่า "อย." "ฆพ." หรือเลขทะเบียนใดๆ (กฎ regulatory)
- ห้ามทำให้ดูเหมือนการรับประกันชีวิต / รักษาโรค (medical claim restriction)
- rationale อธิบายสั้นๆ ว่าทำไม copy นี้น่าจะ click มากกว่า variant ที่แพ้`;

export type ProposedCta = { copy: string; rationale: string };

export async function proposeNewCta(args: {
  ab: AbState;
  current_loser_copy: string;
  current_winner_copy: string;
}): Promise<ProposedCta> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const anthropic = new Anthropic({ apiKey });

  const prompt = [
    `A/B test สัปดาห์ที่ผ่านมา ของปุ่ม Hero CTA ในเว็บ JiaAED:`,
    ``,
    `Variant A: "${args.ab.loser === "a" ? args.current_loser_copy : args.current_winner_copy}"`,
    `  → views ${args.ab.a_views} / clicks ${args.ab.a_clicks} / CTR ${args.ab.a_ctr}%`,
    ``,
    `Variant B: "${args.ab.loser === "b" ? args.current_loser_copy : args.current_winner_copy}"`,
    `  → views ${args.ab.b_views} / clicks ${args.ab.b_clicks} / CTR ${args.ab.b_ctr}%`,
    ``,
    `ตัว loser คือ variant ${args.ab.loser.toUpperCase()} ("${args.current_loser_copy}")`,
    ``,
    `ช่วยเขียน CTA copy ใหม่ 1 ตัว มาแทน loser โดยพยายามเอาชนะ winner (CTR ${args.ab.winner_ctr}%)`,
    `กลุ่มเป้าหมาย: เจ้าของกิจการ/ผู้ดูแล safety ที่กำลังคิดซื้อ AED — ปลายทางคลิกแล้วเปิด LINE OA สอบถาม`,
    `ห้ามใช้คำใกล้เคียงกับ winner หรือ loser (เพื่อทดสอบ angle ใหม่)`,
  ].join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  let parsed: ProposedCta;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text) as ProposedCta;
  } catch {
    throw new Error(`AI returned invalid JSON: ${text.slice(0, 200)}`);
  }

  if (!parsed.copy || typeof parsed.copy !== "string") {
    throw new Error("AI response missing 'copy'");
  }
  if (parsed.copy.length < 10 || parsed.copy.length > 50) {
    throw new Error(`copy length out of range (${parsed.copy.length}): "${parsed.copy}"`);
  }
  // regulatory safety
  if (/อย\.|ฆพ\.|ทะเบียน|เลขที่/.test(parsed.copy)) {
    throw new Error(`copy violates regulatory rules: "${parsed.copy}"`);
  }
  return parsed;
}

/**
 * Build a new HeroCta.tsx file content replacing only the loser variant's copy
 * inside the COPY constant. We use exact string replacement on the literal so
 * we never touch any other code in the file.
 */
export function buildNewHeroCtaFile(
  current: string,
  args: { loser: "a" | "b"; oldCopy: string; newCopy: string },
): string {
  const needle = `  ${args.loser}: ${JSON.stringify(args.oldCopy)},`;
  const replacement = `  ${args.loser}: ${JSON.stringify(args.newCopy)},`;

  if (!current.includes(needle)) {
    throw new Error(`Cannot find loser line in HeroCta.tsx — expected: ${needle}`);
  }
  // Ensure exactly one match (avoid ambiguous edits)
  const occurrences = current.split(needle).length - 1;
  if (occurrences !== 1) {
    throw new Error(`Ambiguous loser line: ${occurrences} occurrences`);
  }
  return current.replace(needle, replacement);
}

export function extractCopy(file: string, variant: "a" | "b"): string {
  const re = new RegExp(`\\s${variant}:\\s*"([^"]+)"`);
  const m = file.match(re);
  if (!m) throw new Error(`Cannot find ${variant} variant in HeroCta.tsx`);
  return m[1];
}
