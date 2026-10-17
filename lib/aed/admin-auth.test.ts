import { afterEach, describe, expect, it, vi } from "vitest";
import { ADMIN_SESSION_COOKIE, createAdminSession, isAuthorized, isValidAdminSession } from "./admin-auth";

const SECRET = "s3cret-token";

function req(headers: Record<string, string>): Request {
  return new Request("https://jiaaed.com/api/admin/units", { headers });
}

describe("admin session", () => {
  it("accepts a fresh session signed with the current token", () => {
    expect(isValidAdminSession(createAdminSession(SECRET), SECRET)).toBe(true);
  });

  it("rejects expired, tampered or other-token sessions", () => {
    const now = Date.now();
    const expired = createAdminSession(SECRET, now - 8 * 24 * 3600 * 1000);
    expect(isValidAdminSession(expired, SECRET, now)).toBe(false);

    const [exp, sig] = createAdminSession(SECRET).split(".");
    expect(isValidAdminSession(`${Number(exp) + 999999}.${sig}`, SECRET)).toBe(false);
    expect(isValidAdminSession(createAdminSession("old-token"), SECRET)).toBe(false);
    expect(isValidAdminSession("garbage", SECRET)).toBe(false);
  });
});

describe("isAuthorized", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("fails closed without ADMIN_TOKEN", () => {
    vi.stubEnv("ADMIN_TOKEN", "");
    expect(isAuthorized(req({ authorization: "Bearer " }))).toBe(false);
  });

  it("accepts the bearer token or a valid session cookie", () => {
    vi.stubEnv("ADMIN_TOKEN", SECRET);
    expect(isAuthorized(req({ authorization: `Bearer ${SECRET}` }))).toBe(true);
    expect(isAuthorized(req({ cookie: `${ADMIN_SESSION_COOKIE}=${createAdminSession(SECRET)}` }))).toBe(true);
  });

  it("no longer accepts the raw token as a cookie", () => {
    vi.stubEnv("ADMIN_TOKEN", SECRET);
    expect(isAuthorized(req({ cookie: `admin_token=${SECRET}` }))).toBe(false);
    expect(isAuthorized(req({ authorization: "Bearer wrong" }))).toBe(false);
  });
});
