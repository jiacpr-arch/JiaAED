// Idempotency gate for the once-per-day / once-per-week cron endpoints.
//
// Vercel Cron delivery is *at-least-once*: the platform can invoke a scheduled
// endpoint more than once for the same tick. Every notifying cron used to write
// its run marker with `upsert(..., { onConflict })` — which always succeeds —
// and then push to the owner's LINE unconditionally, so a redundant re-fire
// re-sent the whole digest/report. That is the duplicate the owner keeps seeing.
//
// The gate is the UNIQUE(digest_date, kind) constraint on
// aed_analytics_digest_log (added precisely "so we don't re-send a digest if
// cron retries"). The first invocation for a given Bangkok day inserts the
// marker row and wins; a concurrent or later invocation collides (Postgres
// error 23505) and loses. Same trick as the per-session hot-lead dedup index in
// aed_analytics_events.

import { createAdminClient } from "@/lib/supabase/admin";

/** Today's date in Bangkok as YYYY-MM-DD — the bucket a daily cron dedups on. */
export function bkkDateLabel(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Minimal shape of the Supabase insert path this helper touches (injectable for tests). */
export type ClaimClient = {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => PromiseLike<{ error: { code?: string } | null }>;
  };
};

/**
 * Atomically claim a once-per-day cron run so its side effects (LINE pushes,
 * GitHub PRs, ad-budget changes) fire exactly once per Bangkok day even when
 * Vercel re-delivers the same scheduled tick.
 *
 * Returns `true` if THIS invocation won the claim and should proceed, or
 * `false` if the day was already claimed — in which case the caller must
 * return early WITHOUT sending anything.
 *
 * On an unexpected DB error it fails **open** (returns `true`): a rare duplicate
 * is a smaller harm than silently dropping the day's report. The winning marker
 * row is later enriched with the full payload by the cron's own
 * logRun()/logOptimizerRun() upsert, which shares the (digest_date, kind) key.
 */
export async function claimDailyCronRun(
  kind: string,
  opts: { date?: string; client?: ClaimClient } = {},
): Promise<boolean> {
  const date = opts.date ?? bkkDateLabel();
  try {
    const supabase = opts.client ?? (createAdminClient() as unknown as ClaimClient);
    const { error } = await supabase
      .from("aed_analytics_digest_log")
      .insert({ digest_date: date, kind, payload: { status: "claimed" } });

    if (!error) return true;
    if (error.code === "23505") return false; // unique violation → already ran today
    console.error(`[cron-once] claim insert failed for "${kind}":`, error);
    return true; // fail open
  } catch (e) {
    console.error(`[cron-once] claim threw for "${kind}":`, e);
    return true; // fail open
  }
}
