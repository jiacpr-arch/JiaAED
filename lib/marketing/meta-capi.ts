/**
 * Meta Conversion API — server-side event sending
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 *
 * Required env vars:
 *   - NEXT_PUBLIC_META_PIXEL_ID
 *   - META_CAPI_ACCESS_TOKEN
 *   - META_CAPI_TEST_EVENT_CODE (optional, for testing)
 */

import crypto from "crypto";

interface CapiEvent {
  event_name: "Lead" | "Purchase" | "CompleteRegistration" | "Contact";
  event_time?: number; // unix seconds
  event_id?: string; // for deduplication with Pixel
  action_source?: "website" | "chat" | "system_generated";
  user_data: {
    em?: string; // sha256 hashed email
    ph?: string; // sha256 hashed phone (digits only, no +)
    fn?: string; // sha256 hashed first name (lowercased)
    ln?: string; // sha256 hashed last name (lowercased)
    external_id?: string; // sha256 hashed customer id
    fbc?: string; // _fbc cookie value
    fbp?: string; // _fbp cookie value
    client_ip_address?: string;
    client_user_agent?: string;
  };
  custom_data?: Record<string, unknown>;
}

function hash(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function hashPhone(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined;
  // strip non-digits, drop leading 0 for Thai numbers
  const digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  return crypto.createHash("sha256").update(digits).digest("hex");
}

export interface SendCapiInput {
  eventName: CapiEvent["event_name"];
  eventId?: string;
  actionSource?: CapiEvent["action_source"];
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  externalId?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  customData?: Record<string, unknown>;
  value?: number;
  currency?: string;
}

export async function sendMetaCapiEvent(input: SendCapiInput): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    return; // not configured — silently skip
  }

  const [firstName, ...rest] = (input.fullName ?? "").trim().split(/\s+/);
  const lastName = rest.join(" ");

  const event: CapiEvent = {
    event_name: input.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: input.actionSource ?? "system_generated",
    user_data: {
      em: hash(input.email ?? undefined),
      ph: hashPhone(input.phone ?? undefined),
      fn: hash(firstName || undefined),
      ln: hash(lastName || undefined),
      external_id: hash(input.externalId ?? undefined),
      fbc: input.fbc ?? undefined,
      fbp: input.fbp ?? undefined,
      client_ip_address: input.ipAddress ?? undefined,
      client_user_agent: input.userAgent ?? undefined,
    },
    custom_data: {
      ...input.customData,
      ...(input.value !== undefined ? { value: input.value } : {}),
      ...(input.currency ? { currency: input.currency } : {}),
    },
  };

  const body: Record<string, unknown> = { data: [event] };
  const testCode = process.env.META_CAPI_TEST_EVENT_CODE;
  if (testCode) body.test_event_code = testCode;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) {
      const text = await response.text();
      console.error("[Meta CAPI] non-2xx:", response.status, text);
    }
  } catch (err) {
    console.error("[Meta CAPI] fetch error:", err);
  }
}
