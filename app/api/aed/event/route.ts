import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

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
  "lead_form_view",
  "lead_form_start",
  "lead_form_submit",
  "lead_form_abandon",
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

  const supabase = createAdminClient();
  const { error } = await supabase.from("aed_analytics_events").insert({
    event_name: eventName,
    properties: body.properties ?? {},
    session_id: clean(body.session_id, 64),
    page_url: clean(body.page_url, 500),
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

  return NextResponse.json({ ok: true });
}
