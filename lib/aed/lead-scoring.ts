import { createAdminClient } from "@/lib/supabase/admin";
import type { AedCustomer } from "./types";

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

// ─── Conversation scoring (LINE chat) ──────────────────────────────────────────
//
// scoreSession() above scores anonymous WEB sessions from analytics events.
// A LINE conversation is a stronger, different signal: the person has actually
// messaged us, so we know who they are and what the AI did for them (which tools
// it called). This turns that into a 0–N score plus a coarse intent label.
//
// Until now `aed_conversations.lead_score` was never written — every LINE chat
// sat at 0, so the owner couldn't tell a tyre-kicker from a buyer who already
// has a quotation in hand. scoreConversation() is the value that gets written
// back via updateConversationState() from the LINE webhook.

export const CONVERSATION_HOT_THRESHOLD = 7;

export type ConversationScoreInput = {
  customer: Pick<AedCustomer, "full_name" | "phone" | "email" | "company_name">;
  // Tool calls the AI made this conversation (from the orchestrator). Only
  // `name` and `input` are read, so callers can pass AiToolCall[] directly.
  toolsUsed: { name: string; input?: Record<string, unknown> }[];
  messageCount: number;
};

export type ConversationScore = {
  score: number;
  intent: string;
  reasons: string[];
};

// A value the AI captured *this turn* via update_customer_info won't be on the
// (start-of-turn) customer row yet, so OR the tool inputs in to avoid scoring a
// just-shared phone number as missing.
function freshValue(updates: Record<string, unknown>[], field: string, existing: string | null): string | null {
  if (existing && existing.trim()) return existing;
  for (const u of updates) {
    const v = u[field];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

export function scoreConversation(input: ConversationScoreInput): ConversationScore {
  const { customer, toolsUsed, messageCount } = input;
  const toolNames = new Set(toolsUsed.map((t) => t.name));
  const updates = toolsUsed.filter((t) => t.name === "update_customer_info").map((t) => t.input ?? {});

  const name = freshValue(updates, "full_name", customer.full_name);
  const phone = freshValue(updates, "phone", customer.phone);
  const email = freshValue(updates, "email", customer.email);
  const company = freshValue(updates, "company_name", customer.company_name);

  let score = 0;
  const reasons: string[] = [];
  const add = (cond: unknown, pts: number, why: string) => {
    if (cond) {
      score += pts;
      reasons.push(`${why} +${pts}`);
    }
  };

  // Contact signals — on LINE a phone number is the strongest "real lead" signal.
  add(phone, 4, "phone");
  add(email, 2, "email");
  add(company, 2, "company");
  add(name, 1, "name");

  // Buying-intent signals from what the AI actually did this conversation.
  add(toolNames.has("calculate_price"), 2, "viewed_price");
  add(toolNames.has("escalate_to_human"), 3, "escalated");
  add(toolNames.has("create_quotation"), 5, "quotation");
  add(toolNames.has("create_payment_link"), 6, "payment_link");

  // Engagement depth.
  add(messageCount >= 4, 1, "engaged");
  add(messageCount >= 8, 1, "deep_engaged");

  // Coarse intent label — highest-intent signal wins.
  let intent = "browsing";
  if (toolNames.has("create_payment_link")) intent = "ready_to_pay";
  else if (toolNames.has("create_quotation")) intent = "quotation";
  else if (toolNames.has("escalate_to_human")) intent = "escalated";
  else if (toolNames.has("calculate_price")) intent = "pricing";
  else if (phone || email) intent = "contact_shared";

  return { score, intent, reasons };
}
