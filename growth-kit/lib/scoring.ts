import type { GrowthConfig, SessionScore, StoredEvent } from "./types";

// Score the events of a single session. Each event type counts once, mirroring
// the JiaAED behaviour. `scroll_depth` events with a numeric `properties.depth`
// are mapped to bucketed keys (scroll_depth_50/75/100) if those keys carry
// weights in the config.
export function scoreEvents(events: StoredEvent[], cfg: GrowthConfig): SessionScore {
  const { weights } = cfg.scoring;
  const seen = new Set<string>();
  const reasons: string[] = [];
  let score = 0;
  let utmSource: string | null = null;
  let utmCampaign: string | null = null;

  for (const row of events) {
    utmSource = utmSource ?? row.utm_source;
    utmCampaign = utmCampaign ?? row.utm_campaign;

    let key = row.event_name;
    if (key === "scroll_depth") {
      const depth = Number(row.properties?.depth ?? 0);
      if (depth >= 100) key = "scroll_depth_100";
      else if (depth >= 75) key = "scroll_depth_75";
      else if (depth >= 50) key = "scroll_depth_50";
      else continue;
    }

    if (seen.has(key)) continue;
    seen.add(key);

    const w = weights[key] ?? 0;
    if (w > 0) {
      score += w;
      reasons.push(`${key} +${w}`);
    }
  }

  return { score, reasons, events: events.length, utmSource, utmCampaign };
}

export function isHot(score: SessionScore, cfg: GrowthConfig): boolean {
  return score.score >= cfg.scoring.hotThreshold;
}

export function formatHotLeadMessage(
  cfg: GrowthConfig,
  args: { score: SessionScore; pageUrl: string | null; triggerEvent: string },
): string {
  const { score, pageUrl, triggerEvent } = args;
  const lines = [
    `🔥 Hot lead! (score ${score.score})`,
    `Trigger: ${triggerEvent}`,
    `Signals: ${score.reasons.slice(0, 6).join(", ")}`,
  ];
  if (score.utmSource) {
    const utm = score.utmCampaign ? `${score.utmSource} / ${score.utmCampaign}` : score.utmSource;
    lines.push(`Source: ${utm}`);
  }
  if (pageUrl) lines.push(`Page: ${pageUrl}`);
  lines.push(`⏰ ${new Date().toLocaleString(cfg.locale, { timeZone: cfg.timezone })}`);
  return lines.join("\n");
}
