import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { sendMetaLeadEvent } from "@/lib/aed/meta-capi";
import { hashIp } from "@/lib/aed/lead-validation";
import { HOUR, countRecent, overLimit, requestIp } from "@/lib/aed/rate-limit";

export const runtime = "nodejs";

// Server-side companion to the browser `Lead` pixel fired on a LINE-button click
// (see LineClickTracker). A LINE click carries no email/phone, so attribution
// relies on fbc/fbp + client IP/UA. Shares eventId with the browser pixel for
// dedup. Safe no-op until the Meta env vars are set.
//
// It reports the visitor's IP/UA to Meta, so it only fires when the request
// carries the visitor's marketing consent (sent by LineClickTracker only after
// "ยอมรับทั้งหมด"). Meta optimizes ad delivery on this event, so cap how many
// Leads one source can trigger per hour (counted from its recorded LINE clicks).
const MAX_LEADS_PER_IP_PER_HOUR = 10;

type Body = {
  source?: string;
  location?: string;
  eventId?: string;
  fbc?: string;
  fbp?: string;
  pageUrl?: string;
  marketingConsent?: boolean;
};

function clean(v: unknown, max = 255): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (body.marketingConsent !== true) {
    return NextResponse.json({ ok: true, skipped: "no_consent" });
  }

  const eventId = clean(body.eventId, 64);
  const fbc = clean(body.fbc);
  const fbp = clean(body.fbp);
  const pageUrl = clean(body.pageUrl, 500);
  const location = clean(body.location, 100);

  if (!eventId) {
    return NextResponse.json({ ok: false, error: "missing_event_id" }, { status: 400 });
  }

  const userAgent = clean(req.headers.get("user-agent"), 500);
  const ip = requestIp(req);
  const ipHash = hashIp(ip);
  if (ipHash) {
    const clicks = await countRecent(
      "aed_analytics_events",
      [["ip_hash", ipHash], ["event_name", "line_click"]],
      HOUR,
    );
    if (overLimit(clicks, MAX_LEADS_PER_IP_PER_HOUR)) {
      return NextResponse.json({ ok: true, skipped: "rate_limited" });
    }
  }

  // waitUntil keeps the serverless instance alive until the CAPI call settles —
  // a bare `void fetch` would be torn down the moment we return (Vercel freezes
  // the function on response), silently dropping the event. This route exists
  // only to fire that event, so it must not be dropped.
  waitUntil(
    sendMetaLeadEvent({
      eventId,
      fbc,
      fbp,
      clientIp: ip,
      userAgent,
      eventSourceUrl: pageUrl,
      contentName: location ? `line_click:${location}` : "line_click",
    }).catch((e) => console.error("[AED] meta line-click lead failed:", e)),
  );

  return NextResponse.json({ ok: true });
}
