-- ═══════════════════════════════════════════════════════
-- Jia AED — Analytics events (mirror of Vercel Analytics for our own
-- alerting + daily digest + ad-spend ROI queries)
-- Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aed_analytics_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name   TEXT NOT NULL,
  properties   JSONB NOT NULL DEFAULT '{}'::jsonb,
  session_id   TEXT,
  page_url     TEXT,
  referrer     TEXT,
  user_agent   TEXT,
  ip_hash      TEXT,
  gclid        TEXT,
  utm_source   TEXT,
  utm_campaign TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aed_events_name_ts ON aed_analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aed_events_ts      ON aed_analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aed_events_gclid   ON aed_analytics_events(gclid) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_aed_events_session ON aed_analytics_events(session_id);

-- At most one hot-lead alert per session. Also acts as an atomic dedup gate:
-- concurrent alert inserts for the same session collide (23505) so only one wins
-- and only one LINE notification is sent.
CREATE UNIQUE INDEX IF NOT EXISTS uq_aed_hot_lead_alert_once_per_session
  ON aed_analytics_events(session_id)
  WHERE event_name = 'hot_lead_alert_fired';

ALTER TABLE aed_analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_aed_analytics_events" ON aed_analytics_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Daily digest / cron run log. The UNIQUE(digest_date, kind) constraint is the
-- atomic dedup gate for the notifying crons: Vercel Cron delivery is
-- at-least-once, so a re-fired tick would re-push the whole digest to LINE.
-- claimDailyCronRun() (lib/aed/cron-once.ts) INSERTs a marker row per Bangkok
-- day+kind — the first invocation wins, a duplicate collides here (23505) and
-- returns early without sending. Same trick as the per-session hot-lead index
-- above, so this row must be inserted (not upserted) on the claim path.
CREATE TABLE IF NOT EXISTS aed_analytics_digest_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_date DATE NOT NULL,
  kind        TEXT NOT NULL,
  payload     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (digest_date, kind)
);

ALTER TABLE aed_analytics_digest_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_aed_analytics_digest_log" ON aed_analytics_digest_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);
