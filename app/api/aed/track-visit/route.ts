import { NextResponse } from "next/server";
import { clean, hashIp } from "@/lib/aed/lead-validation";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Body = {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  utm?: Record<string, string>;
  fingerprint?: string;
  pageUrl?: string;
  referrer?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const gclid = clean(body.gclid, 200);
  const gbraid = clean(body.gbraid, 200);
  const wbraid = clean(body.wbraid, 200);
  const fingerprint = clean(body.fingerprint, 64);
  const pageUrl = clean(body.pageUrl, 500);
  const referrer = clean(body.referrer, 500);

  // Don't store rows that have no useful attribution at all
  if (!gclid && !gbraid && !wbraid && !fingerprint) {
    return NextResponse.json({ ok: true, stored: false });
  }

  const utm = body.utm ?? {};
  const utmSource = clean(utm.source, 100);
  const utmMedium = clean(utm.medium, 100);
  const utmCampaign = clean(utm.campaign, 200);
  const utmTerm = clean(utm.term, 200);
  const utmContent = clean(utm.content, 200);

  const userAgent = clean(req.headers.get("user-agent"), 500);
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const ipHash = hashIp(ip);

  const supabase = createAdminClient();
  const { error } = await supabase.from("aed_ad_visits").insert({
    gclid,
    gbraid,
    wbraid,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_term: utmTerm,
    utm_content: utmContent,
    page_url: pageUrl,
    referrer,
    user_agent: userAgent,
    ip_hash: ipHash,
    fingerprint,
  });

  if (error) {
    console.error("[track-visit] insert failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, stored: true });
}
