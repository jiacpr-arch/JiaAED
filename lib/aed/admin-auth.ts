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

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

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
