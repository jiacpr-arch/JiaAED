import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

const BKK_TZ = "Asia/Bangkok";

function bkkRange(daysBack: number): { from: string; to: string; label: string } {
  const now = Date.now();
  const fromMs = now - daysBack * 24 * 60 * 60 * 1000;
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: BKK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const fromLabel = fmt.format(new Date(fromMs));
  const toLabel = fmt.format(new Date(now - 24 * 60 * 60 * 1000));
  return {
    from: new Date(`${fromLabel}T00:00:00+07:00`).toISOString(),
    to: new Date(`${toLabel}T23:59:59.999+07:00`).toISOString(),
    label: `${fromLabel} – ${toLabel}`,
  };
}

export type WeeklyContext = {
  range_label: string;
  visits: number;
  visits_prev: number;
  events: Record<string, number>;
  events_prev: Record<string, number>;
  // Same events split by landing page. The home page (/) and the ads landing
  // page (/aed/*) carry DIFFERENT instrumentation, so global event totals are
  // apples-to-oranges — segmenting them stops false "surge"/"drop" alarms.
  events_by_page: { home: Record<string, number>; ads_landing: Record<string, number>; other: Record<string, number> };
  top_pages: Array<{ path: string; n: number }>;
  top_doc_downloads: Array<{ doc_id: string; n: number }>;
  top_line_locations: Array<{ location: string; n: number }>;
  // Did LINE clicks actually become chats? line_click counts INTENT (a button
  // tap), not a real conversation. Without the chat/message counts a review reads
  // a high click number as success when most clicks may never land in the OA —
  // the single biggest blind spot in past reviews.
  line_outcome: { clicks: number; chats: number; messages: number };
  ad_attribution: { gclid_visits: number; utm_visits: number; organic_visits: number };
  ab_test: {
    a_views: number;
    a_clicks: number;
    a_ctr: number;
    b_views: number;
    b_clicks: number;
    b_ctr: number;
  };
  leads: { total: number; from_gclid: number; from_organic: number };
};

type EventRow = {
  event_name: string;
  properties: Record<string, unknown> | null;
  page_url: string | null;
};

function countBy<T extends string>(rows: EventRow[], key: (r: EventRow) => T | null, top = 5) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([k, n]) => ({ key: k, n }));
}

function pathFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).pathname;
  } catch {
    return null;
  }
}

function pageBucket(url: string | null): "home" | "ads_landing" | "other" {
  const p = pathFromUrl(url);
  if (!p) return "other";
  if (p === "/") return "home";
  if (p.startsWith("/aed/")) return "ads_landing";
  return "other";
}

