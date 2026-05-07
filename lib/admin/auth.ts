import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "jia_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function expectedToken(): string {
  const password = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.ADMIN_COOKIE_SECRET ?? "fallback-insecure";
  return crypto.createHmac("sha256", secret).update(password).digest("hex");
}

export async function requireAdmin(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token !== expectedToken()) {
    redirect("/admin/login");
  }
}

export async function verifyPassword(submitted: string): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) return false;
  return crypto.timingSafeEqual(Buffer.from(submitted), Buffer.from(password));
}

export function buildCookieHeader(): string {
  const token = expectedToken();
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/admin; Max-Age=${COOKIE_MAX_AGE}; Secure`;
}

export function clearCookieHeader(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/admin; Max-Age=0`;
}
