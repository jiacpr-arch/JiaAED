import { createAdminClient } from "@/lib/supabase/admin";

const HOT_THRESHOLD = 7;
const LOOKBACK_MIN = 30;
const ALERT_DEDUP_MIN = 60 * 24;

const WEIGHTS: Record<string, number> = {
  engaged_session: 1,
  scroll_depth_50: 1,
  scroll_depth_75: 2,
  scroll_depth_100: 1,
  price_view: 2,
  hero_cta_view: 0,
  web_chat_open: 2,
  web_chat_message_sent: 1,
  web_chat_contact_click: 5,
  lead_form_view: 1,
  lead_form_start: 3,
  lead_form_field_focus: 1,
  line_click: 5,
};

export const HOT_LEAD_TRIGGER_EVENTS = new Set([
  "line_click",
  "web_chat_contact_click",
  "lead_form_start",
  "lead_form_field_focus",
]);

type EventRow = {
  event_name: string;
  properties: Record<string, unknown> | null;
  created_at: string;
};

export type SessionScore = {
  score: number;
  reasons: string[];
  events: number;
  utm_source: string | null;
  utm_campaign: string | null;
};

export async function scoreSession(sessionId: string): Promise<SessionScore | null> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - LOOKBACK_MIN * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("aed_analytics_events")
    .select("event_name, properties, created_at, utm_source, utm_campaign")
    .eq("session_id", sessionId)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) return null;

  const seen = new Set<string>();
  let score = 0;
  const reasons: string[] = [];
  let utm_source: string | null = null;
  let utm_campaign: string | null = null;

  for (const row of data as (EventRow & { utm_source: string | null; utm_campaign: string | null })[]) {
    utm_source = utm_source ?? row.utm_source;
    utm_campaign = utm_campaign ?? row.utm_campaign;

    let key = row.event_name;
    if (row.event_name === "scroll_depth") {
      const d = (row.properties?.depth as number) ?? 0;
      if (d >= 100) key = "scroll_depth_100";
      else if (d >= 75) key = "scroll_depth_75";
      else if (d >= 50) key = "scroll_depth_50";
      else continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);

    const w = WEIGHTS[key] ?? 0;
    if (w > 0) {
      score += w;
      reasons.push(`${key} +${w}`);
    }
  }

  return { score, reasons, events: data.length, utm_source, utm_campaign };
}

export function isHot(score: SessionScore): boolean {
  return score.score >= HOT_THRESHOLD;
}

export async function alreadyAlerted(sessionId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - ALERT_DEDUP_MIN * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("aed_analytics_events")
    .select("id")
    .eq("session_id", sessionId)
    .eq("event_name", "hot_lead_alert_fired")
    .gte("created_at", since)
    .limit(1);
  return !!data && data.length > 0;
}

// Atomic dedup gate: returns true only if this call inserted the alert row.
// A partial unique index on (session_id) WHERE event_name = 'hot_lead_alert_fired'
// makes concurrent inserts for the same session collide — the loser gets 23505
// and must not send a notification.
export async function recordAlert(sessionId: string, score: SessionScore): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("aed_analytics_events").insert({
    event_name: "hot_lead_alert_fired",
    properties: {
      score: score.score,
      reasons: score.reasons,
      events: score.events,
    },
    session_id: sessionId,
    utm_source: score.utm_source,
    utm_campaign: score.utm_campaign,
  });
  if (!error) return true;
  if (error.code === "23505") return false; // already alerted / lost the race
  console.error("[AED] recordAlert failed:", error);
  return false;
}

export function formatHotLeadMessage(args: {
  score: SessionScore;
  pageUrl: string | null;
  triggerEvent: string;
}): string {
  const { score, pageUrl, triggerEvent } = args;

  // A line_click trigger means the visitor clicked a LINE button on the
  // website — that is interest, NOT a confirmed friend-add. Make the headline
  // say so, so a click is never mistaken for a real lead. The genuine "added"
  // signal comes from the LINE follow webhook (notifyNewFollow).
  const clickedOnly = triggerEvent === "line_click";
  const headline = clickedOnly
    ? `👀 สนใจมาก — กดปุ่ม LINE (score ${score.score})`
    : `🔥 Hot lead! (score ${score.score})`;

  const lines = [headline];
  if (clickedOnly) {
    lines.push(`⚠️ เพิ่งกดปุ่มบนเว็บ ยังไม่ยืนยันว่าแอดเพื่อนแล้ว`);
  }
  lines.push(`Trigger: ${triggerEvent}`);
  lines.push(`Signals: ${score.reasons.slice(0, 6).join(", ")}`);

  if (score.utm_source) {
    const utm = score.utm_campaign ? `${score.utm_source} / ${score.utm_campaign}` : score.utm_source;
    lines.push(`Source: ${utm}`);
  }
  if (pageUrl) lines.push(`Page: ${pageUrl}`);
  lines.push(`⏰ ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`);
  return lines.join("\n");
}
