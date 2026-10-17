/**
 * Admin auth for the single-tenant /admin pages, backed by one shared secret
 * (ADMIN_TOKEN env var).
 *
 * A request is authorized by either:
 *  - Cookie: jiaaed_admin=<session> — set by POST /api/admin/session after the
 *    token is entered once. HttpOnly (page scripts, including third-party tags
 *    on the public pages, can't read it), SameSite=Strict (no cross-site
 *    requests carry it), scoped to /api/admin and expiring after 7 days. The
 *    value is an HMAC of its own expiry keyed by ADMIN_TOKEN, so the token
 *    itself never sits in the browser and rotating it ends every session.
 *  - Authorization: Bearer <ADMIN_TOKEN> — for scripts / curl.
 *
 * Swap for proper per-user auth (Supabase Auth, etc.) once there's more than
 * one admin.
 */

import { createHmac } from "crypto";
import { timingSafeEqual } from "@/lib/aed/timing-safe";

export { timingSafeEqual };

export const ADMIN_SESSION_COOKIE = "jiaaed_admin";
export const ADMIN_SESSION_PATH = "/api/admin";
export const ADMIN_SESSION_MAX_AGE_S = 7 * 24 * 60 * 60;

function sign(secret: string, exp: number): string {
  return createHmac("sha256", secret).update(`admin-session:${exp}`).digest("base64url");
}

/** Cookie value for a session that expires `maxAgeS` from `now`. */
export function createAdminSession(
  secret: string,
  now = Date.now(),
  maxAgeS = ADMIN_SESSION_MAX_AGE_S,
): string {
  const exp = Math.floor(now / 1000) + maxAgeS;
  return `${exp}.${sign(secret, exp)}`;
}

export function isValidAdminSession(value: string, secret: string, now = Date.now()): boolean {
  const dot = value.indexOf(".");
  if (dot <= 0) return false;
  const exp = Number(value.slice(0, dot));
  if (!Number.isInteger(exp) || exp * 1000 <= now) return false;
  return timingSafeEqual(value.slice(dot + 1), sign(secret, exp));
}

function readCookie(req: Request, name: string): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function isAuthorized(req: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return timingSafeEqual(auth.slice(7).trim(), expected);

  const session = readCookie(req, ADMIN_SESSION_COOKIE);
  return session !== null && isValidAdminSession(session, expected);
}
