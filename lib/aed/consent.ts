// Single source of truth for the visitor's PDPA cookie/marketing consent (the
// banner in app/components/CookieConsent.tsx). Client-side only: every helper
// is a safe no-op during SSR or when storage is unavailable.

export const CONSENT_STORAGE_KEY = "jia_cookie_consent";
// Dispatched by the footer's "ตั้งค่าคุกกี้" link to re-open the banner.
export const OPEN_CONSENT_SETTINGS_EVENT = "jiaaed:open-cookie-settings";

export type ConsentChoice = "granted" | "denied";

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

/**
 * True only after the visitor pressed "ยอมรับทั้งหมด". Gates everything that
 * hands their data to an ad platform — including the server-side Meta CAPI and
 * Google enhanced conversions, which the routes skip unless the request says so.
 */
export function hasMarketingConsent(): boolean {
  return readConsent() === "granted";
}

export function writeConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    /* Storage is optional. */
  }
}

// Written by the consented GoogleTags/MetaPixel scripts (ad-click ids, UTMs,
// the ad-visit fingerprint) — forgotten when consent is withdrawn.
const TRACKING_STORAGE_KEYS = [
  "jiaaed_gclid",
  "jiaaed_gclid_ts",
  "jiaaed_gbraid",
  "jiaaed_wbraid",
  "jiaaed_fbclid",
  "jiaaed_fbclid_ts",
  "jiaaed_fp",
  "jiaaed_utm_source",
  "jiaaed_utm_medium",
  "jiaaed_utm_campaign",
  "jiaaed_utm_term",
  "jiaaed_utm_content",
];

// Cookies set by Google tag (_ga, _ga_<id>, _gid, _gcl_*), Meta Pixel (_fbp,
// _fbc) and PostHog (ph_<key>_posthog).
const TRACKING_COOKIE_RE = /^(_ga|_ga_.+|_gid|_gat.*|_gcl_.+|_fbp|_fbc|ph_.+)$/;

/** Remove the trackers' cookies and stored ids after consent is withdrawn. */
export function clearTrackingData(): void {
  if (typeof document === "undefined") return;
  try {
    for (const key of TRACKING_STORAGE_KEYS) window.localStorage.removeItem(key);
    // PostHog also persists its distinct id in localStorage (ph_<key>_posthog).
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("ph_") || key.startsWith("__ph_")) window.localStorage.removeItem(key);
    }
  } catch {
    /* Storage is optional. */
  }

  // Cookies are scoped to whichever domain the script chose (this host or a
  // parent like .jiaaed.com), so expire each one on every candidate domain.
  const host = window.location.hostname;
  const parts = host.split(".");
  const domains = [""];
  for (let i = 0; i < parts.length - 1; i++) domains.push(`; domain=.${parts.slice(i).join(".")}`);

  for (const pair of document.cookie.split(";")) {
    const name = pair.split("=")[0]?.trim();
    if (!name || !TRACKING_COOKIE_RE.test(name)) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
    }
  }
}
