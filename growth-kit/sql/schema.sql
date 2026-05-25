-- Growth Kit — event store. Run in Supabase Dashboard → SQL Editor.
-- One generic events table powers scoring, hot-lead alerts, and digests.

CREATE TABLE IF NOT EXISTS growth_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name   TEXT NOT NULL,
  properties   JSONB NOT NULL DEFAULT '{}'::jsonb,
  session_id   TEXT,
  page_url     TEXT,
  utm_source   TEXT,
  utm_campaign TEXT,
  gclid        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_events_name_ts ON growth_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_growth_events_session ON growth_events(session_id);

-- At most one hot-lead alert per session. This is also the atomic dedup gate:
-- concurrent alert inserts for the same session collide (23505) so only one
-- wins and only one notification is sent. (Distilled from JiaAED PR #37.)
CREATE UNIQUE INDEX IF NOT EXISTS uq_growth_hot_lead_alert_once_per_session
  ON growth_events(session_id)
  WHERE event_name = 'hot_lead_alert_fired';

ALTER TABLE growth_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_growth_events" ON growth_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
