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

ALTER TABLE aed_analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_aed_analytics_events" ON aed_analytics_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Optional: daily digest log (so we don't re-send a digest if cron retries)
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
