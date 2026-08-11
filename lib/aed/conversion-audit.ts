// ─── Conversion tracking reconciliation ────────────────────────────────────────
// lib/aed/conversion.ts logs every attempt to report a lead to Google Ads into
// aed_conversion_log (status: sent / failed / skipped_no_attribution /
// skipped_no_action_id / skipped_no_creds) but nothing ever summarizes what
// fraction of REAL leads actually made it through. ads-round2's CPL-based
// budget recommendations implicitly assume conversion data is complete — if
// the pipeline is silently half-broken (docs/google-ads-setup.md leaves this
// as an open TODO), those recommendations are computed on a blind spot. This
// module reconciles aed_leads against aed_conversion_log weekly.
//
// Match hashing mirrors conversion.ts exactly (sha256(email.trim().toLowerCase())
// / sha256(phone.trim())) — if that hashing ever changes, update both places.

import { sha256 } from "./google-ads";
import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_DAYS = 30;
const MATCH_RATE_ALERT_THRESHOLD = 0.5; // below this, flag as a problem

export type LeadRow = {
  id: string;
  gclid: string | null;
  email: string | null;
  phone: string | null;
};

export type ConversionLogRow = {
  status: string;
  gclid: string | null;
  email_hash: string | null;
  phone_hash: string | null;
};

export function hashEmail(email: string): string {
  return sha256(email.trim().toLowerCase());
}

export function hashPhone(phone: string): string {
  return sha256(phone.trim());
}

/** Does any 'sent' conversion-log row correspond to this lead (gclid or hash match)? */
export function leadWasReported(lead: LeadRow, sentLogs: ConversionLogRow[]): boolean {
  return sentLogs.some((log) => {
    if (lead.gclid && log.gclid && lead.gclid === log.gclid) return true;
    if (lead.email && log.email_hash && hashEmail(lead.email) === log.email_hash) return true;
    if (lead.phone && log.phone_hash && hashPhone(lead.phone) === log.phone_hash) return true;
    return false;
  });
}

export type ConversionAuditResult = {
  totalLeads: number;
  matchedLeads: number;
  unmatchedLeads: number;
  matchRate: number; // 0..1, 1 when totalLeads === 0 (nothing to miss)
  statusBreakdown: Record<string, number>;
};

/** Pure reconciliation over already-fetched rows — no I/O, easy to test. */
export function auditConversions(
  leads: LeadRow[],
  logs: ConversionLogRow[],
): ConversionAuditResult {
  const sentLogs = logs.filter((l) => l.status === "sent");
  const matchedLeads = leads.filter((lead) => leadWasReported(lead, sentLogs)).length;
  const totalLeads = leads.length;

  const statusBreakdown: Record<string, number> = {};
  for (const log of logs) {
    statusBreakdown[log.status] = (statusBreakdown[log.status] ?? 0) + 1;
  }

  return {
    totalLeads,
    matchedLeads,
    unmatchedLeads: totalLeads - matchedLeads,
    matchRate: totalLeads === 0 ? 1 : matchedLeads / totalLeads,
    statusBreakdown,
  };
}

export function isConversionAuditOk(result: ConversionAuditResult): boolean {
  return result.totalLeads === 0 || result.matchRate >= MATCH_RATE_ALERT_THRESHOLD;
}

export function formatConversionAuditReport(result: ConversionAuditResult): string {
  const ok = isConversionAuditOk(result);
  const icon = ok ? "✅" : "🚨";
  const pct = Math.round(result.matchRate * 100);

  const header =
    result.totalLeads === 0
      ? `${icon} Conversion tracking (${WINDOW_DAYS} วัน): ไม่มีลีดใหม่ ไม่มีอะไรให้เช็ค`
      : `${icon} Conversion tracking (${WINDOW_DAYS} วัน): รายงานสำเร็จ ${result.matchedLeads}/${result.totalLeads} ราย (${pct}%)`;

  const breakdownLines = Object.entries(result.statusBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => `• ${status}: ${count}`);

  const advice =
    !ok
      ? [
          "",
          result.statusBreakdown.skipped_no_creds > 0 || result.statusBreakdown.skipped_no_action_id > 0
            ? "⚠️ ระบบยังไม่ได้ตั้งค่า Google Ads API ครบ (ดู docs/google-ads-setup.md)"
            : "⚠️ ลีดจำนวนมากไม่มี gclid/email/phone ตรงกับที่รายงานสำเร็จ — ตรวจการเชื่อม webhook",
        ]
      : [];

  return [header, "", ...breakdownLines, ...advice].join("\n");
}

/** Minimal Supabase surface this module touches (injectable for tests). */
export type AuditClient = {
  from: (table: string) => {
    select: (columns: string) => {
      gte: (col: string, val: string) => PromiseLike<{ data: unknown[] | null }>;
    };
  };
};

type RawLeadRow = LeadRow & { source: string | null };

// "partial_*" sources are abandoned-form captures, not real leads — the same
// exclusion daily-digest's checkBidReadiness applies via `.not("source", "ilike", "partial%")`.
// Filtered here in JS instead of in the query so AuditClient's shape stays
// identical for both tables (no optional `.not()` in the type).
function isRealLead(row: RawLeadRow): boolean {
  return !(row.source ?? "").toLowerCase().startsWith("partial");
}

/** Fetch real leads + conversion log for the trailing window and reconcile them. */
export async function runConversionAudit(
  client: AuditClient = createAdminClient() as unknown as AuditClient,
  windowDays = WINDOW_DAYS,
): Promise<ConversionAuditResult> {
  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();

  const { data: leadRows } = await client
    .from("aed_leads")
    .select("id,gclid,email,phone,source")
    .gte("created_at", since);

  const { data: logRows } = await client
    .from("aed_conversion_log")
    .select("status,gclid,email_hash,phone_hash")
    .gte("created_at", since);

  const realLeads = ((leadRows ?? []) as RawLeadRow[]).filter(isRealLead);

  return auditConversions(realLeads, (logRows ?? []) as ConversionLogRow[]);
}
