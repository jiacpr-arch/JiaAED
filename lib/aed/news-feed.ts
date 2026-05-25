import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Daily news feed for JiaAED.
 *
 * Flow: search Google News RSS for sudden-cardiac-arrest / CPR / AED themes
 * → drop items we already have → ask Claude to keep only genuinely relevant
 * items and write OUR OWN short awareness note for each → insert into Supabase.
 *
 * We never copy the publisher's article body or images. The public /news page
 * shows our note and links out to the original (copyright-safe), and Claude is
 * told not to exploit or judge named individuals (defamation-safe).
 */

export const NEWS_QUERIES = [
  "หัวใจหยุดเต้นเฉียบพลัน",
  "ปั๊มหัวใจ CPR ช่วยชีวิต",
  "เครื่อง AED กระตุกหัวใจ",
  "วูบหมดสติ หัวใจ ช่วยชีวิต",
  "นักกีฬา หัวใจวาย ล้มกลางสนาม",
  "วิ่งมาราธอน หมดสติ หัวใจหยุดเต้น",
  "ติดตั้งเครื่อง AED โรงเรียน สนามกีฬา",
  "ไหลตาย หัวใจหยุดเต้นเฉียบพลัน",
  "เออีดี กู้ชีพ ช่วยชีวิต",
  "หัวใจวายเฉียบพลัน เสียชีวิตกะทันหัน",
];

// Keep token use and publish volume sane.
const MAX_CANDIDATES = 50;
const MAX_INSERT_PER_RUN = 12;

const MODEL = "claude-sonnet-4-5";

export type RawNewsItem = {
  guid: string;
  title: string;
  url: string;
  source: string | null;
  publishedAt: string | null;
};

export type CuratedItem = RawNewsItem & {
  topic: string;
  blurb: string;
};

function decodeEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#0*39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&"); // decode &amp; last to avoid double-decoding
}

function pickTag(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(m[1]).trim() : null;
}

export function parseRss(xml: string): RawNewsItem[] {
  const items: RawNewsItem[] = [];
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  for (const block of blocks) {
    const rawTitle = pickTag(block, "title");
    const link = pickTag(block, "link");
    if (!rawTitle || !link) continue;

    const guid = pickTag(block, "guid") || link;
    let source = pickTag(block, "source");

    // Google News titles look like "Headline - Publisher"; strip the publisher.
    let title = rawTitle;
    const dashIdx = rawTitle.lastIndexOf(" - ");
    if (dashIdx > 0) {
      const tail = rawTitle.slice(dashIdx + 3).trim();
      if (!source) source = tail;
      if (source && tail === source) title = rawTitle.slice(0, dashIdx).trim();
    }

    let publishedAt: string | null = null;
    const pubDate = pickTag(block, "pubDate");
    if (pubDate) {
      const d = new Date(pubDate);
      if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString();
    }

    items.push({ guid, title, url: link, source, publishedAt });
  }

  return items;
}

export async function fetchGoogleNews(query: string): Promise<RawNewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    query,
  )}&hl=th&gl=TH&ceid=TH:th`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; JiaAEDNewsBot/1.0)" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`google news rss ${res.status} for "${query}"`);

  return parseRss(await res.text());
}

/** Fetch all queries, tolerating per-query failures, deduped by guid. */
export async function fetchAllCandidates(): Promise<RawNewsItem[]> {
  const settled = await Promise.allSettled(NEWS_QUERIES.map(fetchGoogleNews));

  const byGuid = new Map<string, RawNewsItem>();
  for (const r of settled) {
    if (r.status !== "fulfilled") {
      console.error("[news-feed] fetch failed:", r.reason);
      continue;
    }
    for (const item of r.value) {
      if (!byGuid.has(item.guid)) byGuid.set(item.guid, item);
    }
  }

  return [...byGuid.values()]
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, MAX_CANDIDATES);
}

/** Drop items already stored so we don't re-curate them. */
export async function filterNew(items: RawNewsItem[]): Promise<RawNewsItem[]> {
  if (items.length === 0) return [];
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("aed_news_items")
    .select("guid")
    .in(
      "guid",
      items.map((i) => i.guid),
    );
  const existing = new Set((data ?? []).map((r) => r.guid as string));
  return items.filter((i) => !existing.has(i.guid));
}

const SYSTEM_PROMPT = `คุณคือบรรณาธิการเนื้อหาให้ร้าน JiaAED (ขายเครื่อง AED Amoul i7 — เครื่องกระตุกหัวใจไฟฟ้าอัตโนมัติ)

