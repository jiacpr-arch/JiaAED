-- ═══════════════════════════════════════════════════════
-- Jia AED — Ad visit tracking (for offline conversion attribution)
-- Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aed_ad_visits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gclid         TEXT,
  gbraid        TEXT,
  wbraid        TEXT,
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  utm_term      TEXT,
  utm_content   TEXT,
  page_url      TEXT,
  referrer      TEXT,
  user_agent    TEXT,
  ip_hash       TEXT,
  fingerprint   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aed_ad_visits_gclid ON aed_ad_visits(gclid) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_aed_ad_visits_fp ON aed_ad_visits(fingerprint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aed_ad_visits_ts ON aed_ad_visits(created_at DESC);

ALTER TABLE aed_ad_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_aed_ad_visits" ON aed_ad_visits FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Conversion log — record what we sent to Google Ads
CREATE TABLE IF NOT EXISTS aed_conversion_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversion_action   TEXT NOT NULL,
  match_strategy      TEXT NOT NULL, -- 'gclid' | 'enhanced' | 'gbraid' | 'wbraid'
  gclid               TEXT,
  email_hash          TEXT,
  phone_hash          TEXT,
  order_id            TEXT,
  value_micros        BIGINT,
  currency            TEXT,
  conversion_date_time TEXT,
  status              TEXT NOT NULL, -- 'sent' | 'skipped_no_creds' | 'failed'
  response_summary    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aed_conversion_log_status ON aed_conversion_log(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aed_conversion_log_order ON aed_conversion_log(order_id);

ALTER TABLE aed_conversion_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_aed_conversion_log" ON aed_conversion_log FOR ALL TO service_role USING (true) WITH CHECK (true);
