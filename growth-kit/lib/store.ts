import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  HOT_LEAD_ALERT_EVENT,
  type EventInput,
  type GrowthConfig,
  type SessionScore,
  type StoredEvent,
} from "./types";

const SELECT_COLS =
  "event_name, properties, session_id, page_url, utm_source, utm_campaign, gclid, created_at";

// Read side needed for digests / weekly reviews. Both Supabase and PostHog can
// implement this, so the central hub can read from either.
export interface DigestSource {
  rangeEvents(fromISO: string, toISO: string): Promise<StoredEvent[]>;
}

// Full store adds the real-time edge path (event ingest + atomic hot-lead gate).
// This stays Supabase-backed on purpose: PostHog can't enforce the dedup
// uniqueness, nor serve just-written events without ingestion lag.
export interface Store extends DigestSource {
  insertEvent(e: EventInput): Promise<void>;
  sessionEvents(sessionId: string, sinceISO: string): Promise<StoredEvent[]>;
  alreadyAlerted(sessionId: string, sinceISO: string): Promise<boolean>;
  // Atomic dedup gate. Returns true only if THIS call inserted the alert row.
  // Relies on a partial unique index on (session_id) WHERE
  // event_name = 'hot_lead_alert_fired' (see sql/schema.sql) so concurrent
  // requests for the same session collide and only one wins.
  recordAlert(sessionId: string, score: SessionScore): Promise<boolean>;
}

export function createSupabaseStore(cfg: GrowthConfig): Store {
  const { url, serviceRoleKey, table } = cfg.store;
  const sb: SupabaseClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return {
    async insertEvent(e) {
      const { error } = await sb.from(table).insert({
        event_name: e.eventName,
        properties: e.properties ?? {},
        session_id: e.sessionId,
        page_url: e.pageUrl ?? null,
        utm_source: e.utmSource ?? null,
        utm_campaign: e.utmCampaign ?? null,
        gclid: e.gclid ?? null,
      });
      if (error) console.error("[growth-kit] insertEvent failed:", error);
    },

    async sessionEvents(sessionId, sinceISO) {
      const { data } = await sb
        .from(table)
        .select(SELECT_COLS)
        .eq("session_id", sessionId)
        .gte("created_at", sinceISO)
        .order("created_at", { ascending: true });
      return (data ?? []) as StoredEvent[];
    },

    async alreadyAlerted(sessionId, sinceISO) {
      const { data } = await sb
        .from(table)
        .select("session_id")
        .eq("session_id", sessionId)
        .eq("event_name", HOT_LEAD_ALERT_EVENT)
        .gte("created_at", sinceISO)
        .limit(1);
      return !!data && data.length > 0;
    },

    async recordAlert(sessionId, score) {
      const { error } = await sb.from(table).insert({
        event_name: HOT_LEAD_ALERT_EVENT,
        properties: { score: score.score, reasons: score.reasons, events: score.events },
        session_id: sessionId,
        utm_source: score.utmSource,
        utm_campaign: score.utmCampaign,
      });
      if (!error) return true;
      if (error.code === "23505") return false; // already alerted / lost the race
      console.error("[growth-kit] recordAlert failed:", error);
      return false;
    },

    async rangeEvents(fromISO, toISO) {
      const { data } = await sb
        .from(table)
        .select(SELECT_COLS)
        .gte("created_at", fromISO)
        .lte("created_at", toISO);
      return (data ?? []) as StoredEvent[];
    },
  };
}
