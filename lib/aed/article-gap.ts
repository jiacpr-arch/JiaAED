import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { articles } from "@/lib/aed/articles";
import { WEB_CHAT_CHANNEL } from "@/lib/aed/web-chat-log";

const MIN_QUESTIONS = 15;
const LOOKBACK_DAYS = 14;

export type QuestionSample = {
  total_messages: number;
  sample: string[];
  existing_titles: string[];
};

export async function readRecentChatQuestions(): Promise<QuestionSample> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Read what visitors actually typed from the server-written web chat
  // transcript (lib/aed/web-chat-log.ts), not from aed_analytics_events — that
  // table is filled by the public, unauthenticated /api/aed/event endpoint, so
  // anyone could have planted "questions" there to steer the article writer.
  const { data } = await supabase
    .from("aed_messages")
    .select("content_text, created_at, aed_conversations!inner(channel)")
    .eq("aed_conversations.channel", WEB_CHAT_CHANNEL)
    .eq("direction", "inbound")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(300);

  const messages: string[] = [];
  for (const row of data ?? []) {
    const text = (row as { content_text: string | null }).content_text?.trim();
    if (text && text.length > 4 && text.length < 400) messages.push(text);
  }

  return {
    total_messages: data?.length ?? 0,
    sample: messages.slice(0, 80),
    existing_titles: articles.map((a) => a.title),
  };
}

export function hasEnoughSignal(sample: QuestionSample): boolean {
  return sample.sample.length >= MIN_QUESTIONS;
}

const SYSTEM_PROMPT = `คุณคือบรรณาธิการเนื้อหาสำหรับร้าน JiaAED (ขาย AED Yuwell Y2 / PRIMEDIC HeartSave — เครื่องกระตุกหัวใจไฟฟ้า)

หน้าที่: วิเคราะห์คำถามที่ลูกค้าถามในแชทเว็บ และเขียนบทความใหม่ 1 บทความปิดช่องว่างความรู้ที่ยังไม่มีในบทความเดิม

ข้อกำหนด strict:
- ตอบเป็น JSON เท่านั้น ไม่มี markdown code fence
- format: {"slug": "...", "title": "...", "description": "...", "read_minutes": 4, "tags": ["..."], "content": "..."}
- slug: lowercase kebab-case ภาษาอังกฤษ 3-6 คำ
- title: ภาษาไทย ≤ 60 ตัวอักษร
- description: ภาษาไทย 80-160 ตัวอักษร สรุปประโยชน์ของบทความ
- read_minutes: int 3-7
- tags: 2-4 tags ภาษาไทย
- content: markdown เบา ๆ — ## headings, paragraphs, - bullets, [link](path) เท่านั้น (ห้าม HTML, ห้าม code fence)
- ห้ามใช้คำว่า "อย." "ฆพ." หรือเลขทะเบียนใด ๆ (กฎ regulatory)
- ห้ามอ้างการรักษาหรือรับประกันชีวิต (medical claim restriction)
- ห้ามตั้ง title ซ้ำกับบทความเดิม
- บทความ ≥ 400 คำ ≤ 900 คำ
- ภาษาธรรมชาติ ไม่ตลาดจัด`;

export type ProposedArticle = {
  slug: string;
  title: string;
  description: string;
  read_minutes: number;
  tags: string[];
  content: string;
};

export async function proposeArticle(sample: QuestionSample): Promise<ProposedArticle> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const anthropic = new Anthropic({ apiKey, timeout: 180_000, maxRetries: 1 });

  const prompt = [
    `บทความที่มีแล้วในเว็บ (ห้ามเขียนซ้ำหัวข้อเดียวกัน):`,
    ...sample.existing_titles.map((t) => `- ${t}`),
    ``,
    `คำถามจริงจาก web chat (${sample.sample.length} คำถาม จาก ${sample.total_messages} ข้อความใน ${LOOKBACK_DAYS} วันล่าสุด):`,
    ...sample.sample.map((q) => `- ${q}`),
    ``,
    `ขั้นตอน:`,
    `1) หา theme/หัวข้อที่ลูกค้าถามบ่อยและบทความเดิมยังไม่ตอบ`,
    `2) เลือก 1 หัวข้อที่น่าจะลด workload การตอบแชทมากที่สุด`,
    `3) เขียนบทความเต็มเป็น JSON ตาม format ที่กำหนด`,
  ].join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < 0) throw new Error(`no JSON in model output: ${text.slice(0, 200)}`);

  const parsed = validateProposedArticle(JSON.parse(text.slice(jsonStart, jsonEnd + 1)));

  if (articles.some((a) => a.slug === parsed.slug)) {
    throw new Error(`slug collision: ${parsed.slug}`);
  }
  if (articles.some((a) => a.title === parsed.title)) {
    throw new Error(`title collision: ${parsed.title}`);
  }

  return parsed;
}

// The proposal is model output steered by visitor-typed chat text, and it gets
// spliced into lib/aed/articles.ts, which the next build executes. Treat every
// field as untrusted: exact types, tight shapes, and nothing that could escape
// its string literal (read_minutes in particular lands in the source unquoted).
export function validateProposedArticle(raw: unknown): ProposedArticle {
  const fail = (why: string): never => {
    throw new Error(`invalid proposal (${why}): ${JSON.stringify(raw).slice(0, 200)}`);
  };
  if (!raw || typeof raw !== "object") fail("not an object");
  const r = raw as Record<string, unknown>;

  const str = (key: string, min: number, max: number): string => {
    const v = r[key];
    if (typeof v !== "string") return fail(`${key} not a string`);
    const t = v.trim();
    if (t.length < min || t.length > max) return fail(`${key} length ${t.length}`);
    return t;
  };

  const slug = str("slug", 3, 80);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+){1,9}$/.test(slug)) fail("slug format");

  const readMinutes = r.read_minutes;
  if (typeof readMinutes !== "number" || !Number.isInteger(readMinutes) || readMinutes < 1 || readMinutes > 20) {
    fail("read_minutes");
  }

  const tags = r.tags;
  if (
    !Array.isArray(tags) ||
    tags.length < 1 ||
    tags.length > 6 ||
    !tags.every((t) => typeof t === "string" && t.trim().length > 0 && t.length <= 40)
  ) {
    fail("tags");
  }

  return {
    slug,
    title: str("title", 4, 120),
    description: str("description", 20, 300),
    read_minutes: readMinutes as number,
    tags: (tags as string[]).map((t) => t.trim()),
    content: str("content", 200, 20_000),
  };
}

const ARRAY_CLOSE_MARKER = "\n];\n\nexport function findArticle";

export function insertArticleIntoSource(source: string, proposal: ProposedArticle): string {
  const a = validateProposedArticle(proposal);
  if (!source.includes(ARRAY_CLOSE_MARKER)) {
    throw new Error("articles.ts marker not found — file structure changed");
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const escapedContent = a.content.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  const tagsLiteral = JSON.stringify(a.tags);

  const entry = [
    `  {`,
    `    slug: ${JSON.stringify(a.slug)},`,
    `    title: ${JSON.stringify(a.title)},`,
    `    description: ${JSON.stringify(a.description)},`,
    `    publishedAt: ${JSON.stringify(today)},`,
    `    readMinutes: ${JSON.stringify(a.read_minutes)},`,
    `    tags: ${tagsLiteral},`,
    `    content: \`${escapedContent}\`,`,
    `  },`,
  ].join("\n");

  return source.replace(ARRAY_CLOSE_MARKER, `\n${entry}${ARRAY_CLOSE_MARKER}`);
}
