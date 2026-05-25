import type { DigestSource } from "./store";
import type { StoredEvent } from "./types";

export type PostHogSourceOptions = {
  host: string; // e.g. https://us.posthog.com
  projectId: string;
  apiKey: string; // personal API key with query scope
  limit?: number;
};

function str(v: unknown): string | null {
  return typeof v === "string" && v !== "" ? v : null;
}

// Rows arrive cherry-picked as
// [event, $session_id, $current_url, utm_source, utm_campaign, gclid, timestamp].
function toStoredEvent(row: unknown[]): StoredEvent {
  return {
    event_name: str(row[0]) ?? "",
    properties: null,
    session_id: str(row[1]),
    page_url: str(row[2]),
    utm_source: str(row[3]),
    utm_campaign: str(row[4]),
    gclid: str(row[5]),
    created_at: str(row[6]) ?? new Date().toISOString(),
  };
}

// A read-only DigestSource backed by PostHog's HogQL query API. Use it for the
// central hub's scheduled digests/reviews when events live in PostHog rather
// than a per-brand Supabase table.
//
// Notes (validated against PostHog's query API):
// - ISO timestamps must be wrapped in parseDateTimeBestEffort(); a bare string
//   literal compared to `timestamp` errors. from/to are server-generated.
// - Properties are cherry-picked (not the whole blob) to avoid huge payloads.
//   The $-prefixed keys are PostHog autocapture defaults — adjust them to match
//   how a given site actually captures session/UTM if different.
// - For very high-volume tenants, paginate with LIMIT/OFFSET or pre-aggregate in
//   HogQL instead of pulling raw rows.
export function createPostHogDigestSource(opts: PostHogSourceOptions): DigestSource {
  return {
    async rangeEvents(fromISO, toISO) {
      const limit = opts.limit ?? 50000;
      const query =
        `SELECT event, properties.$session_id, properties.$current_url, ` +
        `properties.utm_source, properties.utm_campaign, properties.gclid, timestamp ` +
        `FROM events ` +
        `WHERE timestamp >= parseDateTimeBestEffort('${fromISO}') ` +
        `AND timestamp <= parseDateTimeBestEffort('${toISO}') ` +
        `LIMIT ${limit}`;
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
