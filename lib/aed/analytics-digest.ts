import { createAdminClient } from "@/lib/supabase/admin";

const BKK_TZ = "Asia/Bangkok";

export type DigestCounts = Record<string, number>;

export type DigestPayload = {
  date: string;
  range: { from: string; to: string };
  counts: DigestCounts;
  prev_counts: DigestCounts;
  prev_visits: number;
  funnel: {
    visits: number;
    price_views: number;
    form_starts: number;
    form_submits: number;
    form_abandons: number;
    line_clicks: number;
    engaged: number;
  };
  rates: {
    price_view_rate: number;
    form_start_rate: number;
    form_completion_rate: number;
    form_abandon_rate: number;
    line_ctr: number;
    visit_to_submit_rate: number;
    engagement_rate: number;
    bounce_rate: number;
  };
  ab: {
    variant_a_views: number;
    variant_a_clicks: number;
    variant_b_views: number;
    variant_b_clicks: number;
    ctr_a: number;
    ctr_b: number;
  };
  by_source: Array<{
    source: string;
    line_clicks: number;
    form_submits: number;
    hot_leads: number;
  }>;
  form_field_drop: Array<{ field: string; focuses: number }>;
  hot_leads: number;
  news: Array<{ topic: string; blurb: string }>;
  alerts: string[];
};

type EventRow = {
  event_name: string;
  properties: Record<string, unknown> | null;
  gclid: string | null;
  page_url: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
};

function bkkDateRange(daysAgo: number): { from: string; to: string; label: string } {
  const now = new Date();
  const target = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: BKK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = fmt.format(target);

  const from = new Date(`${dateStr}T00:00:00+07:00`).toISOString();
  const to = new Date(`${dateStr}T23:59:59.999+07:00`).toISOString();

  return { from, to, label: dateStr };
}

function countByEvent(rows: EventRow[]): DigestCounts {
  const out: DigestCounts = {};
  for (const r of rows) out[r.event_name] = (out[r.event_name] || 0) + 1;
  return out;
}

function pct(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.round((n / d) * 1000) / 10;
}

function diffPct(curr: number, prev: number): string {
  if (prev === 0) return curr === 0 ? "0%" : "(ใหม่)";
  const d = ((curr - prev) / prev) * 100;
  const sign = d >= 0 ? "+" : "";
  return `${sign}${d.toFixed(0)}%`;
}

async function fetchRows(from: string, to: string): Promise<EventRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("aed_analytics_events")
    .select("event_name, properties, gclid, page_url, utm_source, utm_campaign")
    .gte("created_at", from)
    .lte("created_at", to);
  if (error) throw new Error(`fetch events failed: ${error.message}`);
  return (data ?? []) as EventRow[];
}

function buildBySource(rows: EventRow[]): DigestPayload["by_source"] {
  const map = new Map<string, { line_clicks: number; form_submits: number; hot_leads: number }>();
  for (const r of rows) {
    const src = r.utm_source || "direct";
    if (
      r.event_name !== "line_click" &&
      r.event_name !== "lead_form_submit" &&
      r.event_name !== "hot_lead_alert_fired"
    ) continue;
    const cur = map.get(src) ?? { line_clicks: 0, form_submits: 0, hot_leads: 0 };
    if (r.event_name === "line_click") cur.line_clicks++;
    if (r.event_name === "lead_form_submit") cur.form_submits++;
    if (r.event_name === "hot_lead_alert_fired") cur.hot_leads++;
    map.set(src, cur);
  }
  return [...map.entries()]
    .map(([source, v]) => ({ source, ...v }))
    .sort((a, b) => b.form_submits - a.form_submits || b.line_clicks - a.line_clicks);
}

function buildFieldDrop(rows: EventRow[]): DigestPayload["form_field_drop"] {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.event_name !== "lead_form_field_focus") continue;
    const field = (r.properties?.field as string) || "unknown";
    map.set(field, (map.get(field) || 0) + 1);
  }
  return [...map.entries()]
    .map(([field, focuses]) => ({ field, focuses }))
    .sort((a, b) => b.focuses - a.focuses);
}

// News is published by the news-feed cron (~08:00 BKK) shortly before this
// digest runs (~09:00 BKK), so "today" reliably captures the morning batch.
// Folding it in here means the owner gets one daily message instead of two.
async function fetchTodayNews(): Promise<DigestPayload["news"]> {
  const supabase = createAdminClient();
  const today = bkkDateRange(0);
  const { data, error } = await supabase
    .from("aed_news_items")
    .select("topic, our_blurb")
    .eq("hidden", false)
    .gte("created_at", today.from)
    .lte("created_at", today.to)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[digest] news fetch failed:", error);
    return [];
  }
  return (data ?? []).map((r) => ({
    topic: (r.topic as string | null)?.trim() || "ข่าว",
    blurb: (r.our_blurb as string) ?? "",
  }));
}

