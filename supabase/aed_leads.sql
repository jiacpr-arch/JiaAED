-- ═══════════════════════════════════════════════════════
-- Jia AED — Leads (web form / web chat capture)
-- Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aed_leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source        TEXT NOT NULL DEFAULT 'lead_form',
  full_name     TEXT,
  phone         TEXT,
  email         TEXT,
  company_name  TEXT,
  product_id    TEXT,
  message       TEXT,
  gclid         TEXT,
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  utm_term      TEXT,
  utm_content   TEXT,
  page_url      TEXT,
  user_agent    TEXT,
  ip_hash       TEXT,
  status        TEXT NOT NULL DEFAULT 'new',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aed_leads_status ON aed_leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aed_leads_email  ON aed_leads(email);
CREATE INDEX IF NOT EXISTS idx_aed_leads_phone  ON aed_leads(phone);

ALTER TABLE aed_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_aed_leads" ON aed_leads FOR ALL TO service_role USING (true) WITH CHECK (true);
