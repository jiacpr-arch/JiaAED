import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAbandonedForm } from "@/lib/aed/notify-owner";
import {
  clean,
  hashIp,
  isValidPhone,
  isValidEmail,
  VALID_PRODUCT_IDS,
} from "@/lib/aed/lead-validation";
import { HOUR, countRecent, findRecentLead, overLimit, requestIp } from "@/lib/aed/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Each stored partial pushes an "abandoned form" alert to every admin's LINE,
// so cap it per source and site-wide (see the lead route for the rationale).
const PARTIALS_PER_IP_PER_HOUR = 5;
const PARTIAL_FLOOD_PER_HOUR = 20;

type Body = {
  variant?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  company?: string;
  productId?: string;
  unitCount?: string;
  message?: string;
  pageUrl?: string;
  utm?: Record<string, string | undefined>;
  gclid?: string;
};

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

  const fullName = clean(body.fullName, 120);
  const phone = clean(body.phone, 30);
  const email = clean(body.email, 120);
  const company = clean(body.company, 200);
  // Beacon route: keep the lead but drop an unrecognized product id instead of
  // rejecting (the full form route 400s; here the contact info still matters).
  const rawProductId = clean(body.productId, 30);
  const productId =
    rawProductId && VALID_PRODUCT_IDS.has(rawProductId) ? rawProductId : null;
  const unitCount = clean(body.unitCount, 40);
  const message = clean(body.message, 2000);
  const pageUrl = clean(body.pageUrl, 500);
  const variant = clean(body.variant, 30) || "full";
  const gclid = clean(body.gclid, 200);

  if (!phone && !email) {
    return NextResponse.json({ ok: true, skipped: "no_contact" });
  }
  if (phone && !isValidPhone(phone, 6)) {
    return NextResponse.json({ ok: true, skipped: "invalid_phone" });
  }
  if (email && !isValidEmail(email)) {
    return NextResponse.json({ ok: true, skipped: "invalid_email" });
  }

  const utm = body.utm ?? {};
  const utmSource = clean(utm.source, 100);
  const utmCampaign = clean(utm.campaign, 200);
  const utmMedium = clean(utm.medium, 100);

  const ip = requestIp(req);
  const ipHash = hashIp(ip);
  const userAgent = clean(req.headers.get("user-agent"), 500);

  if (
    ipHash &&
    overLimit(
      await countRecent("aed_leads", [["ip_hash", ipHash]], HOUR),
      PARTIALS_PER_IP_PER_HOUR,
    )
  ) {
    return NextResponse.json({ ok: true, skipped: "rate_limited" });
  }
  // Same contact already captured in the last hour (a full submit, or an
  // earlier beacon from another tab/page) — nothing new to tell the owner.
  if (await findRecentLead({ phone, email }, HOUR, { includePartial: true })) {
    return NextResponse.json({ ok: true, skipped: "duplicate" });
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("aed_leads").insert({
    source: `partial_${variant}`,
    full_name: fullName,
    phone,
    email,
    company_name: company,
    product_id: productId,
    unit_count: unitCount,
    message,
    gclid,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    page_url: pageUrl,
    user_agent: userAgent,
    ip_hash: ipHash,
  });

  if (error) {
    console.error("[lead-partial] insert failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (overLimit(await countRecent("aed_leads", [], HOUR), PARTIAL_FLOOD_PER_HOUR)) {
    console.warn("[lead-partial] flood — skipping LINE alert");
    return NextResponse.json({ ok: true });
  }

  // waitUntil, not a bare `void` — this route is hit via sendBeacon on page
  // unload, so the instance is especially likely to be frozen the instant we
  // respond. Without waitUntil the LINE abandon-alert fetch is dropped mid-flight.
  waitUntil(
    notifyAbandonedForm({
      variant,
      fullName,
      phone,
      email,
      company,
      productId,
      unitCount,
      message,
      utmSource,
      utmCampaign,
      pageUrl,
    }).catch((e) => console.error("[lead-partial] notify failed:", e)),
  );

  return NextResponse.json({ ok: true });
}
