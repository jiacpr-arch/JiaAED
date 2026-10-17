import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_S,
  ADMIN_SESSION_PATH,
  createAdminSession,
  isAuthorized,
  timingSafeEqual,
} from "@/lib/aed/admin-auth";
import { hashIp } from "@/lib/aed/lead-validation";
import { MINUTE, countRecent, overLimit, requestIp } from "@/lib/aed/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The admin token guards every lead's PII, so throttle guessing: failures are
// recorded per hashed IP and a source with too many in the window is refused.
const FAILED_LOGIN_WINDOW_MS = 15 * MINUTE;
const MAX_FAILED_LOGINS = 10;
const FAILED_LOGIN_EVENT = "admin_login_failed";

/** GET — is the current browser signed in? (the cookie isn't readable from JS) */
export async function GET(req: Request) {
  return NextResponse.json({ ok: true, authenticated: isAuthorized(req) });
}

/** POST { token } — exchange the admin token for an HttpOnly session cookie. */
export async function POST(req: Request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const ipHash = hashIp(requestIp(req));
  if (ipHash) {
    const failures = await countRecent(
      "aed_analytics_events",
      [["event_name", FAILED_LOGIN_EVENT], ["ip_hash", ipHash]],
      FAILED_LOGIN_WINDOW_MS,
    );
    if (overLimit(failures, MAX_FAILED_LOGINS)) {
      return NextResponse.json(
        { ok: false, error: "rate_limited" },
        { status: 429, headers: { "retry-after": "900" } },
      );
    }
  }

  const body = (await req.json().catch(() => null)) as { token?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!token || !timingSafeEqual(token, expected)) {
    await createAdminClient()
      .from("aed_analytics_events")
      .insert({ event_name: FAILED_LOGIN_EVENT, properties: {}, ip_hash: ipHash })
      .then(({ error }) => {
        if (error) console.error("[admin/session] failed-login log failed:", error.message);
      });
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, createAdminSession(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: ADMIN_SESSION_PATH,
    maxAge: ADMIN_SESSION_MAX_AGE_S,
  });
  return res;
}

/** DELETE — sign out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: ADMIN_SESSION_PATH,
    maxAge: 0,
  });
  return res;
}
