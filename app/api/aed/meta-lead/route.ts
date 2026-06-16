import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { sendMetaLeadEvent } from "@/lib/aed/meta-capi";

export const runtime = "nodejs";

// Server-side companion to the browser `Lead` pixel fired on a LINE-button click
// (see LineClickTracker). A LINE click carries no email/phone, so attribution
// relies on fbc/fbp + client IP/UA. Shares eventId with the browser pixel for
// dedup. Safe no-op until the Meta env vars are set.

type Body = {
  source?: string;
  location?: string;
  eventId?: string;
  fbc?: string;
  fbp?: string;
  pageUrl?: string;
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

  const eventId = clean(body.eventId, 64);
  const fbc = clean(body.fbc);
  const fbp = clean(body.fbp);
  const pageUrl = clean(body.pageUrl, 500);
  const location = clean(body.location, 100);

  if (!eventId) {
    return NextResponse.json({ ok: false, error: "missing_event_id" }, { status: 400 });
  }

  const userAgent = clean(req.headers.get("user-agent"), 500);
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

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
