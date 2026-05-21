import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/aed/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EventRow = {
  event_name: string;
  properties: Record<string, unknown> | null;
  page_url: string | null;
  referrer: string | null;
  created_at: string;
};

type VisitRow = {
  gclid: string | null;
  utm_source: string | null;
  referrer: string | null;
  created_at: string;
};

type LeadRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  product_id: string | null;
  gclid: string | null;
  created_at: string;
};

type DigestLogRow = {
  digest_date: string;
  kind: string;
  payload: { alerts?: string[] } | null;
  created_at: string;
};

function pathFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).pathname || "/";
  } catch {
    return null;
  }
}

function hostFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const h = new URL(url).hostname;
    return h || null;
  } catch {
    return null;
  }
}

function topN<T extends string>(items: (T | null)[], n = 5) {
  const map = new Map<string, number>();
  for (const it of items) {
    if (!it) continue;
    map.set(it, (map.get(it) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ key: k, n: v }));
}

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function pct(num: number, den: number): number {
  if (den <= 0) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function diffPct(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const days = Math.max(1, Math.min(90, Number(url.searchParams.get("days") || 7)));

  const now = Date.now();
  const from = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
  const prevFrom = new Date(now - 2 * days * 24 * 60 * 60 * 1000).toISOString();
  const prevTo = from;

  const supabase = createAdminClient();

  const [eventsRes, prevEventsRes, visitsRes, prevVisitsRes, leadsRes, alertsRes] = await Promise.all([
    supabase
      .from("aed_analytics_events")
      .select("event_name, properties, page_url, referrer, created_at")
      .gte("created_at", from),
    supabase
      .from("aed_analytics_events")
      .select("event_name")
      .gte("created_at", prevFrom)
      .lt("created_at", prevTo),
    supabase
      .from("aed_ad_visits")
      .select("gclid, utm_source, referrer, created_at")
      .gte("created_at", from),
    supabase
      .from("aed_ad_visits")
      .select("*", { count: "exact", head: true })
      .gte("created_at", prevFrom)
      .lt("created_at", prevTo),
    supabase
      .from("aed_leads")
      .select("id, full_name, phone, email, product_id, gclid, created_at")
      .gte("created_at", from)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("aed_analytics_digest_log")
      .select("digest_date, kind, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const events = (eventsRes.data ?? []) as EventRow[];
  const prevEvents = (prevEventsRes.data ?? []) as Array<{ event_name: string }>;
  const visits = (visitsRes.data ?? []) as VisitRow[];
  const leads = (leadsRes.data ?? []) as LeadRow[];
  const digestLogs = (alertsRes.data ?? []) as DigestLogRow[];

  const eventCounts: Record<string, number> = {};
  for (const e of events) eventCounts[e.event_name] = (eventCounts[e.event_name] ?? 0) + 1;
  const prevEventCounts: Record<string, number> = {};
  for (const e of prevEvents) prevEventCounts[e.event_name] = (prevEventCounts[e.event_name] ?? 0) + 1;

  const visitorsCount = visits.length;
  const prevVisitorsCount = prevVisitsRes.count ?? 0;

  const lineClicks = events.filter((e) => e.event_name === "line_click");
  const docDownloads = events.filter((e) => e.event_name === "doc_download");
  const heroViews = events.filter((e) => e.event_name === "hero_cta_view");

  const a_views = heroViews.filter((e) => (e.properties?.variant as string) === "a").length;
  const b_views = heroViews.filter((e) => (e.properties?.variant as string) === "b").length;
  const a_clicks = lineClicks.filter(
    (e) => (e.properties?.hero_variant as string) === "a" && (e.properties?.location as string) === "hero",
  ).length;
  const b_clicks = lineClicks.filter(
    (e) => (e.properties?.hero_variant as string) === "b" && (e.properties?.location as string) === "hero",
  ).length;

  const dailyMap = new Map<string, { visitors: number; line_clicks: number; leads: number; form_submits: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const k = d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    dailyMap.set(k, { visitors: 0, line_clicks: 0, leads: 0, form_submits: 0 });
  }
  for (const v of visits) {
    const k = dayKey(v.created_at);
    const row = dailyMap.get(k);
    if (row) row.visitors++;
  }
  for (const c of lineClicks) {
    const row = dailyMap.get(dayKey(c.created_at));
    if (row) row.line_clicks++;
  }
  for (const e of events.filter((x) => x.event_name === "lead_form_submit")) {
    const row = dailyMap.get(dayKey(e.created_at));
    if (row) row.form_submits++;
  }
  for (const l of leads) {
    const row = dailyMap.get(dayKey(l.created_at));
    if (row) row.leads++;
  }

  return NextResponse.json({
    ok: true,
    range: { days, from, to: new Date(now).toISOString() },
    kpis: {
      visitors: visitorsCount,
      visitors_prev: prevVisitorsCount,
      visitors_change_pct: diffPct(visitorsCount, prevVisitorsCount),
      line_clicks: lineClicks.length,
      line_ctr: pct(lineClicks.length, visitorsCount),
      leads: leads.length,
      conversion_rate: pct(leads.length, visitorsCount),
      docs_downloaded: docDownloads.length,
      price_views: eventCounts["price_view"] ?? 0,
      form_starts: eventCounts["lead_form_start"] ?? 0,
      form_submits: eventCounts["lead_form_submit"] ?? 0,
      form_abandons: eventCounts["lead_form_abandon"] ?? 0,
    },
    funnel: {
      visits: visitorsCount,
      price_views: eventCounts["price_view"] ?? 0,
      form_starts: eventCounts["lead_form_start"] ?? 0,
      form_submits: eventCounts["lead_form_submit"] ?? 0,
    },
    daily_series: [...dailyMap.entries()].map(([date, v]) => ({ date, ...v })),
    top_pages: topN(events.map((e) => pathFromUrl(e.page_url))).map((x) => ({ path: x.key, n: x.n })),
    top_referrers: topN(visits.map((v) => hostFromUrl(v.referrer))).map((x) => ({ host: x.key, n: x.n })),
    top_docs: topN(docDownloads.map((e) => (e.properties?.doc_id as string) ?? null)).map((x) => ({
      doc_id: x.key,
      n: x.n,
    })),
    top_line_locations: topN(lineClicks.map((e) => (e.properties?.location as string) ?? null)).map((x) => ({
      location: x.key,
      n: x.n,
    })),
    ab: {
      a_views,
      a_clicks,
      a_ctr: pct(a_clicks, a_views),
      b_views,
      b_clicks,
      b_ctr: pct(b_clicks, b_views),
    },
    recent_leads: leads.map((l) => ({
      id: l.id,
      full_name: l.full_name,
      phone: l.phone,
      email: l.email,
      product_id: l.product_id,
      from_ads: !!l.gclid,
      created_at: l.created_at,
    })),
    recent_alerts: digestLogs
      .filter((d) => Array.isArray(d.payload?.alerts) && (d.payload!.alerts!.length ?? 0) > 0)
      .map((d) => ({ date: d.digest_date, kind: d.kind, alerts: d.payload!.alerts! })),
  });
}
