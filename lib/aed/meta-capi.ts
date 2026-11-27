import { createHash } from "crypto";
import { phoneE164Digits } from "./phone";

// Meta Conversions API (server-side) — mirrors the role of lib/aed/google-ads.ts
// for Facebook/Instagram ads. Sends the `Lead` event server-to-server so it
// survives iOS/ad-blocker loss of the browser pixel. Dedupes against the
// browser pixel via a shared `event_id`.
//
// Safe no-op until NEXT_PUBLIC_META_PIXEL_ID + META_CAPI_TOKEN are configured —
// callers can fire it unconditionally even before a pixel exists.

const GRAPH_VERSION = "v21.0";

export type MetaLeadInput = {
  /** "Lead" (default — sends Lead + CompleteRegistration) or "Contact" for a LINE click. */
  eventName?: "Lead" | "Contact";
  leadOnly?: boolean;
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

// Meta expects digits only including country code, no "+" or symbols.
function normalizePhone(phone: string): string | null {
  return phoneE164Digits(phone);
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

  const eventTime = input.eventTime ?? Math.floor(Date.now() / 1000);
  const baseEvent = {
    event_time: eventTime,
    action_source: "website",
    ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
    user_data: userData,
    custom_data: customData,
  };

  // A form lead goes out as BOTH standard events: ad sets in this account
  // optimise for CompleteRegistration while our canonical event is Lead, so
  // whichever an ad set targets, the signal arrives (event_id is per
  // event_name, so pixel dedup still works). A LINE click is a "Contact", not a
  // lead (owner, 22 พ.ย. 2026) — it must not feed Lead-optimised ad sets.
  const names = input.eventName === "Contact" ? ["Contact"] : input.leadOnly ? ["Lead"] : ["Lead", "CompleteRegistration"];
  const payload: Record<string, unknown> = {
    data: names.map((event_name) => ({ event_name, event_id: input.eventId, ...baseEvent })),
    ...(testCode ? { test_event_code: testCode } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
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

// ─── Lead-stage follow-up events (CRM) ───────────────────────────────────────
// When the team moves a web lead along /admin/leads, report the stage as a
// CRM event (action_source "system_generated"), matched by the visitor's
// fbc/fbp and hashed phone/email. Only for leads that gave marketing consent.
export type MetaStageInput = {
  eventName: string; // e.g. "QualifiedLead", "Subscribe"
  eventId: string; // stable per lead + stage, so retries dedupe
  email?: string | null;
  phone?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  valueThb?: number;
  leadSource?: string | null;
};

export async function sendMetaStageEvent(input: MetaStageInput): Promise<MetaLeadResult> {
  if (!isMetaConfigured()) return { ok: true, sent: false, reason: "meta_not_configured" };
  const userData = buildUserData({ eventId: input.eventId, email: input.email, phone: input.phone, fbc: input.fbc, fbp: input.fbp });
  if (!(userData.em || userData.ph || userData.fbc || userData.fbp)) {
    return { ok: true, sent: false, reason: "no_identifier" };
  }
  const customData: Record<string, unknown> = { currency: "THB", lead_event_source: "jiaaed_admin" };
  if (typeof input.valueThb === "number") customData.value = input.valueThb;
  if (input.leadSource) customData.content_name = input.leadSource;

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID as string;
  const token = process.env.META_CAPI_TOKEN as string;
  const testCode = process.env.META_TEST_EVENT_CODE || undefined;
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          data: [
            {
              event_name: input.eventName,
              event_id: input.eventId,
              event_time: Math.floor(Date.now() / 1000),
              action_source: "system_generated",
              user_data: userData,
              custom_data: customData,
            },
          ],
          ...(testCode ? { test_event_code: testCode } : {}),
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    const json = (await res.json().catch(() => ({}))) as { events_received?: number; error?: { message?: string } };
    if (!res.ok || json.error) return { ok: false, sent: false, error: json.error?.message || `http_${res.status}` };
    return { ok: true, sent: true, eventsReceived: json.events_received };
  } catch (e) {
    return { ok: false, sent: false, error: e instanceof Error ? e.message : String(e) };
  }
}
