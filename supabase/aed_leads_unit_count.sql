-- ═══════════════════════════════════════════════════════
-- Jia AED — add unit_count to aed_leads (quote form: 1 / 2–10 / >10)
-- Additive + backward compatible. Run BEFORE deploying the API change.
-- ═══════════════════════════════════════════════════════

ALTER TABLE aed_leads ADD COLUMN IF NOT EXISTS unit_count TEXT;

-- Organization name reuses the existing company_name column — no new column.
