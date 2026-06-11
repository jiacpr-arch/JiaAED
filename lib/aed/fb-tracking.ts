// Client-side helpers for Meta (Facebook) attribution. The browser pixel drops
// `_fbp` (and `_fbc` when an fbclid is present) as cookies; we read them here to
// forward to the Conversions API so browser + server events dedupe and match.

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

export type FbTracking = {
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
};

export function readFbTracking(): FbTracking {
  if (typeof window === "undefined") return { fbclid: null, fbc: null, fbp: null };
  try {
    let fbc = readCookie("_fbc");
    const fbclid = localStorage.getItem("jiaaed_fbclid");
    // If the pixel hasn't written _fbc yet but we captured an fbclid, build it
    // in the format Meta expects: fb.1.<timestamp_ms>.<fbclid>.
    if (!fbc && fbclid) {
      const ts = localStorage.getItem("jiaaed_fbclid_ts") || String(Date.now());
      fbc = `fb.1.${ts}.${fbclid}`;
    }
    return { fbclid, fbc, fbp: readCookie("_fbp") };
  } catch {
    return { fbclid: null, fbc: null, fbp: null };
  }
}

// A stable id shared between the browser pixel and the server CAPI call so Meta
// counts them as one event, not two.
export function newEventId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

type Fbq = (...args: unknown[]) => void;

// Fires the browser-side `Lead` event with the shared eventID for dedup.
export function fireMetaLead(eventId: string, value?: number): void {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (typeof fbq !== "function") return;
  const data: Record<string, unknown> = { currency: "THB" };
  if (typeof value === "number") data.value = value;
  fbq("track", "Lead", data, { eventID: eventId });
}
