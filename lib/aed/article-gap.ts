import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { articles } from "@/lib/aed/articles";

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

  const { data } = await supabase
    .from("aed_analytics_events")
    .select("properties, created_at")
    .eq("event_name", "web_chat_message_sent")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(300);

  const messages: string[] = [];
  for (const row of data ?? []) {
    const text =
      ((row.properties as Record<string, unknown> | null)?.text as string) ||
      ((row.properties as Record<string, unknown> | null)?.content as string) ||
      null;
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

  const anthropic = new Anthropic({ apiKey });

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
    model: "claude-sonnet-4-5",
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

  const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as ProposedArticle;

  if (!parsed.slug || !parsed.title || !parsed.content) {
    throw new Error(`missing fields in proposal: ${JSON.stringify(parsed).slice(0, 200)}`);
  }
  if (articles.some((a) => a.slug === parsed.slug)) {
    throw new Error(`slug collision: ${parsed.slug}`);
  }
  if (articles.some((a) => a.title === parsed.title)) {
    throw new Error(`title collision: ${parsed.title}`);
  }

  return parsed;
}

const ARRAY_CLOSE_MARKER = "\n];\n\nexport function findArticle";

export function insertArticleIntoSource(source: string, a: ProposedArticle): string {
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
    `    readMinutes: ${a.read_minutes},`,
    `    tags: ${tagsLiteral},`,
    `    content: \`${escapedContent}\`,`,
    `  },`,
  ].join("\n");

  return source.replace(ARRAY_CLOSE_MARKER, `\n${entry}${ARRAY_CLOSE_MARKER}`);
}
