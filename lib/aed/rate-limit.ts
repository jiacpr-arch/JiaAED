// DB-backed abuse limits for the public endpoints.
//
// Vercel runs many short-lived instances, so an in-memory counter only sees a
// slice of the traffic. These helpers count recent rows in tables the routes
// already write (aed_leads, aed_analytics_events, aed_messages) instead — no
// new infrastructure, and the count is shared by every instance. Every helper
// fails OPEN (returns null / "not limited") on a DB error: a broken limiter
// must never cost a real customer their lead or their answer.

import { createAdminClient } from "@/lib/supabase/admin";

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** First hop of x-forwarded-for (set by Vercel's edge), else x-real-ip. */
export function requestIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

export type EqFilter = [column: string, value: string];

/**
 * Count rows in `table` created within the last `windowMs` that match every
 * equality filter. Returns null when the query fails.
 */
export async function countRecent(
  table: string,
  filters: EqFilter[],
  windowMs: number,
): Promise<number | null> {
  try {
    let q = createAdminClient()
      .from(table)
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - windowMs).toISOString());
    for (const [column, value] of filters) q = q.eq(column, value);
    const { count, error } = await q;
    if (error) {
      console.error(`[rate-limit] count on ${table} failed:`, error.message);
      return null;
    }
    return count ?? 0;
  } catch (e) {
    console.error(`[rate-limit] count on ${table} threw:`, e);
    return null;
  }
}

/** True only for a known count at or above `max` (unknown → not limited). */
export function overLimit(count: number | null, max: number): boolean {
  return count !== null && count >= max;
}

/**
 * Id of a lead with the same phone or email inside the window, or null.
 * Partial (abandoned-form) rows only count when `includePartial` is set, so a
 * real submit after an abandon beacon is never swallowed as a duplicate.
 */
export async function findRecentLead(
  contact: { phone: string | null; email: string | null },
  windowMs: number,
  opts: { includePartial?: boolean } = {},
): Promise<string | null> {
  const since = new Date(Date.now() - windowMs).toISOString();
  // Two .eq() queries rather than one .or(): .or() takes a raw PostgREST
  // filter string, and a phone like "(02) 123" would break out of it.
  for (const [column, value] of [
    ["phone", contact.phone],
    ["email", contact.email],
  ] as const) {
    if (!value) continue;
    try {
      let q = createAdminClient()
        .from("aed_leads")
        .select("id")
        .eq(column, value)
        .gte("created_at", since);
      if (!opts.includePartial) q = q.not("source", "like", "partial%");
      const { data, error } = await q.order("created_at", { ascending: false }).limit(1);
      if (error) {
        console.error("[rate-limit] duplicate lookup failed:", error.message);
        continue;
      }
      const id = (data?.[0] as { id?: string } | undefined)?.id;
      if (id) return id;
    } catch (e) {
      console.error("[rate-limit] duplicate lookup threw:", e);
    }
  }
  return null;
}