async function fetchVisitsCount(from: string, to: string): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("aed_ad_visits")
    .select("*", { count: "exact", head: true })
    .gte("created_at", from)
    .lte("created_at", to);
  if (error) {
    console.error("[digest] visits count failed:", error);
    return 0;
  }
  return count ?? 0;
}

export async function buildDailyDigest(): Promise<DigestPayload> {
  const yesterday = bkkDateRange(1);
  const dayBefore = bkkDateRange(2);

  const [rows, prev, visits, prev_visits, news] = await Promise.all([
    fetchRows(yesterday.from, yesterday.to),
    fetchRows(dayBefore.from, dayBefore.to),
    fetchVisitsCount(yesterday.from, yesterday.to),
    fetchVisitsCount(dayBefore.from, dayBefore.to),
    fetchTodayNews(),
  ]);

  const counts = countByEvent(rows);
  const prev_counts = countByEvent(prev);

  const heroViews = rows.filter((r) => r.event_name === "hero_cta_view");
  const lineClicks = rows.filter((r) => r.event_name === "line_click");

  const variant_a_views = heroViews.filter((r) => (r.properties?.variant as string) === "a").length;
  const variant_b_views = heroViews.filter((r) => (r.properties?.variant as string) === "b").length;
  const variant_a_clicks = lineClicks.filter(
    (r) => (r.properties?.hero_variant as string) === "a" && (r.properties?.location as string) === "hero",
  ).length;
  const variant_b_clicks = lineClicks.filter(
    (r) => (r.properties?.hero_variant as string) === "b" && (r.properties?.location as string) === "hero",
  ).length;

  const funnel = {
    visits,
    price_views: counts["price_view"] || 0,
    form_starts: counts["lead_form_start"] || 0,
    form_submits: counts["lead_form_submit"] || 0,
    form_abandons: counts["lead_form_abandon"] || 0,
    line_clicks: counts["line_click"] || 0,
    engaged: counts["engaged_session"] || 0,
  };

  const engagement_rate = pct(funnel.engaged, funnel.visits);
  const rates = {
    price_view_rate: pct(funnel.price_views, funnel.visits),
    form_start_rate: pct(funnel.form_starts, funnel.visits),
    form_completion_rate: pct(funnel.form_submits, funnel.form_starts),
    form_abandon_rate: pct(funnel.form_abandons, funnel.form_starts),
    line_ctr: pct(funnel.line_clicks, funnel.visits),
    visit_to_submit_rate: pct(funnel.form_submits, funnel.visits),
    engagement_rate,
    bounce_rate: funnel.visits > 0 ? Math.round((100 - engagement_rate) * 10) / 10 : 0,
  };

  const ab = {
    variant_a_views,
    variant_a_clicks,
    variant_b_views,
    variant_b_clicks,
    ctr_a: pct(variant_a_clicks, variant_a_views),
    ctr_b: pct(variant_b_clicks, variant_b_views),
  };

  const alerts: string[] = [];
  const totalEvents = funnel.line_clicks + funnel.price_views + funnel.form_starts;

  if (funnel.visits === 0) {
    alerts.push(`🚨 ไม่มี visitor เลย — ตรวจ ad / tracking ว่ายังยิงอยู่`);
  } else if (funnel.visits >= 10 && totalEvents === 0) {
    alerts.push(`🐛 มี visitor ${funnel.visits} แต่ไม่มี event เลย — น่าจะ tracking พัง`);
  } else if (funnel.visits >= 10) {
    if (rates.line_ctr < 5 && (prev_counts["line_click"] || 0) > 0) {
      alerts.push(`⚠️ LINE CTR ต่ำผิดปกติ (${rates.line_ctr}% — ปกติ > 5%) ตรวจสอบปุ่ม`);
    }
    if (funnel.price_views >= 5 && rates.price_view_rate < 15) {
      alerts.push(`⚠️ คนเข้าเว็บไม่ค่อย scroll ถึงราคา (${rates.price_view_rate}%) ลองดัน CTA ขึ้น`);
    }
    if (funnel.visits >= 20 && rates.bounce_rate >= 70) {
      alerts.push(`⚠️ Bounce rate สูง ${rates.bounce_rate}% (engaged ${funnel.engaged}/${funnel.visits}) — hero copy/รูปอาจไม่ดึง`);
    }
    if (funnel.form_starts > 5 && rates.form_abandon_rate > 60) {
      alerts.push(
        `⚠️ คนทิ้งฟอร์ม ${rates.form_abandon_rate}% (เริ่ม ${funnel.form_starts} ส่งจริง ${funnel.form_submits}) — ฟอร์มอาจยากเกินไป`,
      );
    }
  }

  const prevLine = prev_counts["line_click"] || 0;
  if (prevLine >= 10 && funnel.line_clicks < prevLine * 0.5) {
    alerts.push(`📉 LINE clicks ลดลง ${diffPct(funnel.line_clicks, prevLine)} เทียบเมื่อวานก่อน`);
  }

  if (funnel.form_submits === 0 && funnel.visits >= 50) {
    alerts.push(`🚨 มีคนเข้าเว็บ ${funnel.visits} คน แต่ไม่มีใครส่งฟอร์มเลย`);
  }

  if (ab.variant_a_views >= 50 && ab.variant_b_views >= 50) {
    const winner = ab.ctr_b > ab.ctr_a ? "B" : "A";
    const margin = Math.abs(ab.ctr_b - ab.ctr_a);
    if (margin >= 1) {
      alerts.push(`🧪 A/B test: variant ${winner} ชนะ (CTR ห่าง ${margin.toFixed(1)}pp) — พิจารณาปิด test`);
    }
  }

  const by_source = buildBySource(rows);
  const form_field_drop = buildFieldDrop(rows);
  const hot_leads = counts["hot_lead_alert_fired"] || 0;

  return {
    date: yesterday.label,
    range: { from: yesterday.from, to: yesterday.to },
    counts,
    prev_counts,
    prev_visits,
    funnel,
    rates,
    ab,
    by_source,
    form_field_drop,
    hot_leads,
    news,
    alerts,
  };
}

