-- ═══════════════════════════════════════════════════════
-- Jia AED — Monthly card billing for rental / rent-to-own customers
-- One row per Stripe subscription (created from /admin/billing), plus one row
-- per paid/failed invoice so instalment counts and LINE alerts are idempotent
-- under Stripe webhook retries. Written only by /api/stripe/webhook.
-- Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aed_rental_billing (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id   TEXT,
  checkout_session_id  TEXT,
  plan_id              TEXT NOT NULL,
  units                INT NOT NULL DEFAULT 1,
  status               TEXT NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'past_due', 'completed', 'canceled')),
  months_total         INT,            -- NULL = open-ended (FLEX)
  installments_paid    INT NOT NULL DEFAULT 0,
  monthly_total_thb    NUMERIC(12, 2),
  customer_name        TEXT,
  company_name         TEXT,
  customer_email       TEXT,
  customer_phone       TEXT,
  contract_ref         TEXT,
  ends_at              TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aed_rental_billing_invoices (
  id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stripe_invoice_id      TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  status                 TEXT NOT NULL CHECK (status IN ('paid', 'failed')),
  amount_thb             NUMERIC(12, 2) NOT NULL,
  counts_as_installment  BOOLEAN NOT NULL DEFAULT FALSE,
  attempt                INT NOT NULL DEFAULT 1,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (stripe_invoice_id, status, attempt)
);

CREATE INDEX IF NOT EXISTS idx_aed_rental_billing_invoices_sub
  ON aed_rental_billing_invoices(stripe_subscription_id);

ALTER TABLE aed_rental_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE aed_rental_billing_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_aed_rental_billing" ON aed_rental_billing;
CREATE POLICY "service_role_aed_rental_billing" ON aed_rental_billing
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_aed_rental_billing_invoices" ON aed_rental_billing_invoices;
CREATE POLICY "service_role_aed_rental_billing_invoices" ON aed_rental_billing_invoices
  FOR ALL TO service_role USING (true) WITH CHECK (true);
