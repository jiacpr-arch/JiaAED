import { NextResponse } from "next/server";
import { createHash } from "crypto";
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

export const runtime = "nodejs";

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
  "hero_cta_view",
  "hero_headline_view",
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

function clean(v: unknown, max = 500): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.LEAD_IP_SALT || "jiaaed";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

async function maybeNotifyHotLead(args: {
  eventName: string;
  sessionId: string | null;
  pageUrl: string | null;
}): Promise<void> {
  if (!args.sessionId) return;
  if (!HOT_LEAD_TRIGGER_EVENTS.has(args.eventName)) return;
  try {
    if (await alreadyAlerted(args.sessionId)) return;
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

  const eventName = clean(body.event_name, 64);
  if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
    return NextResponse.json({ ok: false, reason: "invalid_event" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  const sessionId = clean(body.session_id, 64);
  const pageUrl = clean(body.page_url, 500);

  const supabase = createAdminClient();
  const { error } = await supabase.from("aed_analytics_events").insert({
    event_name: eventName,
    properties: body.properties ?? {},
    session_id: sessionId,
    page_url: pageUrl,
    referrer: clean(body.referrer, 500),
    user_agent: clean(req.headers.get("user-agent"), 500),
    ip_hash: hashIp(ip),
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
