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

-- ─── Fulfilment tracking (16 พ.ย. 2026) ───────────────────────────────────────
-- After payment: ใหม่ → โทรยืนยันแล้ว → ส่ง/ติดตั้งแล้ว → ออกใบกำกับแล้ว.
-- A daily cron (/api/cron/order-followups) nudges the team on LINE when an
-- order sits in a stage > 24 h, and 7 days / 11 months after delivery to
-- follow the customer up (lib/aed/order-fulfillment.ts).
ALTER TABLE aed_orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE aed_orders ADD COLUMN IF NOT EXISTS stage_changed_at   TIMESTAMPTZ;
ALTER TABLE aed_orders ADD COLUMN IF NOT EXISTS confirmed_at       TIMESTAMPTZ;
ALTER TABLE aed_orders ADD COLUMN IF NOT EXISTS delivered_at       TIMESTAMPTZ;
ALTER TABLE aed_orders ADD COLUMN IF NOT EXISTS invoiced_at        TIMESTAMPTZ;
ALTER TABLE aed_orders ADD COLUMN IF NOT EXISTS unit_serials       TEXT;
ALTER TABLE aed_orders ADD COLUMN IF NOT EXISTS fulfillment_note   TEXT;
ALTER TABLE aed_orders ADD COLUMN IF NOT EXISTS followup_d7_at     TIMESTAMPTZ;
ALTER TABLE aed_orders ADD COLUMN IF NOT EXISTS followup_m11_at    TIMESTAMPTZ;
ALTER TABLE aed_orders ADD COLUMN IF NOT EXISTS confirmation_emailed_at TIMESTAMPTZ;
DO $$ BEGIN
  ALTER TABLE aed_orders ADD CONSTRAINT aed_orders_fulfillment_status_check
    CHECK (fulfillment_status IN ('new', 'confirmed', 'delivered', 'invoiced'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
