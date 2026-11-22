-- ═══════════════════════════════════════════════════════
-- Jia AED — lead pipeline (/admin/leads)
-- Statuses on aed_leads + a history row per change, so the funnel
-- (lead → qualified → quotation → contract → payment) and revenue per ad
-- campaign can be measured. Additive + backward compatible; safe to re-run.
-- Run BEFORE deploying the code that uses it.
-- ═══════════════════════════════════════════════════════

ALTER TABLE aed_leads ADD COLUMN IF NOT EXISTS status_updated_at  TIMESTAMPTZ;
ALTER TABLE aed_leads ADD COLUMN IF NOT EXISTS quote_value_thb    NUMERIC(12, 2); -- quotation total, ex VAT
ALTER TABLE aed_leads ADD COLUMN IF NOT EXISTS contract_value_thb NUMERIC(12, 2); -- signed contract value, ex VAT
ALTER TABLE aed_leads ADD COLUMN IF NOT EXISTS paid_value_thb     NUMERIC(12, 2); -- money actually received, ex VAT
ALTER TABLE aed_leads ADD COLUMN IF NOT EXISTS lost_reason        TEXT;
ALTER TABLE aed_leads ADD COLUMN IF NOT EXISTS admin_note         TEXT;

-- Keep lib/aed/lead-pipeline.ts LEAD_STATUSES in step with this list.
ALTER TABLE aed_leads DROP CONSTRAINT IF EXISTS aed_leads_status_check;
ALTER TABLE aed_leads ADD CONSTRAINT aed_leads_status_check CHECK (status IN (
  'new', 'contacted', 'qualified_lead', 'quotation_sent',
  'contract_signed', 'payment_received', 'lost', 'spam'
));

-- One row per status change (who did what is the single admin token, so no actor).
CREATE TABLE IF NOT EXISTS aed_lead_events (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id           UUID NOT NULL REFERENCES aed_leads(id) ON DELETE CASCADE,
  from_status       TEXT,
  to_status         TEXT NOT NULL,
  value_thb         NUMERIC(12, 2),
  note              TEXT,
  conversion_status TEXT, -- offline Google Ads upload: sent / skipped_* / failed / null (none for this stage)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aed_lead_events_lead ON aed_lead_events(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aed_lead_events_stage ON aed_lead_events(to_status, created_at DESC);

ALTER TABLE aed_lead_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_aed_lead_events" ON aed_lead_events;
CREATE POLICY "service_role_aed_lead_events" ON aed_lead_events FOR ALL TO service_role USING (true) WITH CHECK (true);
