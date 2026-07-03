/**
 * Simple admin auth via a single shared token (ADMIN_TOKEN env var).
 *
 * The token can be supplied either via:
 *  - Authorization: Bearer <token>
 *  - Cookie: admin_token=<token>
 *
 * This is a low-overhead guard appropriate for a single-tenant internal admin
 * page. Swap for proper auth (Supabase Auth, etc.) when you have multiple
 * users.
 */

import { timingSafeEqual } from "@/lib/aed/timing-safe";

export { timingSafeEqual };

export function getAdminTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)admin_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function isAuthorized(req: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const provided = getAdminTokenFromRequest(req);
  if (!provided) return false;
  return timingSafeEqual(provided, expected);
}
