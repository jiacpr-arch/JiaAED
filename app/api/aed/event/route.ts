import { NextResponse } from "next/server";
import { clean, hashIp } from "@/lib/aed/lead-validation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  HOT_LEAD_TRIGGER_EVENTS,
  alreadyAlerted,
  formatHotLeadMessage,
  isHot,
  recordAlert,
  scoreSession,
} from "@/lib/aed/lead-scoring";
import { notifyAnalyticsAlert } from "@/lib/aed/notify-owner";
import { HOUR, MINUTE, countRecent, overLimit, requestIp } from "@/lib/aed/rate-limit";

export const runtime = "nodejs";

// Anonymous and unauthenticated, so bound what one source can write: a page
// view emits a handful of events, a script emits thousands. `properties` is
// stored as JSONB verbatim, so cap its size too.
const EVENTS_PER_IP_PER_MINUTE = 60;
const MAX_PROPERTIES_JSON = 2_000;
// Site-wide cap on hot-lead LINE pings: sessions are free to mint, so without
// this a script could score fresh sessions to 7+ and burn the LINE quota.
const HOT_LEAD_ALERTS_PER_HOUR = 6;

function boundedProperties(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  try {
    return JSON.stringify(raw).length <= MAX_PROPERTIES_JSON
      ? (raw as Record<string, unknown>)
      : { _dropped: "too_large" };
  } catch {
    return {};
  }
}

type Body = {
  event_name?: string;
  properties?: Record<string, unknown>;
  session_id?: string;
  page_url?: string;
  referrer?: string;
  gclid?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
};

const ALLOWED_EVENTS = new Set([
  "line_click",
  "doc_download",
  "cta_click",
  "price_view",
  "lead_form_view",
  "lead_form_start",
  "lead_form_submit",
  "lead_form_abandon",
  "lead_form_field_focus",
  "scroll_depth",
  "engaged_session",
  "web_chat_open",
  "web_chat_message_sent",
  "web_chat_reset",
  "web_chat_contact_click",
]);

async function maybeNotifyHotLead(args: {
  eventName: string;
  sessionId: string | null;
  pageUrl: string | null;
}): Promise<void> {
  if (!args.sessionId) return;
  if (!HOT_LEAD_TRIGGER_EVENTS.has(args.eventName)) return;
  try {
    if (await alreadyAlerted(args.sessionId)) return;
    const recentAlerts = await countRecent(
      "aed_analytics_events",
      [["event_name", "hot_lead_alert_fired"]],
      HOUR,
    );
    if (overLimit(recentAlerts, HOT_LEAD_ALERTS_PER_HOUR)) return;
    const score = await scoreSession(args.sessionId);
    if (!score || !isHot(score)) return;
    const won = await recordAlert(args.sessionId, score);
    if (!won) return; // lost the race or already alerted — don't double-send
    await notifyAnalyticsAlert(
      formatHotLeadMessage({ score, pageUrl: args.pageUrl, triggerEvent: args.eventName }),
    );
  } catch (e) {
    console.error("[event] hot lead check failed:", e);
  }
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const eventName = clean(body.event_name, 64);
  if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
    return NextResponse.json({ ok: false, reason: "invalid_event" }, { status: 400 });
  }

  const ipHash = hashIp(requestIp(req));
  if (
    ipHash &&
    overLimit(
      await countRecent("aed_analytics_events", [["ip_hash", ipHash]], MINUTE),
      EVENTS_PER_IP_PER_MINUTE,
    )
  ) {
    return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });
  }

  const sessionId = clean(body.session_id, 64);
  const pageUrl = clean(body.page_url, 500);

  const supabase = createAdminClient();
  const { error } = await supabase.from("aed_analytics_events").insert({
    event_name: eventName,
    properties: boundedProperties(body.properties),
    session_id: sessionId,
    page_url: pageUrl,
    referrer: clean(body.referrer, 500),
    user_agent: clean(req.headers.get("user-agent"), 500),
    ip_hash: ipHash,
    gclid: clean(body.gclid, 200),
    utm_source: clean(body.utm_source, 100),
    utm_campaign: clean(body.utm_campaign, 200),
  });

  if (error) {
    console.error("[event] insert failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  await maybeNotifyHotLead({ eventName, sessionId, pageUrl });

  return NextResponse.json({ ok: true });
}
