import { createAdminClient } from "@/lib/supabase/admin";
import { isConfigured, sha256, uploadConversion } from "@/lib/aed/google-ads";

export type RecordConversionInput = {
  conversionActionId?: string | null;
  conversionDateTime?: string;
  orderId?: string | null;
  valueThb?: number;
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type RecordConversionResult =
  | { ok: true; sent: boolean; matchStrategy?: string; reason?: string }
  | { ok: false; sent: false; error: string };

function matchStrategyFor(i: RecordConversionInput): string {
  if (i.gclid) return "gclid";
  if (i.gbraid) return "gbraid";
  if (i.wbraid) return "wbraid";
  return "enhanced";
}

// Single entry point for reporting a conversion to Google Ads. Always writes a
// row to aed_conversion_log so intent is captured even before Google Ads API
// credentials (GOOGLE_ADS_*) or the conversion action id are configured — those
// rows then serve as an auditable backlog the moment everything is wired up.
export async function recordConversion(
  input: RecordConversionInput,
): Promise<RecordConversionResult> {
  const supabase = createAdminClient();
  const conversionActionId =
    input.conversionActionId || process.env.GOOGLE_ADS_CONVERSION_ACTION_ID || null;

  const baseLog = {
    conversion_action: conversionActionId,
    match_strategy: matchStrategyFor(input),
    gclid: input.gclid ?? null,
    email_hash: input.email ? sha256(input.email.trim().toLowerCase()) : null,
    phone_hash: input.phone ? sha256(input.phone.trim()) : null,
    order_id: input.orderId ?? null,
    value_micros:
      typeof input.valueThb === "number" ? Math.round(input.valueThb * 1_000_000) : null,
    currency: "THB",
    conversion_date_time: input.conversionDateTime ?? null,
  };

  const hasAttribution = Boolean(
    input.gclid || input.gbraid || input.wbraid || input.email || input.phone,
  );

  if (!hasAttribution) {
    await supabase.from("aed_conversion_log").insert({
      ...baseLog,
      status: "skipped_no_attribution",
      response_summary: "no gclid/gbraid/wbraid/email/phone",
    });
    return { ok: false, sent: false, error: "no_attribution" };
  }

  if (!conversionActionId) {
    await supabase.from("aed_conversion_log").insert({
      ...baseLog,
      status: "skipped_no_action_id",
      response_summary: "GOOGLE_ADS_CONVERSION_ACTION_ID not set",
    });
    return { ok: true, sent: false, reason: "no_conversion_action_id" };
  }

  if (!isConfigured()) {
    await supabase.from("aed_conversion_log").insert({
      ...baseLog,
      status: "skipped_no_creds",
      response_summary: "GOOGLE_ADS_* env not configured",
    });
    return { ok: true, sent: false, reason: "google_ads_not_configured" };
  }

  const result = await uploadConversion({
    conversionActionId,
    conversionDateTime: input.conversionDateTime,
    orderId: input.orderId ?? undefined,
    valueThb: input.valueThb,
    gclid: input.gclid ?? null,
    gbraid: input.gbraid ?? null,
    wbraid: input.wbraid ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
  });

  await supabase.from("aed_conversion_log").insert({
    ...baseLog,
    match_strategy: result.ok ? result.matchStrategy : baseLog.match_strategy,
    status: result.ok ? "sent" : "failed",
    response_summary: result.ok ? `match=${result.matchStrategy}` : result.reason.slice(0, 500),
  });

  if (!result.ok) return { ok: false, sent: false, error: result.reason };
  return { ok: true, sent: true, matchStrategy: result.matchStrategy };
}
