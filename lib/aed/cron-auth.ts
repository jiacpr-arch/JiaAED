import { timingSafeEqual } from "@/lib/aed/timing-safe";

/**
 * Shared auth guard for /api/cron/* routes (Vercel Cron sends
 * `Authorization: Bearer ${CRON_SECRET}`).
 *
 * Fails CLOSED: if CRON_SECRET is not configured, every request is rejected.
 * Several crons have production-changing side effects (auto-merge + deploy),
 * so a missing env var must never leave them world-callable.
 */
export function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron-auth] CRON_SECRET is not set — rejecting cron request");
    return false;
  }
  const auth = req.headers.get("authorization") ?? "";
  return timingSafeEqual(auth, `Bearer ${secret}`);
}
