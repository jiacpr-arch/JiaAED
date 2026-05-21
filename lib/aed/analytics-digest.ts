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
  };
  rates: {
    price_view_rate: number;
    form_start_rate: number;
    form_completion_rate: number;
    form_abandon_rate: number;
    line_ctr: number;
    visit_to_submit_rate: number;
  };
  ab: {
    variant_a_views: number;
    variant_a_clicks: number;
    variant_b_views: number;
    variant_b_clicks: number;
    ctr_a: number;
    ctr_b: number;
  };
  alerts: string[];
};

type EventRow = {
  event_name: string;
  properties: Record<string, unknown> | null;
  gclid: string | null;
  page_url: string | null;
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
    .select("event_name, properties, gclid, page_url")
    .gte("created_at", from)
    .lte("created_at", to);
  if (error) throw new Error(`fetch events failed: ${error.message}`);
  return (data ?? []) as EventRow[];
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

  const [rows, prev, visits, prev_visits] = await Promise.all([
    fetchRows(yesterday.from, yesterday.to),
    fetchRows(dayBefore.from, dayBefore.to),
    fetchVisitsCount(yesterday.from, yesterday.to),
    fetchVisitsCount(dayBefore.from, dayBefore.to),
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
  };

  const rates = {
    price_view_rate: pct(funnel.price_views, funnel.visits),
    form_start_rate: pct(funnel.form_starts, funnel.visits),
    form_completion_rate: pct(funnel.form_submits, funnel.form_starts),
    form_abandon_rate: pct(funnel.form_abandons, funnel.form_starts),
    line_ctr: pct(funnel.line_clicks, funnel.visits),
    visit_to_submit_rate: pct(funnel.form_submits, funnel.visits),
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
  if (funnel.visits >= 30) {
    if (rates.line_ctr < 5 && (prev_counts["line_click"] || 0) > 0) {
      alerts.push(`⚠️ LINE CTR ต่ำผิดปกติ (${rates.line_ctr}% — ปกติ > 5%) ตรวจสอบปุ่ม`);
    }
    if (rates.price_view_rate < 25) {
      alerts.push(`⚠️ คนเข้าเว็บไม่ค่อย scroll ถึงราคา (${rates.price_view_rate}%) ลองดัน CTA ขึ้น`);
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

  return {
    date: yesterday.label,
    range: { from: yesterday.from, to: yesterday.to },
    counts,
    prev_counts,
    prev_visits,
    funnel,
    rates,
    ab,
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

  if (d.alerts.length > 0) {
    lines.push(``, `🚨 Alerts:`);
    for (const a of d.alerts) lines.push(`  ${a}`);
  }

  return lines.join("\n");
}