export async function buildWeeklyContext(): Promise<WeeklyContext> {
  const week = bkkRange(7);
  const prevWeek = bkkRange(14);
  prevWeek.to = week.from; // last 7-14d window

  const supabase = createAdminClient();

  const [thisWeek, lastWeek, visitsThis, visitsPrev, leads, chats, messages] = await Promise.all([
    supabase
      .from("aed_analytics_events")
      .select("event_name, properties, page_url")
      .gte("created_at", week.from)
      .lte("created_at", week.to),
    supabase
      .from("aed_analytics_events")
      .select("event_name")
      .gte("created_at", prevWeek.from)
      .lt("created_at", week.from),
    supabase
      .from("aed_ad_visits")
      .select("gclid, utm_source", { count: "exact" })
      .gte("created_at", week.from)
      .lte("created_at", week.to),
    supabase
      .from("aed_ad_visits")
      .select("*", { count: "exact", head: true })
      .gte("created_at", prevWeek.from)
      .lt("created_at", week.from),
    supabase
      .from("aed_leads")
      .select("gclid, utm_source")
      .gte("created_at", week.from)
      .lte("created_at", week.to),
    supabase
      .from("aed_conversations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", week.from)
      .lte("created_at", week.to),
    supabase
      .from("aed_messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", week.from)
      .lte("created_at", week.to),
  ]);

  const rows = (thisWeek.data ?? []) as EventRow[];
  const prevRows = (lastWeek.data ?? []) as EventRow[];

  const events: Record<string, number> = {};
  for (const r of rows) events[r.event_name] = (events[r.event_name] ?? 0) + 1;
  const events_prev: Record<string, number> = {};
  for (const r of prevRows) events_prev[r.event_name] = (events_prev[r.event_name] ?? 0) + 1;

  const events_by_page: WeeklyContext["events_by_page"] = { home: {}, ads_landing: {}, other: {} };
  for (const r of rows) {
    const bucket = events_by_page[pageBucket(r.page_url)];
    bucket[r.event_name] = (bucket[r.event_name] ?? 0) + 1;
  }

  const heroViews = rows.filter((r) => r.event_name === "hero_cta_view");
  const lineClicks = rows.filter((r) => r.event_name === "line_click");
  const a_views = heroViews.filter((r) => (r.properties?.variant as string) === "a").length;
  const b_views = heroViews.filter((r) => (r.properties?.variant as string) === "b").length;
  const a_clicks = lineClicks.filter(
    (r) => (r.properties?.hero_variant as string) === "a" && (r.properties?.location as string) === "hero",
  ).length;
  const b_clicks = lineClicks.filter(
    (r) => (r.properties?.hero_variant as string) === "b" && (r.properties?.location as string) === "hero",
  ).length;

  const top_pages = countBy(rows, (r) => pathFromUrl(r.page_url)).map(({ key, n }) => ({ path: key, n }));
  const top_doc_downloads = countBy(
    rows.filter((r) => r.event_name === "doc_download"),
    (r) => (r.properties?.doc_id as string) ?? null,
  ).map(({ key, n }) => ({ doc_id: key, n }));
  const top_line_locations = countBy(lineClicks, (r) => (r.properties?.location as string) ?? null).map(
    ({ key, n }) => ({ location: key, n }),
  );

  const visitsRows = (visitsThis.data ?? []) as Array<{ gclid: string | null; utm_source: string | null }>;
  const gclid_visits = visitsRows.filter((v) => !!v.gclid).length;
  const utm_visits = visitsRows.filter((v) => !v.gclid && !!v.utm_source).length;
  const organic_visits = (visitsThis.count ?? 0) - gclid_visits - utm_visits;

  const leadRows = (leads.data ?? []) as Array<{ gclid: string | null; utm_source: string | null }>;

  return {
    range_label: week.label,
    visits: visitsThis.count ?? 0,
    visits_prev: visitsPrev.count ?? 0,
    events,
    events_prev,
    events_by_page,
    top_pages,
    top_doc_downloads,
    top_line_locations,
    line_outcome: {
      clicks: lineClicks.length,
      chats: chats.count ?? 0,
      messages: messages.count ?? 0,
    },
    ad_attribution: { gclid_visits, utm_visits, organic_visits },
    ab_test: {
      a_views,
      a_clicks,
      a_ctr: a_views > 0 ? Math.round((a_clicks / a_views) * 1000) / 10 : 0,
      b_views,
      b_clicks,
      b_ctr: b_views > 0 ? Math.round((b_clicks / b_views) * 1000) / 10 : 0,
    },
    leads: {
      total: leadRows.length,
      from_gclid: leadRows.filter((l) => !!l.gclid).length,
      from_organic: leadRows.filter((l) => !l.gclid && !l.utm_source).length,
    },
  };
}

