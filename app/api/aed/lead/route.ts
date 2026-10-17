import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyNewLead } from "@/lib/aed/notify-owner";
import { sendLeadAutoReply, sendLeadOwnerNotification } from "@/lib/aed/email";
import { recordConversion } from "@/lib/aed/conversion";
import { sendMetaLeadEvent } from "@/lib/aed/meta-capi";
import { products } from "@/lib/aed/products";
import {
  clean,
  hashIp,
  isValidPhone,
  isValidEmail,
  VALID_PRODUCT_IDS,
} from "@/lib/aed/lead-validation";
import {
  DAY,
  HOUR,
  MINUTE,
  countRecent,
  findRecentLead,
  overLimit,
  requestIp,
} from "@/lib/aed/rate-limit";

export const runtime = "nodejs";

// Abuse limits. A real buyer submits once or twice; anything past these is a
// script, and every stored lead fans out to a LINE push, two emails and two ad
// platforms. Kept generous so a busy office sharing one IP still gets through.
const LEADS_PER_IP_PER_HOUR = 8;
// The exact same submission again within this window (every field equal) = a
// double-click or a re-send from the success screen: answer with the first
// lead and repeat no side effects. Anything that differs is a new lead.
const DUPLICATE_WINDOW_MS = 10 * MINUTE;
// Site-wide hourly volume past which we stop pushing LINE alerts and sending
// auto-replies (the owner email still goes out) — this business sees a few
// leads a day, so this only trips during a flood.
const LEAD_FLOOD_PER_HOUR = 30;

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
  /** True only when the visitor accepted the cookie banner (lib/aed/consent.ts). */
  marketingConsent?: boolean;
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
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (typeof body.hp === "string" && body.hp.trim() !== "") {
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
  // PDPA: without consent the lead is stored and the team is notified as
  // usual, but nothing about this visitor is handed to Google or Meta.
  const marketingConsent = body.marketingConsent === true;

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
  const ip = requestIp(req);
  const ipHash = hashIp(ip);

  if (ipHash && overLimit(await countRecent("aed_leads", [["ip_hash", ipHash]], HOUR), LEADS_PER_IP_PER_HOUR)) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "retry-after": "3600" } },
    );
  }

  // `skipped` tells the form not to fire a second conversion for the repeat.
  const duplicateOf = await findRecentLead({ phone, email }, DUPLICATE_WINDOW_MS, {
    sameAs: {
      source,
      full_name: fullName,
      phone,
      email,
      company_name: company,
      product_id: productId,
      unit_count: unitCount,
      message,
      page_url: pageUrl,
    },
  });
  if (duplicateOf) {
    return NextResponse.json({ ok: true, skipped: "duplicate", leadId: duplicateOf });
  }

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

  const flooding = overLimit(await countRecent("aed_leads", [], HOUR), LEAD_FLOOD_PER_HOUR);
  if (flooding) console.warn("[AED] lead flood — skipping LINE alert + auto-reply for", data.id);

  // Side effects don't block the response, but they MUST be registered with
  // waitUntil — on Vercel the serverless instance is frozen the moment we return,
  // so a bare `void fetch(...)` (the LINE owner push, the Ads upload, the email)
  // gets torn down mid-flight and silently dropped. waitUntil keeps the function
  // alive until they settle. (The LINE webhook route uses the same pattern.)
  if (!flooding) {
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
  }

  // Email copy of the lead to the owner — a second channel alongside LINE.
  waitUntil(
    sendLeadOwnerNotification({
      leadId: data.id,
      source,
      fullName,
      phone,
      email,
      company,
      productName: productName ?? productId,
      unitCount,
      message,
      adSource: gclid
        ? "Google Ads"
        : utmSource
        ? `${utmSource}${utmCampaign ? ` / ${utmCampaign}` : ""}`
        : "organic / direct",
      pageUrl,
    })
      .then((r) => {
        if (!r.ok) console.warn("[AED] owner lead email skipped:", r.reason);
      })
      .catch((e) => console.error("[AED] owner lead email failed:", e)),
  );

  // Report the lead to Google Ads (gclid click-conversion, or enhanced match on
  // phone/email). No-op-but-logged until GOOGLE_ADS_* env + conversion action id
  // are configured. orderId = lead id so Google dedupes re-submissions. Without
  // consent it's still logged (as no-attribution) but carries no user data.
  waitUntil(
    recordConversion({
      gclid: marketingConsent ? gclid : null,
      email: marketingConsent ? email : null,
      phone: marketingConsent ? phone : null,
      orderId: data.id,
    }).catch((e) => console.error("[AED] conversion record failed:", e)),
  );

  // Report the lead to Meta via Conversions API (server-side), sharing eventId
  // with the browser pixel for dedup. Must use waitUntil — bare void fetch is
  // torn down the moment we return on Vercel serverless.
  if (marketingConsent) {
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
  }

  // One auto-reply per address per day: the recipient is whatever was typed,
  // so without this the form can mail-bomb a third party from our domain.
  // Abandoned-form beacons don't send mail, so they don't count.
  if (email && !flooding) {
    const sentToday = await countRecent("aed_leads", [["email", email]], DAY, { excludePartial: true });
    if (!overLimit(sentToday, 2)) {
      waitUntil(
        sendLeadAutoReply({ to: email, fullName, productName }).catch((e) =>
          console.error("[AED] auto-reply failed:", e),
        ),
      );
    }
  }

  return NextResponse.json({ ok: true, leadId: data.id });
}
