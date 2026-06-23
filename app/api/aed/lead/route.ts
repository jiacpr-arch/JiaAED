import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyNewLead } from "@/lib/aed/notify-owner";
import { sendLeadAutoReply } from "@/lib/aed/email";
import { recordConversion } from "@/lib/aed/conversion";
import { sendMetaLeadEvent } from "@/lib/aed/meta-capi";
import { products, accessories } from "@/lib/aed/products";
import { clean, hashIp, isValidPhone, isValidEmail } from "@/lib/aed/lead-validation";

export const runtime = "nodejs";

// Sellable ids the quote/lead forms may reference. Beyond the homepage product
// grid (`products`) this also accepts accessories and the package/subscription
// pseudo-products + PRIMEDIC models so corporate quote submissions don't 400.
const EXTRA_PRODUCT_IDS = [
  "pkg-premium",
  "pkg-start",
  "pkg-care",
  // ดูแลครบ subscription tiers (BASIC / PRO / ELITE)
  "managed-basic",
  "managed-pro",
  "managed-elite",
  // แผนอีเวนต์ event packages
  "event-day",
  "event-weekend",
  "event-weekly",
  "event-extended",
  "primedic-y0",
  "primedic-y8",
  "yuwell-gps",
];
const VALID_PRODUCT_IDS = new Set<string>([
  ...products.map((p) => p.id),
  ...accessories.map((a) => a.id),
  ...EXTRA_PRODUCT_IDS,
]);

type LeadBody = {
  source?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  company?: string;
  productId?: string;
  unitCount?: string;
  message?: string;
  gclid?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  eventId?: string;
  pageUrl?: string;
  hp?: string;
};

export async function POST(req: Request) {
  let body: LeadBody;
  try {
    body = (await req.json()) as LeadBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Honeypot — return a silent success so bots think they got through, but flag
  // it as not stored so the client skips the lead_form_submit event and the
  // Google Ads conversion. Otherwise every bot that trips the hidden field fires
  // a phantom conversion (no lead row), polluting the funnel + Ads optimization.
  if (body.hp && body.hp.trim() !== "") {
    return NextResponse.json({ ok: true, skipped: "honeypot" });
  }

  const fullName = clean(body.fullName, 120);
  const phone = clean(body.phone, 30);
  const email = clean(body.email, 120);
  const company = clean(body.company, 200);
  const productId = clean(body.productId, 30);
  const unitCount = clean(body.unitCount, 40);
  const message = clean(body.message, 2000);
  const gclid = clean(body.gclid, 200);
  const fbclid = clean(body.fbclid, 255);
  const fbc = clean(body.fbc, 255);
  const fbp = clean(body.fbp, 255);
  const eventId = clean(body.eventId, 64);
  const pageUrl = clean(body.pageUrl, 500);
  const source = clean(body.source, 30) || "lead_form";

  if (!phone && !email) {
    return NextResponse.json(
      { ok: false, error: "missing_contact", message: "ต้องมีเบอร์โทรหรืออีเมลอย่างน้อย 1 อย่าง" },
      { status: 400 },
    );
  }
  if (phone && !isValidPhone(phone, 8)) {
    return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }
  if (email && !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (productId && !VALID_PRODUCT_IDS.has(productId)) {
    return NextResponse.json({ ok: false, error: "invalid_product" }, { status: 400 });
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
  const { data, error } = await supabase
    .from("aed_leads")
    .insert({
      source,
      full_name: fullName,
      phone,
      email,
      company_name: company,
      product_id: productId,
      unit_count: unitCount,
      message,
      gclid,
      fbclid,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_term: utmTerm,
      utm_content: utmContent,
      page_url: pageUrl,
      user_agent: userAgent,
      ip_hash: ipHash,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[AED] lead insert failed:", error);
    return NextResponse.json({ ok: false, error: "store_failed" }, { status: 500 });
  }

  const productName = productId
    ? products.find((p) => p.id === productId)?.name ?? null
    : null;

  // Side effects don't block the response, but they MUST be registered with
  // waitUntil — on Vercel the serverless instance is frozen the moment we return,
  // so a bare `void fetch(...)` (the LINE owner push, the Ads upload, the email)
  // gets torn down mid-flight and silently dropped. waitUntil keeps the function
  // alive until they settle. (The LINE webhook route uses the same pattern.)
  waitUntil(
    notifyNewLead({
      source,
      fullName,
      phone,
      email,
      company,
      productId,
      unitCount,
      message,
      gclid,
      utmSource,
      utmCampaign,
    }).catch((e) => console.error("[AED] notify failed:", e)),
  );

  // Report the lead to Google Ads (gclid click-conversion, or enhanced match on
  // phone/email). No-op-but-logged until GOOGLE_ADS_* env + conversion action id
  // are configured. orderId = lead id so Google dedupes re-submissions.
  waitUntil(
    recordConversion({
      gclid,
      email,
      phone,
      orderId: data.id,
    }).catch((e) => console.error("[AED] conversion record failed:", e)),
  );

  // Report the lead to Meta via Conversions API (server-side), sharing eventId
  // with the browser pixel for dedup. Must use waitUntil — bare void fetch is
  // torn down the moment we return on Vercel serverless.
  waitUntil(
    sendMetaLeadEvent({
      eventId: eventId || data.id,
      email,
      phone,
      fbc,
      fbp,
      clientIp: ip,
      userAgent,
      eventSourceUrl: pageUrl,
      contentName: productName,
    }).catch((e) => console.error("[AED] meta capi failed:", e)),
  );

  if (email) {
    waitUntil(
      sendLeadAutoReply({ to: email, fullName, productName }).catch((e) =>
        console.error("[AED] auto-reply failed:", e),
      ),
    );
  }

  return NextResponse.json({ ok: true, leadId: data.id });
}
