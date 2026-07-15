import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

const MIN_VIEWS_PER_VARIANT = 100;

export type HeadlineAbState = {
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

export async function readHeadlineAbState(daysBack = 7): Promise<HeadlineAbState> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  const { data: views } = await supabase
    .from("aed_analytics_events")
    .select("properties")
    .eq("event_name", "hero_headline_view")
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
  const a_clicks = (clicks ?? []).filter((r) => variantOf(r, "headline_variant") === "a").length;
  const b_clicks = (clicks ?? []).filter((r) => variantOf(r, "headline_variant") === "b").length;

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

const SYSTEM_PROMPT = `คุณคือนักเขียน headline สำหรับเว็บ JiaAED (ขาย AED Yuwell Y2 / PRIMEDIC HeartSave — เครื่องกระตุกหัวใจไฟฟ้า)

ข้อกำหนด strict:
- ตอบเป็น JSON เท่านั้น ไม่มี markdown
- format: {"line1": "...", "accent": "...", "line2": "...", "rationale": "..."}
- headline จะแสดง 3 บรรทัด: line1 / accent (สีเหลืองเด่น) / line2
- รวมความยาว 3 บรรทัด 30-80 ตัวอักษร อ่านแล้วเข้าใจคุณค่าทันที
- กลุ่มเป้าหมาย: คน FB/IG ที่เห็นโฆษณา 3 วินาทีแรกบน mobile — ใจร้อน
- ห้ามใช้คำว่า "อย." "ฆพ." หรือเลขทะเบียนใดๆ (กฎ regulatory)
- ห้ามอ้างการรักษาหรือรับประกันชีวิต (medical claim restriction)
- ห้ามใช้ตัวเลข % การรอดชีวิตที่จำเพาะเจาะจง
- accent ควรเป็นคำหลักที่อยากเน้น (เช่น "AED Yuwell Y2" หรือ "จอ EKG")
- rationale อธิบายสั้นๆ ว่าทำไม headline นี้น่าจะดึง engagement มากกว่า variant ที่แพ้`;

export type ProposedHeadline = {
  line1: string;
  accent: string;
  line2: string;
  rationale: string;
};

export async function proposeNewHeadline(args: {
  ab: HeadlineAbState;
  current_loser: { line1: string; accent: string; line2: string };
  current_winner: { line1: string; accent: string; line2: string };
}): Promise<ProposedHeadline> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const anthropic = new Anthropic({ apiKey });

  const fmt = (h: { line1: string; accent: string; line2: string }) =>
    `${h.line1} | ${h.accent} | ${h.line2}`;

  const prompt = [
    `A/B test hero headline บนเว็บ JiaAED:`,
    ``,
    `Variant A: "${args.ab.loser === "a" ? fmt(args.current_loser) : fmt(args.current_winner)}"`,
    `  → views ${args.ab.a_views} / clicks ${args.ab.a_clicks} / CTR ${args.ab.a_ctr}%`,
    ``,
    `Variant B: "${args.ab.loser === "b" ? fmt(args.current_loser) : fmt(args.current_winner)}"`,
    `  → views ${args.ab.b_views} / clicks ${args.ab.b_clicks} / CTR ${args.ab.b_ctr}%`,
    ``,
    `Loser คือ variant ${args.ab.loser.toUpperCase()}`,
    ``,
    `ช่วยเขียน headline ใหม่ 1 ตัว มาแทน loser โดยพยายามเอาชนะ winner (CTR ${args.ab.winner_ctr}%)`,
    `ห้ามใช้สำนวนซ้ำกับ winner หรือ loser`,
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

  let parsed: ProposedHeadline;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text) as ProposedHeadline;
  } catch {
    throw new Error(`AI returned invalid JSON: ${text.slice(0, 200)}`);
  }

  for (const k of ["line1", "accent", "line2"] as const) {
    const v = parsed[k];
    if (!v || typeof v !== "string") throw new Error(`missing ${k}`);
    if (/อย\.|ฆพ\.|ทะเบียน|รับประกันชีวิต|รักษา/.test(v)) {
      throw new Error(`field ${k} violates regulatory rules: "${v}"`);
    }
  }
  const total = parsed.line1.length + parsed.accent.length + parsed.line2.length;
  if (total < 20 || total > 120) {
    throw new Error(`headline length out of range (${total})`);
  }
  return parsed;
}

const VARIANT_BLOCK_RE = (variant: "a" | "b") =>
  new RegExp(
    `(\\s${variant}:\\s*\\{\\s*line1:\\s*)"([^"]+)"(,\\s*accent:\\s*)"([^"]+)"(,\\s*line2:\\s*)"([^"]+)"`,
  );

export function extractHeadline(file: string, variant: "a" | "b"): {
  line1: string;
  accent: string;
  line2: string;
} {
  const m = file.match(VARIANT_BLOCK_RE(variant));
  if (!m) throw new Error(`Cannot find ${variant} variant in HeroHeadline.tsx`);
  return { line1: m[2], accent: m[4], line2: m[6] };
}

export function buildNewHeroHeadlineFile(
  current: string,
  args: { loser: "a" | "b"; newHeadline: ProposedHeadline },
): string {
  const re = VARIANT_BLOCK_RE(args.loser);
  if (!re.test(current)) {
    throw new Error(`Cannot find ${args.loser} block in HeroHeadline.tsx`);
  }
  return current.replace(
    re,
    (_, p1, _old1, p3, _old2, p5) =>
      `${p1}${JSON.stringify(args.newHeadline.line1)}${p3}${JSON.stringify(args.newHeadline.accent)}${p5}${JSON.stringify(args.newHeadline.line2)}`,
  );
}
