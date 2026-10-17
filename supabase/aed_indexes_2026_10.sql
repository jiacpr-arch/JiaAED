-- ═══════════════════════════════════════════════════════
-- Jia AED — indexes for the queries the app actually runs (Oct 2026)
-- Additive, safe to re-run. Run in Supabase Dashboard → SQL Editor.
-- The app works without these; they keep the per-request abuse limits and
-- the report/cron queries fast as the tables grow.
-- ═══════════════════════════════════════════════════════

-- Per-IP limits (lib/aed/rate-limit.ts) count recent rows by ip_hash on every
-- lead, event, LINE-click Lead and admin login attempt.
CREATE INDEX IF NOT EXISTS idx_aed_events_ip_ts
  ON aed_analytics_events(ip_hash, created_at DESC)
  WHERE ip_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_aed_leads_ip_ts
  ON aed_leads(ip_hash, created_at DESC)
  WHERE ip_hash IS NOT NULL;

-- Date-range scans: daily digest, admin analytics, weekly review, conversion
-- audit — none of these tables had an index leading with created_at.
CREATE INDEX IF NOT EXISTS idx_aed_leads_ts           ON aed_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aed_conversion_log_ts  ON aed_conversion_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aed_digest_log_kind_ts ON aed_analytics_digest_log(kind, created_at DESC);

-- Duplicate of the UNIQUE(channel, channel_thread_id) constraint's own index.
DROP INDEX IF EXISTS idx_aed_conv_thread;