งาน: ดูพาดหัวข่าวที่ดึงมาจาก Google News แล้ว
1) คัดเฉพาะข่าวที่ "เกี่ยวข้องจริง" กับหัวใจหยุดเต้นเฉียบพลัน / การกู้ชีพ / CPR / AED / ความปลอดภัยในที่สาธารณะ
2) สำหรับข่าวที่เลือก ให้เขียน "โน้ตให้ความรู้ของเราเอง" (blurb) — ไม่ใช่คัดลอกพาดหัว

กฎ strict (สำคัญมาก):
- ตอบเป็น JSON array เท่านั้น ห้ามมีข้อความอื่นนอก array
- ใส่เฉพาะข่าวที่ "เกี่ยวข้องจริง" เท่านั้น — ข่าวที่ไม่เกี่ยวข้อง ห้ามใส่ลงใน array (ไม่ต้องรายงาน)
- แต่ละ element: {"index": <int>, "topic": "<สั้นๆ ไทย>", "blurb": "<ไทย 1-2 ประโยค>"}
- index ต้องตรงกับเลขข่าวที่ให้ไป
- ตัดทิ้ง (ไม่ใส่ใน array) เมื่อ: เป็นข่าวการเมือง/ดราม่าล้วน, พาดหัวคลิกเบตหรือยังไม่ยืนยัน, หรือไม่เกี่ยวกับการกู้ชีพ/หัวใจหยุดเต้นจริง
- ถ้าไม่มั่นใจว่าข่าวจริงหรือไม่ ให้ตัดทิ้งไว้ก่อน
- blurb: เขียนเป็นมุมให้ความรู้/สร้างความตระหนัก ห้ามเอ่ยชื่อบุคคลในข่าวเพื่อหาประโยชน์ ห้ามใส่ร้ายหรือตัดสินอาการของใคร
- ห้ามอ้างการรักษาหรือรับประกันชีวิต (medical claim) ห้ามใช้คำว่า "อย." "ฆพ." หรือเลขทะเบียนใด ๆ
- โทนสุภาพ ให้ข้อมูล ไม่ขายตรงจนเกินไป`;

/**
 * Pull complete top-level JSON objects out of a model response.
 *
 * Tolerant of markdown code fences and, crucially, of truncation: if the
 * response is cut off mid-array (hit max_tokens), every object that *did*
 * finish is still recovered and the dangling partial one is dropped.
 */
function extractJsonObjects(text: string): Array<Record<string, unknown>> {
  const objects: Array<Record<string, unknown>> = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      if (depth > 0) {
        depth--;
        if (depth === 0 && start >= 0) {
          try {
            objects.push(JSON.parse(text.slice(start, i + 1)));
          } catch {
            // ignore a malformed object and keep scanning
          }
          start = -1;
        }
      }
    }
  }
  return objects;
}

export async function curate(items: RawNewsItem[]): Promise<CuratedItem[]> {
  if (items.length === 0) return [];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const anthropic = new Anthropic({ apiKey });

  const list = items
    .map(
      (it, i) =>
        `[${i}] "${it.title}" — ที่มา: ${it.source ?? "ไม่ทราบ"}${
          it.publishedAt ? ` (${it.publishedAt.slice(0, 10)})` : ""
        }`,
    )
    .join("\n");

  const prompt = [
    `พาดหัวข่าว ${items.length} ข่าว:`,
    list,
    ``,
    `คัดเฉพาะข่าวที่เกี่ยวข้องจริงและเขียน blurb ตามกฎ ส่งกลับเป็น JSON array (ใส่เฉพาะข่าวที่เกี่ยวข้อง)`,
  ].join("\n");

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const curated: CuratedItem[] = [];
  const seen = new Set<number>();
  for (const row of extractJsonObjects(text)) {
    if (row.relevant === false) continue;
    const index = typeof row.index === "number" ? row.index : Number(row.index);
    if (!Number.isInteger(index) || seen.has(index)) continue;
    const item = items[index];
    const blurb = typeof row.blurb === "string" ? row.blurb.trim() : "";
    if (!item || !blurb) continue;
    seen.add(index);
    const topic = typeof row.topic === "string" && row.topic.trim() ? row.topic.trim() : "การกู้ชีพ";
    curated.push({ ...item, topic, blurb });
  }

  return curated.slice(0, MAX_INSERT_PER_RUN);
}

/** Insert curated items; idempotent on guid. Returns number of new rows. */
export async function insertCurated(items: CuratedItem[]): Promise<number> {
  if (items.length === 0) return 0;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("aed_news_items")
    .upsert(
      items.map((i) => ({
        guid: i.guid,
        source_title: i.title,
        source_url: i.url,
        source_name: i.source,
        topic: i.topic,
        our_blurb: i.blurb,
        published_at: i.publishedAt,
      })),
      { onConflict: "guid", ignoreDuplicates: true },
    )
    .select("id");

  if (error) throw new Error(`insert news failed: ${error.message}`);
  return data?.length ?? 0;
}
