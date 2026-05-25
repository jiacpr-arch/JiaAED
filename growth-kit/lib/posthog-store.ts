import type { DigestSource } from "./store";
import type { StoredEvent } from "./types";

export type PostHogSourceOptions = {
  host: string; // e.g. https://us.posthog.com
  projectId: string;
  apiKey: string; // personal API key with query scope
  limit?: number;
};

function asProps(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object") return v as Record<string, unknown>;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

// PostHog rows arrive as [event, properties, timestamp]. Session/UTM/url live in
// the properties JSON; key names below match PostHog's autocapture defaults and
// may need tweaking to match how a given site captures events.
function toStoredEvent(row: unknown[]): StoredEvent {
  const props = asProps(row[1]);
  return {
    event_name: str(row[0]) ?? "",
    properties: props,
    session_id: str(props["$session_id"]),
    page_url: str(props["$current_url"]),
    utm_source: str(props["utm_source"]) ?? str(props["$utm_source"]),
    utm_campaign: str(props["utm_campaign"]) ?? str(props["$utm_campaign"]),
    gclid: str(props["gclid"]) ?? str(props["$gclid"]),
    created_at: str(row[2]) ?? new Date().toISOString(),
  };
}

// A read-only DigestSource backed by PostHog's HogQL query API. Use this for the
// central hub's scheduled digests/reviews when events live in PostHog rather
// than a per-brand Supabase table. (from/to are server-generated ISO strings.)
export function createPostHogDigestSource(opts: PostHogSourceOptions): DigestSource {
  return {
    async rangeEvents(fromISO, toISO) {
      const limit = opts.limit ?? 100000;
      const query = `SELECT event, properties, timestamp FROM events WHERE timestamp >= '${fromISO}' AND timestamp <= '${toISO}' LIMIT ${limit}`;
      const res = await fetch(`${opts.host}/api/projects/${opts.projectId}/query/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${opts.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
      });
      if (!res.ok) {
        console.error("[growth-kit] PostHog query failed:", res.status, await res.text());
        return [];
      }
      const json = (await res.json()) as { results?: unknown[][] };
      return (json.results ?? []).map(toStoredEvent);
    },
  };
}
