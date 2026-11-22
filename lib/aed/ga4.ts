// ─── GA4: measurement id, client id, and server-side Measurement Protocol ────
// The browser tag (app/components/GoogleTags.tsx) and the server-side follow-up
// events for lead stages share one measurement id.

export const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_ID || "G-4PZZC620E2";

/**
 * GA client id from a `_ga` cookie value: "GA1.1.123456789.1700000000" →
 * "123456789.1700000000". Null for anything else.
 */
export function gaClientIdFromCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(/(?:^|;\s*)_ga=GA\d+\.\d+\.(\d+\.\d+)(?:;|$)/);
  return m ? m[1] : null;
}

/** A client id we accept from a form body: "digits.digits", bounded. */
export function isGaClientId(v: unknown): v is string {
  return typeof v === "string" && /^\d{1,20}\.\d{1,20}$/.test(v);
}

export type Ga4Event = { name: string; params?: Record<string, string | number> };

export type Ga4Result = { ok: true; sent: boolean; reason?: string } | { ok: false; error: string };

/**
 * Send events for one GA client id through the Measurement Protocol. No-op
 * (sent:false) until GA4_API_SECRET is set. Only call this for a visitor who
 * gave marketing consent — the consent block below says so to Google.
 */
export async function sendGa4Events(clientId: string, events: Ga4Event[]): Promise<Ga4Result> {
  const secret = process.env.GA4_API_SECRET;
  if (!secret) return { ok: true, sent: false, reason: "ga4_api_secret_not_set" };
  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(GA4_MEASUREMENT_ID)}&api_secret=${encodeURIComponent(secret)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        consent: { ad_user_data: "GRANTED", ad_personalization: "GRANTED" },
        events,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    // The collect endpoint answers 2xx even for malformed events; a non-2xx is a real failure.
    return res.ok ? { ok: true, sent: true } : { ok: false, error: `http_${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Browser: the visitor's GA client id, only when they gave marketing consent. */
export function readGaClientId(hasConsent: boolean): string | null {
  if (!hasConsent || typeof document === "undefined") return null;
  try {
    return gaClientIdFromCookie(document.cookie);
  } catch {
    return null;
  }
}
