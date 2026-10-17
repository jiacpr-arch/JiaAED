-- ═══════════════════════════════════════════════════════
-- Jia AED — add product_model to aed_units
-- Additive + backward compatible. Run BEFORE deploying the API change.
-- ═══════════════════════════════════════════════════════
--
-- The product (pad / battery model) is a real column instead of prose buried
-- in notes, so /admin/units can edit it and the weekly expiry alert can name
-- the exact part to order. Nullable: rows added by hand may not know it yet.
--
-- The one-off backfill that originally followed (forward-filling the owner's
-- Google Sheet import, moving two misfiled batteries out of pad_expiry_date,
-- cleaning the import notes) was applied to production in Oct 2026 and has
-- been removed from this file: it matched rows by customer name, i.e. it put
-- the customer list in a public repository. Never commit customer data here —
-- write one-off data fixes against row ids, run them in the Supabase SQL
-- editor, and keep them out of git.

ALTER TABLE aed_units ADD COLUMN IF NOT EXISTS product_model TEXT;
