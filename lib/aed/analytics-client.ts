import { track as vercelTrack } from "@vercel/analytics";

const SESSION_KEY = "jiaaed_session_id";
const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;

function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(SESSION_KEY, sid);
    return sid;
  } catch {
    return null;
  }
}

function readAttribution(): {
  gclid: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
} {
  if (typeof window === "undefined") return { gclid: null, utm_source: null, utm_campaign: null };
  try {
    return {
      gclid: window.localStorage.getItem("jiaaed_gclid"),
      utm_source: window.localStorage.getItem("jiaaed_utm_source"),
      utm_campaign: window.localStorage.getItem("jiaaed_utm_campaign"),
    };
  } catch {
    return { gclid: null, utm_source: null, utm_campaign: null };
  }
}

type Primitive = string | number | boolean | null;

export function trackEvent(
  name: string,
  properties: Record<string, Primitive> = {},
  options: { beacon?: boolean } = {},
) {
  const vercelProps: Record<string, Exclude<Primitive, null>> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (v !== null) vercelProps[k] = v;
  }

  try {
    vercelTrack(name, vercelProps);
  } catch {
    // ignore — Vercel SDK rarely throws
  }

  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    event_name: name,
    properties,
    session_id: getSessionId(),
    page_url: window.location.href,
    referrer: document.referrer || null,
    ...readAttribution(),
  });

  const url = "/api/aed/event";

  if (options.beacon && navigator.sendBeacon) {
    try {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    } catch {
      // fall through to fetch
    }
  }

  void fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // swallow — analytics should never break the page
  });
}

export { UTM_KEYS };
