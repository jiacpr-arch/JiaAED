// Shared input validation for the lead-capture routes (app/api/aed/lead +
// lead-partial). Extracted so the money-path validation has one source of truth
// and can be unit-tested directly instead of only through a live HTTP request.

import { createHash } from "crypto";
import { products, accessories } from "@/lib/aed/products";

// Sellable ids the quote/lead forms may reference. Beyond the homepage product
// grid (`products`) this also accepts accessories and the package/subscription
// pseudo-products + PRIMEDIC models so corporate quote submissions don't 400.
const EXTRA_PRODUCT_IDS = [
  "pkg-premium",
  "pkg-start",
  "pkg-care",
  // ดูแลครบ subscription tiers (BASIC / PRO / ELITE)
  "managed-basic",
  "managed-pro",
  "managed-elite",
  // แผนอีเวนต์ event packages
  "event-day",
  "event-weekend",
  "event-weekly",
  "event-extended",
  "primedic-y0",
  "primedic-y8",
  "yuwell-gps",
];

export const VALID_PRODUCT_IDS = new Set<string>([
  ...products.map((p) => p.id),
  ...accessories.map((a) => a.id),
  ...EXTRA_PRODUCT_IDS,
]);

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone is accepted as free-form digits + separators; min length differs by
// route (full lead form is stricter than the partial/abandon capture). Returns
// false for anything outside the allowed charset or length window.
export function isValidPhone(phone: string, minLen = 8, maxLen = 20): boolean {
  if (phone.length < minLen || phone.length > maxLen) return false;
  return /^[0-9+\-() ]+$/.test(phone);
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

// Trim, reject empties/non-strings, and cap length. Returns null when there's no
// usable value so callers can treat "absent" and "blank" identically.
export function clean(v: unknown, max = 500): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

// Hash an IP for privacy-preserving dedup/rate context. Salted so the same IP
// isn't trivially reversible; truncated to keep the stored value compact.
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.LEAD_IP_SALT || "jiaaed";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
