import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorized } from "@/lib/aed/admin-auth";
import { recordConversion } from "@/lib/aed/conversion";
import {
  VALUE_COLUMN,
  conversionActionFor,
  conversionOrderId,
  isConversionStage,
  parseStatusChange,
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
    .select("id,status,gclid")
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

  // Report a money stage to Google Ads once per lead (an earlier event for the
  // same stage means it was already handled — moving back and forth must not
  // re-upload). gclid only: the form stores one only after cookie consent, so
  // no hashed phone/email is sent on behalf of someone who didn't consent.
  let conversionStatus: string | null = null;
  if (isConversionStage(change.status)) {
    const { count } = await supabase
      .from("aed_lead_events")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", id)
      .eq("to_status", change.status);
    const actionId = conversionActionFor(change.status, process.env);
    if ((count ?? 0) > 0) conversionStatus = "skipped_already_reported";
    else if (!lead.gclid) conversionStatus = "skipped_no_gclid";
    else if (!actionId) conversionStatus = "skipped_no_action_id";
    else {
      conversionStatus = "queued";
      const stage = change.status;
      waitUntil(
        recordConversion({
          conversionActionId: actionId,
          orderId: conversionOrderId(id, stage),
          valueThb: change.valueThb ?? undefined,
          gclid: lead.gclid,
        })
          .then((r) => console.log(`[admin/leads] ${stage} conversion`, r))
          .catch((e) => console.error("[admin/leads] conversion failed", e)),
      );
    }
  }

  const { error: evErr } = await supabase.from("aed_lead_events").insert({
    lead_id: id,
    from_status: lead.status,
    to_status: change.status,
    value_thb: change.valueThb,
    note: change.status === "lost" ? change.lostReason : change.note,
    conversion_status: conversionStatus,
  });
  if (evErr) console.error("[admin/leads][PATCH] event insert", evErr.message);

  return NextResponse.json({ ok: true, conversion: conversionStatus });
}
