// Browser side of the admin session (see lib/aed/admin-auth.ts). The session
// lives in an HttpOnly cookie, so pages never hold the token after login —
// they just call the /api/admin/* routes, which receive the cookie.

const LEGACY_TOKEN_KEY = "jiaaed_admin_token";

/** Remove the token older versions of the admin pages left in localStorage. */
export function forgetLegacyToken(): void {
  try {
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    /* Storage is optional. */
  }
}

export async function adminLogin(token: string): Promise<"ok" | "invalid" | "rate_limited" | "error"> {
  try {
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.ok) return "ok";
    if (res.status === 401) return "invalid";
    if (res.status === 429) return "rate_limited";
    return "error";
  } catch {
    return "error";
  }
}

export async function adminLogout(): Promise<void> {
  await fetch("/api/admin/session", { method: "DELETE" }).catch(() => {});
}

export const LOGIN_ERRORS: Record<"invalid" | "rate_limited" | "error", string> = {
  invalid: "Token ไม่ถูกต้อง",
  rate_limited: "ลองผิดหลายครั้งเกินไป รอ 15 นาทีแล้วลองใหม่",
  error: "เชื่อมต่อไม่ได้",
};
