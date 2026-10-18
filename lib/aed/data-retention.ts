import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/aed/paging";

// How long personal data is kept (owner, Oct 2026 — the same periods are stated
// on /privacy, keep the two in step):
//  - marketing/analytics (page events, ad visits, ad-conversion uploads): 13
//    months, so a month can still be compared with the same month last year;
//  - leads and chat (form leads, LINE/web chat transcripts, follow-ups, LINE
//    contacts who never bought): 2 years.
// Deals (and the customers/conversations they point at), the unit registry and
// the cron/digest logs are never deleted here: they back warranty, service and
// the accounting records.
export const RETENTION = { marketingMonths: 13, leadChatYears: 2 } as const;

/** `now` minus whole calendar months, clamped to the month's last day (Mar 31 − 1 → Feb 28). */
export function monthsBefore(now: Date, months: number): Date {
  const d = new Date(now);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

export function retentionCutoffs(now: Date): { marketing: string; leadChat: string } {
  return {
    marketing: monthsBefore(now, RETENTION.marketingMonths).toISOString(),
    leadChat: monthsBefore(now, RETENTION.leadChatYears * 12).toISOString(),
  };
}

/** Candidates that nothing still points at. */
export function deletableIds(candidates: string[], ...protectedIds: Array<Iterable<string | null>>): string[] {
  const keep = new Set<string>();
  for (const ids of protectedIds) for (const id of ids) if (id) keep.add(id);
  return candidates.filter((id) => !keep.has(id));
}

export type RetentionReport = Record<string, number>;

// Rows per page / per delete request. A delete sends its ids in the URL, and
// ~100 UUIDs keep it near 4 KB (postgrest-js warns past 8 KB; proxies cut off
// around 8–16 KB). MAX_PAGES bounds one run well inside the cron's maxDuration —
// whatever is left goes the next day.
const PAGE = 500;
const DELETE_CHUNK = 100;
const MAX_PAGES = 20;

// A lead keeps its contact details for the 2-year lead period, but the
// ad-referral data on it is marketing data (13 months, as /privacy says).
const LEAD_ATTRIBUTION_COLUMNS = [
  "gclid",
  "fbclid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "page_url",
  "user_agent",
  "ip_hash",
] as const;

type Db = ReturnType<typeof createAdminClient>;

async function deleteOlderThan(db: Db, table: string, cutoff: string, dryRun: boolean): Promise<number> {
  const { count, error } = dryRun
    ? await db.from(table).select("id", { count: "exact", head: true }).lt("created_at", cutoff)
    : await db.from(table).delete({ count: "exact" }).lt("created_at", cutoff);
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

async function stripLeadAttribution(db: Db, cutoff: string, dryRun: boolean): Promise<number> {
  const anySet = LEAD_ATTRIBUTION_COLUMNS.map((c) => `${c}.not.is.null`).join(",");
  const cleared = Object.fromEntries(LEAD_ATTRIBUTION_COLUMNS.map((c) => [c, null]));
  const { count, error } = dryRun
    ? await db.from("aed_leads").select("id", { count: "exact", head: true }).lt("created_at", cutoff).or(anySet)
    : await db.from("aed_leads").update(cleared, { count: "exact" }).lt("created_at", cutoff).or(anySet);
  if (error) throw new Error(`aed_leads attribution: ${error.message}`);
  return count ?? 0;
}

/** Inactive rows (by `activeColumn`, falling back to created_at when it's null). */
function inactiveFilter(activeColumn: string, cutoff: string): string {
  return `${activeColumn}.lt.${cutoff},and(${activeColumn}.is.null,created_at.lt.${cutoff})`;
}

/** `column` of every row this run keeps in `table` (rows created on/after `keptSince`). */
async function referencedIds(db: Db, table: string, column: string, keptSince: string): Promise<string[]> {
  const rows = await fetchAllRows<Record<string, string | null>>((from, to) =>
    db.from(table).select(column).not(column, "is", null).gte("created_at", keptSince).order("id").range(from, to),
  );
  return rows.map((r) => r[column]).filter((v): v is string => !!v);
}

/**
 * Delete rows of `table` that are inactive since `cutoff` and not referenced by
 * `protectedIds`. Pages by id (keyset), so rows that must stay never crowd the
 * page. Returns the ids deleted — or, in a dry run, the ids that would be.
 */
async function deleteInactive(
  db: Db,
  table: string,
  activeColumn: string,
  cutoff: string,
  protectedIds: Array<Iterable<string | null>>,
  dryRun: boolean,
): Promise<string[]> {
  const gone: string[] = [];
  let lastId: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    let query = db.from(table).select("id").or(inactiveFilter(activeColumn, cutoff));
    if (lastId) query = query.gt("id", lastId);
    const { data, error } = await query.order("id").limit(PAGE);
    if (error) throw new Error(`${table}: ${error.message}`);
    const candidates = ((data ?? []) as Array<{ id: string }>).map((r) => r.id);
    if (candidates.length === 0) break;
    lastId = candidates[candidates.length - 1];

    const ids = deletableIds(candidates, ...protectedIds);
    for (let i = 0; i < ids.length && !dryRun; i += DELETE_CHUNK) {
      const { error: delError } = await db.from(table).delete().in("id", ids.slice(i, i + DELETE_CHUNK));
      if (delError) throw new Error(`${table}: ${delError.message}`);
    }
    gone.push(...ids);
    if (candidates.length < PAGE) break;
  }
  return gone;
}

/** Apply the retention policy. `dryRun` reports what would go without deleting. */
export async function runDataRetention(now: Date, dryRun = false): Promise<RetentionReport> {
  const db = createAdminClient();
  const cut = retentionCutoffs(now);
  const report: RetentionReport = {};

  for (const table of ["aed_analytics_events", "aed_ad_visits", "aed_conversion_log"]) {
    report[table] = await deleteOlderThan(db, table, cut.marketing, dryRun);
  }
  report.aed_leads_attribution_cleared = await stripLeadAttribution(db, cut.marketing, dryRun);
  for (const table of ["aed_leads", "aed_messages", "aed_followups"]) {
    report[table] = await deleteOlderThan(db, table, cut.leadChat, dryRun);
  }

  // Deals and follow-ups reference conversations and customers without
  // ON DELETE CASCADE, so rows they point at are skipped rather than failing a
  // batch. Only follow-ups this run keeps count (older ones were just deleted —
  // or would be, in a dry run). A customer delete cascades to their
  // conversations, so a customer goes only once none of theirs is left.
  const deals = await fetchAllRows<{ conversation_id: string | null; customer_id: string | null }>((from, to) =>
    db.from("aed_deals").select("conversation_id, customer_id").order("id").range(from, to),
  );
  const conversationsGone = await deleteInactive(
    db,
    "aed_conversations",
    "last_message_at",
    cut.leadChat,
    [deals.map((d) => d.conversation_id), await referencedIds(db, "aed_followups", "conversation_id", cut.leadChat)],
    dryRun,
  );
  report.aed_conversations = conversationsGone.length;

  const goneSet = new Set(conversationsGone);
  const liveConversations = await fetchAllRows<{ id: string; customer_id: string | null }>((from, to) =>
    db.from("aed_conversations").select("id, customer_id").not("customer_id", "is", null).order("id").range(from, to),
  );
  report.aed_customers = (
    await deleteInactive(
      db,
      "aed_customers",
      "last_active_at",
      cut.leadChat,
      [
        deals.map((d) => d.customer_id),
        await referencedIds(db, "aed_followups", "customer_id", cut.leadChat),
        liveConversations.filter((c) => !goneSet.has(c.id)).map((c) => c.customer_id),
      ],
      dryRun,
    )
  ).length;

  return report;
}