const SYSTEM_PROMPT = `คุณคือนักวิเคราะห์การตลาดดิจิทัลที่ช่วยร้าน JiaAED (ขาย AED Amoul i7) ดูข้อมูลรายสัปดาห์แล้วแนะนำ action items

กฏการตอบ:
- ภาษาไทยล้วน กระชับ ตัดสินใจได้ทันที
- ขึ้นต้นด้วย "🤖 สรุปสัปดาห์" + ช่วงวันที่
- ใส่ KPI หลัก 3-4 บรรทัด พร้อม trend (เพิ่ม/ลด %)
- จัด recommendation 3-5 ข้อ แยก priority ด้วย emoji 🔴 ด่วน / 🟡 กลาง / 🟢 รอได้
- แต่ละข้อมี: ปัญหา + เหตุผลจาก data + วิธีแก้ที่ทำได้เลย
- ห้ามใช้ markdown (LINE ไม่รองรับ) ใช้ emoji + ตัวเลข + เว้นบรรทัดแทน
- ความยาวรวมไม่เกิน 1500 ตัวอักษร (ขนาดของ LINE message)
- ถ้า data ยังน้อยเกินไป (visits < 50) ให้บอกตรงๆ ว่ายังประเมินไม่ได้ ต้องรอเก็บเพิ่ม

⚠️ สำคัญมาก — วิธีอ่าน event ให้ถูก (กันสรุปผิด):
- หน้าแรก (home, path "/") กับ หน้าโฆษณา (ads_landing, path "/aed/*") ฝัง event ไม่เหมือนกัน ห้ามเอายอดรวม (field "events") มาเทียบ % แล้วตีความตรงๆ ให้ดู "events_by_page" เพื่อเทียบแยกหน้า
- "hero_cta_view" ยิงเฉพาะหน้าแรกเท่านั้น หน้าโฆษณาไม่มี event นี้ → ถ้า traffic ย้ายไปหน้าโฆษณามากขึ้น ตัวเลขนี้จะลดเองโดยที่ปุ่มไม่ได้หาย/ไม่ได้พัง อย่าด่วนสรุปว่า CTA โดนซ่อนหรือให้ rollback
- "price_view" บนหน้าโฆษณายิงตั้งแต่โหลด เพราะราคาอยู่บนสุดของหน้า → ค่านี้เกือบเท่าจำนวนคนเข้าหน้าโฆษณา ไม่ใช่สัญญาณว่าสนใจราคาเป็นพิเศษ ส่วน price_view บนหน้าแรกต้องเลื่อนลงไปถึงจะยิง = เป็น signal ความสนใจจริง ให้ดูแยกหน้า
- เวลาเจอตัวเลขพุ่ง/ตกแรงๆ ให้เช็คก่อนว่าเป็นเพราะ "สัดส่วน traffic ระหว่างหน้าเปลี่ยน" หรือ "พฤติกรรมเปลี่ยนจริง" ก่อนเสนอ action

⚠️ LINE click ≠ LINE chat — อย่านับ "line_click" เป็นความสำเร็จ:
- "line_click" คือคนกดปุ่ม (intent) เท่านั้น ไม่ใช่คนทักจริง ให้เทียบกับ "line_outcome": clicks vs chats (= aed_conversations) และ messages ที่เข้ามาจริง
- ถ้า clicks สูงแต่ chats/messages ต่ำมาก (เช่น คลิก 100+ แต่แชทใหม่ 0-1) = funnel รั่ว คนกดแล้วไม่ทักจริง อย่าเชียร์ให้เพิ่มปุ่ม LINE — ให้ผลักคนไป lead form (ที่ track ได้) แทน และตรวจว่าจุดที่ถูกกดเป็น "ปุ่มจริง" หรือ "การกดโดยไม่ตั้งใจ"
- ดู "top_line_locations": ถ้า location ที่ครองยอดคลิกไม่ใช่ปุ่ม CTA โดยตรง (เช่น "ads_product" = รูปสินค้า) ส่วนใหญ่คือคนแตะรูปเพื่อดูสินค้า ไม่ใช่ตั้งใจแชท — อย่าตีความว่า "คนอยากคุย LINE เยอะ"`;

export async function generateWeeklyReview(ctx: WeeklyContext): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const anthropic = new Anthropic({ apiKey });

  const userPayload = JSON.stringify(ctx, null, 2);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `นี่คือข้อมูลของเว็บ jiaaed.com 7 วันที่ผ่านมา (เทียบกับ 7 วันก่อนหน้า):\n\n${userPayload}\n\nช่วยวิเคราะห์ + แนะนำ action items ให้เจ้าของหน่อยครับ`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return text || "🤖 ยังไม่มี insight สำหรับสัปดาห์นี้";
}
