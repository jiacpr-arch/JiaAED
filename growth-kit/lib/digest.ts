import type { GrowthConfig, StoredEvent } from "./types";

export type DigestData = {
  brand: string;
  range: { fromISO: string; toISO: string };
  visits: number; // distinct sessions in the window
  counts: Record<string, number>;
  funnel: Array<{ step: string; count: number; rateFromPrev: number }>;
  conversions: number;
  conversionRate: number; // conversions / visits, in %
  bySource: Array<{ source: string; conversions: number }>;
  alerts: string[];
};

function pct(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.round((n / d) * 1000) / 10;
}

export function buildDigest(
  events: StoredEvent[],
  range: { fromISO: string; toISO: string },
  cfg: GrowthConfig,
): DigestData {
  const counts: Record<string, number> = {};
  const sessions = new Set<string>();
  for (const e of events) {
    counts[e.event_name] = (counts[e.event_name] ?? 0) + 1;
    if (e.session_id) sessions.add(e.session_id);
  }
  const visits = sessions.size;

  const funnel: DigestData["funnel"] = [];
  let prev = 0;
  cfg.digest.funnel.forEach((step, i) => {
    const count = counts[step] ?? 0;
    funnel.push({ step, count, rateFromPrev: i === 0 ? 100 : pct(count, prev) });
    prev = count;
  });

  const conversions = cfg.digest.conversionEvents.reduce((sum, ev) => sum + (counts[ev] ?? 0), 0);

  const sourceMap = new Map<string, number>();
  for (const e of events) {
    if (!cfg.digest.conversionEvents.includes(e.event_name)) continue;
    const src = e.utm_source || "direct";
    sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1);
  }
  const bySource = [...sourceMap.entries()]
    .map(([source, c]) => ({ source, conversions: c }))
    .sort((a, b) => b.conversions - a.conversions);

  const alerts: string[] = [];
  if (visits === 0) {
    alerts.push("🚨 ไม่มี visitor เลย — ตรวจ tracking / โฆษณาว่ายังยิงอยู่");
  } else if (visits >= cfg.digest.minVisitsForAlert && conversions === 0) {
    alerts.push(`🚨 มี visitor ${visits} คน แต่ conversion = 0`);
  }

  return {
    brand: cfg.brand,
    range,
    visits,
    counts,
    funnel,
    conversions,
    conversionRate: pct(conversions, visits),
    bySource,
    alerts,
  };
}

export function formatDigest(d: DigestData): string {
  const lines: string[] = [
    `📊 ${d.brand} — สรุป`,
    ``,
    `👥 Visitors: ${d.visits}`,
    `💰 Conversions: ${d.conversions} (${d.conversionRate}%)`,
  ];

  if (d.funnel.length > 0) {
    lines.push(``, `🪜 Funnel:`);
    for (const f of d.funnel) {
      lines.push(`  ${f.step}: ${f.count} (${f.rateFromPrev}%)`);
    }
  }

  if (d.bySource.length > 0) {
    lines.push(``, `📡 By source:`);
    for (const s of d.bySource.slice(0, 4)) {
      lines.push(`  ${s.source}: ${s.conversions}`);
    }
  }

  if (d.alerts.length > 0) {
    lines.push(``, `🚨 Alerts:`);
    for (const a of d.alerts) lines.push(`  ${a}`);
  }

  return lines.join("\n");
}
