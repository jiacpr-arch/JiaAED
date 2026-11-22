-- ═══════════════════════════════════════════════════════
-- Jia AED — identifiers for reporting lead stages to GA4 and Meta
-- When a lead moves along the pipeline (/admin/leads), the server reports the
-- stage to GA4 (Measurement Protocol, by GA client id) and Meta (Conversions
-- API, by fbc/fbp + hashed contact). These are captured on the form ONLY with
-- the visitor's marketing consent, and marketing_consent records that choice.
-- They are marketing data: lib/aed/data-retention.ts clears them after 13
-- months like gclid/fbclid. Additive + backward compatible; safe to re-run.
-- Run BEFORE deploying the code that writes them.
-- ═══════════════════════════════════════════════════════

ALTER TABLE aed_leads ADD COLUMN IF NOT EXISTS ga_client_id      TEXT;    -- from the _ga cookie, e.g. "123456789.1700000000"
ALTER TABLE aed_leads ADD COLUMN IF NOT EXISTS fbc               TEXT;    -- _fbc cookie
ALTER TABLE aed_leads ADD COLUMN IF NOT EXISTS fbp               TEXT;    -- _fbp cookie
ALTER TABLE aed_leads ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT FALSE;
