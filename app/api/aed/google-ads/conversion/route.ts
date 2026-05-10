import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isConfigured, sha256, uploadConversion } from "@/lib/aed/google-ads";

export const runtime = "nodejs";
export const maxDuration = 30;

type Body = {
  conversionActionId?: string;
  conversionDateTime?: string;
  orderId?: string;
  valueThb?: number;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  email?: string;
  phone?: string;
};

function authorized(req: Request): boolean {
  const expected = process.env.AED_INTERNAL_API_KEY;
  if (!expected) return false; // never allow if no key configured
  const got = req.headers.get("authorization");
  return got === `Bearer ${expected}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const conversionActionId =
    body.conversionActionId || process.env.GOOGLE_ADS_CONVERSION_ACTION_ID;
  if (!conversionActionId) {
    return NextResponse.json(
      { ok: false, error: "missing_conversion_action_id" },
      { status: 400 },
    );
  }

  if (
    !body.gclid &&
    !body.gbraid &&
    !body.wbraid &&
    !body.email &&
    !body.phone
  ) {
    return NextResponse.json(
      { ok: false, error: "missing_attribution", message: "ต้องมี gclid/gbraid/wbraid หรือ email/phone อย่างน้อย 1 อย่าง" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Stub mode — log without sending
  if (!isConfigured()) {
    await supabase.from("aed_conversion_log").insert({
      conversion_action: conversionActionId,
      match_strategy: body.gclid ? "gclid" : body.gbraid ? "gbraid" : body.wbraid ? "wbraid" : "enhanced",
      gclid: body.gclid ?? null,
      email_hash: body.email ? sha256(body.email.trim().toLowerCase()) : null,
      phone_hash: body.phone ? sha256(body.phone.trim()) : null,
      order_id: body.orderId ?? null,
      value_micros: typeof body.valueThb === "number" ? Math.round(body.valueThb * 1_000_000) : null,
      currency: "THB",
      conversion_date_time: body.conversionDateTime ?? null,
      status: "skipped_no_creds",
      response_summary: "GOOGLE_ADS_* env not configured",
    });
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: "google_ads_not_configured",
      message: "Logged in aed_conversion_log; will be sent once GOOGLE_ADS_* env vars are set",
    });
  }

  const result = await uploadConversion({
    conversionActionId,
    conversionDateTime: body.conversionDateTime,
    orderId: body.orderId,
    valueThb: body.valueThb,
    gclid: body.gclid ?? null,
    gbraid: body.gbraid ?? null,
    wbraid: body.wbraid ?? null,
    email: body.email ?? null,
    phone: body.phone ?? null,
  });

  await supabase.from("aed_conversion_log").insert({
    conversion_action: conversionActionId,
    match_strategy: result.ok ? result.matchStrategy : "unknown",
    gclid: body.gclid ?? null,
    email_hash: body.email ? sha256(body.email.trim().toLowerCase()) : null,
    phone_hash: body.phone ? sha256(body.phone.trim()) : null,
    order_id: body.orderId ?? null,
    value_micros: typeof body.valueThb === "number" ? Math.round(body.valueThb * 1_000_000) : null,
    currency: "THB",
    conversion_date_time: body.conversionDateTime ?? null,
    status: result.ok ? "sent" : "failed",
    response_summary: result.ok ? `match=${result.matchStrategy}` : result.reason.slice(0, 500),
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, sent: false, error: result.reason }, { status: 502 });
  }
  return NextResponse.json({ ok: true, sent: true, matchStrategy: result.matchStrategy });
}
