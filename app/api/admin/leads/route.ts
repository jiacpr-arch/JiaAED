import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorized } from "@/lib/aed/admin-auth";
import { recordConversion } from "@/lib/aed/conversion";
import { sendGa4Events } from "@/lib/aed/ga4";
import { sendMetaStageEvent } from "@/lib/aed/meta-capi";
import {
  STAGE_SIGNALS,
  VALUE_COLUMN,
  conversionActionFor,
  conversionOrderId,
  formatOutcome,
  isConversionStage,
  parseStatusChange,
  stageEventId,
  type SignalOutcome,
} from "@/lib/aed/lead-pipeline";

export const runtime = "nodejs";
export const maxDuration = 30;

// No ip_hash / user_agent: the team doesn't need them to work a lead.
const COLUMNS =
  "id,created_at,source,full_name,phone,email,company_name,product_id,unit_count,message,gclid,fbclid,utm_source,utm_medium,utm_campaign,utm_content,page_url,status,status_updated_at,quote_value_thb,contract_value_thb,paid_value_thb,lost_reason,admin_note";

const unauthorized = () => NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

export async function GET(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const url = new URL(req.url);
  const supabase = createAdminClient();

  // One lead's history.
  const id = url.searchParams.get("id");
  if (id) {
    const { data, error } = await supabase
      .from("aed_lead_events")
      .select("id,from_status,to_status,value_thb,note,conversion_status,created_at")
      .eq("lead_id", id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[admin/leads][GET events]", error.message);
      return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, events: data ?? [] });
  }

  // Abandoned-form captures (source "partial…") aren't leads the team works.
  const { data, error } = await supabase
    .from("aed_leads")
    .select(COLUMNS)
    .not("source", "like", "partial%")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    console.error("[admin/leads][GET]", error.message);
    return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, leads: data ?? [] });
}

export async function PATCH(req: Request) {
  if (!isAuthorized(req)) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });

  const change = parseStatusChange(body);
  if ("error" in change) return NextResponse.json({ ok: false, error: change.error }, { status: 400 });

  const supabase = createAdminClient();
  const { data: lead, error: readErr } = await supabase
    .from("aed_leads")
    .select("id,status,gclid,ga_client_id,fbc,fbp,marketing_consent,phone,email,source,utm_campaign")
    .eq("id", id)
    .maybeSingle();
  if (readErr) return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
  if (!lead) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { status: change.status, status_updated_at: now };
  const valueCol = VALUE_COLUMN[change.status];
  if (valueCol && change.valueThb !== null) update[valueCol] = change.valueThb;
  if (change.status === "lost") update.lost_reason = change.lostReason;
  if (change.note) update.admin_note = change.note;

  const { error: updErr } = await supabase.from("aed_leads").update(update).eq("id", id);
  if (updErr) {
    console.error("[admin/leads][PATCH]", updErr.message);
    return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
  }

  // Report the stage once per lead: an earlier event for the same stage means
  // it was already handled, so moving back and forth never re-sends.
  //  - Google Ads (money stages only): gclid only — the form stores one only
  //    after cookie consent, so no hashed contact is sent for anyone else.
  //  - GA4 + Meta (qualified → payment): only for leads that gave marketing
  //    consent on the form; GA4 by their GA client id, Meta by fbc/fbp and
  //    hashed phone/email.
  const outcome: SignalOutcome = { ads: null, ga4: null, meta: null };
  const signal = STAGE_SIGNALS[change.status];
  if (signal || isConversionStage(change.status)) {
    const { count } = await supabase
      .from("aed_lead_events")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", id)
      .eq("to_status", change.status);
    const already = (count ?? 0) > 0;
    const value = change.valueThb ?? undefined;
    const stage = change.status;

    if (isConversionStage(stage)) {
      const actionId = conversionActionFor(stage, process.env);
      if (already) outcome.ads = "skipped_already_reported";
      else if (!lead.gclid) outcome.ads = "skipped_no_gclid";
      else if (!actionId) outcome.ads = "skipped_no_action_id";
      else {
        outcome.ads = "queued";
        waitUntil(
          recordConversion({ conversionActionId: actionId, orderId: conversionOrderId(id, stage), valueThb: value, gclid: lead.gclid })
            .then((r) => console.log(`[admin/leads] ads ${stage}`, r))
            .catch((e) => console.error("[admin/leads] ads failed", e)),
        );
      }
    }

    if (signal) {
      if (already) {
        outcome.ga4 = outcome.meta = "skipped_already_reported";
      } else if (!lead.marketing_consent) {
        outcome.ga4 = outcome.meta = "skipped_no_consent";
      } else {
        const params: Record<string, string | number> = { lead_source: lead.source ?? "unknown", currency: "THB" };
        if (lead.utm_campaign) params.campaign = lead.utm_campaign;
        if (value !== undefined) params.value = value;

        if (!lead.ga_client_id) outcome.ga4 = "skipped_no_client_id";
        else if (!process.env.GA4_API_SECRET) outcome.ga4 = "skipped_no_api_secret";
        else {
          outcome.ga4 = "queued";
          waitUntil(
            sendGa4Events(lead.ga_client_id, [{ name: signal.ga4, params }])
              .then((r) => console.log(`[admin/leads] ga4 ${signal.ga4}`, r))
              .catch((e) => console.error("[admin/leads] ga4 failed", e)),
          );
        }

        outcome.meta = "queued";
        waitUntil(
          sendMetaStageEvent({
            eventName: signal.meta,
            eventId: stageEventId(id, stage),
            email: lead.email,
            phone: lead.phone,
            fbc: lead.fbc,
            fbp: lead.fbp,
            valueThb: value,
            leadSource: lead.source,
          })
            .then((r) => console.log(`[admin/leads] meta ${signal.meta}`, r))
            .catch((e) => console.error("[admin/leads] meta failed", e)),
        );
      }
    }
  }

  const { error: evErr } = await supabase.from("aed_lead_events").insert({
    lead_id: id,
    from_status: lead.status,
    to_status: change.status,
    value_thb: change.valueThb,
    note: change.status === "lost" ? change.lostReason : change.note,
    conversion_status: formatOutcome(outcome),
  });
  if (evErr) console.error("[admin/leads][PATCH] event insert", evErr.message);

  return NextResponse.json({ ok: true, signals: outcome });
}
