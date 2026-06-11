import { createHash } from "crypto";

// Meta Conversions API (server-side) — mirrors the role of lib/aed/google-ads.ts
// for Facebook/Instagram ads. Sends the `Lead` event server-to-server so it
// survives iOS/ad-blocker loss of the browser pixel. Dedupes against the
// browser pixel via a shared `event_id`.
//
// Safe no-op until NEXT_PUBLIC_META_PIXEL_ID + META_CAPI_TOKEN are configured —
// callers can fire it unconditionally even before a pixel exists.

const GRAPH_VERSION = "v21.0";

export type MetaLeadInput = {
  eventId: string; // shared with the browser pixel for dedup
  eventTime?: number; // unix seconds; defaults to now
  email?: string | null;
  phone?: string | null;
  fbc?: string | null; // _fbc cookie ("fb.1.<ts>.<fbclid>")
  fbp?: string | null; // _fbp cookie
  clientIp?: string | null;
  userAgent?: string | null;
  eventSourceUrl?: string | null;
  valueThb?: number;
  contentName?: string | null;
};

export type MetaLeadResult =
  | { ok: true; sent: true; eventsReceived?: number }
  | { ok: true; sent: false; reason: string }
  | { ok: false; sent: false; error: string };

export function isMetaConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID && process.env.META_CAPI_TOKEN);
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  // Meta expects digits only including country code, no "+" or symbols.
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return `66${digits.slice(1)}`;
  if (digits.length === 9) return `66${digits}`;
  return digits;
}

// Builds the hashed user_data block. Meta requires SHA-256 of normalized PII;
// IP and user-agent are sent in the clear (Meta hashes them server-side).
function buildUserData(i: MetaLeadInput): Record<string, unknown> {
  const ud: Record<string, unknown> = {};
  if (i.email) ud.em = [sha256(normalizeEmail(i.email))];
  if (i.phone) {
    const norm = normalizePhone(i.phone);
    if (norm) ud.ph = [sha256(norm)];
  }
  if (i.fbc) ud.fbc = i.fbc;
  if (i.fbp) ud.fbp = i.fbp;
  if (i.clientIp) ud.client_ip_address = i.clientIp;
  if (i.userAgent) ud.client_user_agent = i.userAgent;
  return ud;
}

export async function sendMetaLeadEvent(input: MetaLeadInput): Promise<MetaLeadResult> {
  if (!isMetaConfigured()) {
    return { ok: true, sent: false, reason: "meta_not_configured" };
  }

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID as string;
  const token = process.env.META_CAPI_TOKEN as string;
  const testCode = process.env.META_TEST_EVENT_CODE || undefined;

  const userData = buildUserData(input);
  // Without at least one identifier Meta can't attribute the conversion.
  const hasIdentifier = Boolean(
    userData.em || userData.ph || userData.fbc || userData.fbp || userData.client_ip_address,
  );
  if (!hasIdentifier) {
    return { ok: true, sent: false, reason: "no_identifier" };
  }

  const customData: Record<string, unknown> = { currency: "THB" };
  if (typeof input.valueThb === "number") customData.value = input.valueThb;
  if (input.contentName) customData.content_name = input.contentName;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: "Lead",
        event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        user_data: userData,
        custom_data: customData,
      },
    ],
    ...(testCode ? { test_event_code: testCode } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = (await res.json().catch(() => ({}))) as {
      events_received?: number;
      error?: { message?: string };
    };
    if (!res.ok || json.error) {
      return { ok: false, sent: false, error: json.error?.message || `http_${res.status}` };
    }
    return { ok: true, sent: true, eventsReceived: json.events_received };
  } catch (e) {
    return { ok: false, sent: false, error: e instanceof Error ? e.message : String(e) };
  }
}
