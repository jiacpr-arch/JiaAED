-- ═══════════════════════════════════════════════════════
-- Jia AED — Online orders (Stripe Checkout)
-- One row per paid/pending Checkout session; written only by
-- /api/stripe/webhook (service role). Idempotent on stripe_session_id so a
-- Stripe retry never creates a second order or a second LINE alert.
-- Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aed_orders (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stripe_session_id  TEXT NOT NULL UNIQUE,
  payment_intent_id  TEXT,
  status             TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
  product_id         TEXT NOT NULL,
  units              INT NOT NULL DEFAULT 1,
  credit_thb         NUMERIC(12, 2) NOT NULL DEFAULT 0,  -- deposit/rent credited
  converts_from      TEXT,           -- FLEX subscription this purchase replaces
  net_thb            NUMERIC(12, 2) NOT NULL,
  vat_thb            NUMERIC(12, 2) NOT NULL,
  total_thb          NUMERIC(12, 2) NOT NULL,
  payment_method     TEXT,
  customer_name      TEXT,
  customer_email     TEXT,
  customer_phone     TEXT,
  company_name       TEXT,
  tax_id             TEXT,
  tax_branch         TEXT,
  shipping_address   JSONB,
  billing_address    JSONB,
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aed_orders_created ON aed_orders(created_at DESC);

ALTER TABLE aed_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_aed_orders" ON aed_orders;
CREATE POLICY "service_role_aed_orders" ON aed_orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Refunds made from /admin/billing (2026-11-16)
ALTER TABLE aed_orders ADD COLUMN IF NOT EXISTS refunded_thb NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE aed_orders ADD COLUMN IF NOT EXISTS refunded_at  TIMESTAMPTZ;