export function formatDigestForLine(d: DigestPayload): string {
  const prevLineClicks = d.prev_counts["line_click"] || 0;
  const prevFormSubmits = d.prev_counts["lead_form_submit"] || 0;
  const hasFormActivity = d.funnel.form_starts > 0 || d.funnel.form_submits > 0;
  const conversionDisplay = d.funnel.visits > 0 ? `${d.rates.visit_to_submit_rate}%` : "—";

  const lines: string[] = [
    `📊 สรุปประจำวัน ${d.date}`,
    ``,
    `👥 Visitors: ${d.funnel.visits} ${diffPct(d.funnel.visits, d.prev_visits)}`,
    `🪤 Bounce: ${d.rates.bounce_rate}% (engaged ${d.funnel.engaged})`,
    `💬 LINE clicks: ${d.funnel.line_clicks} (${d.rates.line_ctr}%) ${diffPct(d.funnel.line_clicks, prevLineClicks)}`,
  ];

  if (hasFormActivity) {
    lines.push(
      `📋 Form: เริ่ม ${d.funnel.form_starts} → ส่ง ${d.funnel.form_submits} (ทิ้ง ${d.funnel.form_abandons}) ${diffPct(d.funnel.form_submits, prevFormSubmits)}`,
      `💰 Conversion (ส่งฟอร์ม/visitor): ${conversionDisplay}`,
    );
  } else {
    lines.push(`💰 Conversion (ส่งฟอร์ม/visitor): —`);
  }

  const prevHotLeads = d.prev_counts["hot_lead_alert_fired"] || 0;
  if (d.hot_leads > 0 || prevHotLeads > 0) {
    lines.push(`🔥 Hot leads: ${d.hot_leads} ${diffPct(d.hot_leads, prevHotLeads)}`);
  }

  if (d.funnel.price_views > 0) {
    lines.push(`👁️  เห็นราคา: ${d.funnel.price_views} (${d.rates.price_view_rate}% ของ visitor)`);
  }

  if (d.ab.variant_a_views + d.ab.variant_b_views > 0) {
    lines.push(
      ``,
      `🧪 A/B Hero:`,
      `  A: ${d.ab.variant_a_clicks}/${d.ab.variant_a_views} (${d.ab.ctr_a}%)`,
      `  B: ${d.ab.variant_b_clicks}/${d.ab.variant_b_views} (${d.ab.ctr_b}%)`,
    );
  }

  if (d.by_source.length > 0) {
    lines.push(``, `📡 By source (top 4):`);
    for (const s of d.by_source.slice(0, 4)) {
      lines.push(`  ${s.source}: 💬${s.line_clicks} 📋${s.form_submits} 🔥${s.hot_leads}`);
    }
  }

  if (d.form_field_drop.length >= 2) {
    const top = d.form_field_drop[0];
    const last = d.form_field_drop[d.form_field_drop.length - 1];
    if (top.focuses >= 5 && last.focuses < top.focuses * 0.4) {
      lines.push(
        ``,
        `📉 Form drop: "${top.field}" ${top.focuses} → "${last.field}" ${last.focuses}`,
      );
    }
  }

  if (d.alerts.length > 0) {
    lines.push(``, `🚨 Alerts:`);
    for (const a of d.alerts) lines.push(`  ${a}`);
  }

  if (d.news.length > 0) {
    lines.push(``, `📰 ข่าวใหม่บนหน้าเว็บ ${d.news.length} ข่าว (เผยแพร่อัตโนมัติ)`);
    for (const n of d.news.slice(0, 3)) lines.push(`• ${n.topic}: ${n.blurb}`);
    lines.push(`ซ่อนได้ที่ /admin/news`);
  }

  return lines.join("\n");
}
