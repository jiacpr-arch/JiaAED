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

// Rows per delete request; the loop stops after MAX_BATCHES so one run stays
// well inside the cron's maxDuration (the rest goes the next day).
const BATCH = 500;
const MAX_BATCHES = 20;

type Db = ReturnType<typeof createAdminClient>;

async function deleteOlderThan(db: Db, table: string, column: string, cutoff: string, dryRun: boolean): Promise<number> {
  if (dryRun) {
    const { count, error } = await db.from(table).select("id", { count: "exact", head: true }).lt(column, cutoff);
    if (error) throw new Error(`${table}: ${error.message}`);
    return count ?? 0;
  }
  const { count, error } = await db.from(table).delete({ count: "exact" }).lt(column, cutoff);
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

/** Inactive rows of `table` (by `activeColumn`, falling back to created_at when it's null). */
function inactiveFilter(activeColumn: string, cutoff: string): string {
  return `${activeColumn}.lt.${cutoff},and(${activeColumn}.is.null,created_at.lt.${cutoff})`;
}

async function referencedIds(db: Db, table: string, column: string): Promise<string[]> {
  const rows = await fetchAllRows<Record<string, string | null>>((from, to) =>
    db.from(table).select(column).not(column, "is", null).order("id").range(from, to),
  );
  return rows.map((r) => r[column]).filter((v): v is string => !!v);
}

/**
 * Delete rows of `table` that are inactive since `cutoff` and not referenced by
 * `protectedIds`, in batches. In a dry run, only count them (first batch window).
 */
async function deleteInactive(
  db: Db,
  table: string,
  activeColumn: string,
  cutoff: string,
  protectedIds: () => Promise<Array<Iterable<string | null>>>,
  dryRun: boolean,
): Promise<number> {
  let total = 0;
  const skip = new Set<string>();
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const { data, error } = await db
      .from(table)
      .select("id")
      .or(inactiveFilter(activeColumn, cutoff))
      .order("id")
      .limit(BATCH + skip.size);
    if (error) throw new Error(`${table}: ${error.message}`);
    const candidates = ((data ?? []) as Array<{ id: string }>).map((r) => r.id).filter((id) => !skip.has(id));
    if (candidates.length === 0) break;
    const ids = deletableIds(candidates, ...(await protectedIds()));
    // Protected rows come back on every query; remember them so the loop ends.
    candidates.filter((id) => !ids.includes(id)).forEach((id) => skip.add(id));
    if (ids.length === 0) {
      if (candidates.length < BATCH) break;
      continue;
    }
    if (dryRun) return ids.length;
    const { count, error: delError } = await db.from(table).delete({ count: "exact" }).in("id", ids);
    if (delError) throw new Error(`${table}: ${delError.message}`);
    total += count ?? 0;
    if (candidates.length < BATCH) break;
  }
  return total;
}

/** Apply the retention policy. `dryRun` reports what would go without deleting. */
export async function runDataRetention(now: Date, dryRun = false): Promise<RetentionReport> {
  const db = createAdminClient();
  const cut = retentionCutoffs(now);
  const report: RetentionReport = {};

  for (const table of ["aed_analytics_events", "aed_ad_visits", "aed_conversion_log"]) {
    report[table] = await deleteOlderThan(db, table, "created_at", cut.marketing, dryRun);
  }
  for (const table of ["aed_leads", "aed_messages", "aed_followups"]) {
    report[table] = await deleteOlderThan(db, table, "created_at", cut.leadChat, dryRun);
  }

  // Follow-ups and deals reference conversations and customers without
  // ON DELETE CASCADE, so those rows are skipped rather than failing the batch;
  // a customer delete cascades to their conversations, so a customer is only
  // removed once none of their conversations is left.
  report.aed_conversations = await deleteInactive(
    db,
    "aed_conversations",
    "last_message_at",
    cut.leadChat,
    async () => [await referencedIds(db, "aed_deals", "conversation_id"), await referencedIds(db, "aed_followups", "conversation_id")],
    dryRun,
  );
  report.aed_customers = await deleteInactive(
    db,
    "aed_customers",
    "last_active_at",
    cut.leadChat,
    async () => [
      await referencedIds(db, "aed_deals", "customer_id"),
      await referencedIds(db, "aed_followups", "customer_id"),
      await referencedIds(db, "aed_conversations", "customer_id"),
    ],
    dryRun,
  );

  return report;
}
