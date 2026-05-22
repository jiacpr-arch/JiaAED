import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAbandonedForm } from "@/lib/aed/notify-owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  variant?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  company?: string;
  productId?: string;
  message?: string;
  pageUrl?: string;
  utm?: Record<string, string | undefined>;
  gclid?: string;
};

const PHONE_RE = /^[0-9+\-() ]{6,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(v: unknown, max = 500): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
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

  const fullName = clean(body.fullName, 120);
  const phone = clean(body.phone, 30);
  const email = clean(body.email, 120);
  const company = clean(body.company, 200);
  const productId = clean(body.productId, 30);
  const message = clean(body.message, 2000);
  const pageUrl = clean(body.pageUrl, 500);
  const variant = clean(body.variant, 30) || "full";
  const gclid = clean(body.gclid, 200);

  if (!phone && !email) {
    return NextResponse.json({ ok: true, skipped: "no_contact" });
  }
  if (phone && !PHONE_RE.test(phone)) {
    return NextResponse.json({ ok: true, skipped: "invalid_phone" });
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: true, skipped: "invalid_email" });
  }

  const utm = body.utm ?? {};
  const utmSource = clean(utm.source, 100);
  const utmCampaign = clean(utm.campaign, 200);
  const utmMedium = clean(utm.medium, 100);

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = clean(req.headers.get("user-agent"), 500);

  const supabase = createAdminClient();

  const { error } = await supabase.from("aed_leads").insert({
    source: `partial_${variant}`,
    full_name: fullName,
    phone,
    email,
    company_name: company,
    product_id: productId,
    message,
    gclid,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    page_url: pageUrl,
    user_agent: userAgent,
    ip_hash: hashIp(ip),
  });

  if (error) {
    console.error("[lead-partial] insert failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  void notifyAbandonedForm({
    variant,
    fullName,
    phone,
    email,
    company,
    productId,
    message,
    utmSource,
    utmCampaign,
    pageUrl,
  }).catch((e) => console.error("[lead-partial] notify failed:", e));

  return NextResponse.json({ ok: true });
}
