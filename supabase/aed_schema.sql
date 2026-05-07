-- ═══════════════════════════════════════════════════════
-- Jia AED — Database Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aed_customers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id          TEXT UNIQUE,
  full_name             TEXT,
  phone                 TEXT,
  email                 TEXT,
  company_name          TEXT,
  tax_id                TEXT,
  address               TEXT,
  customer_type         TEXT NOT NULL DEFAULT 'individual', -- individual | corporate | government
  is_company            BOOLEAN NOT NULL DEFAULT FALSE,
  total_orders          INT NOT NULL DEFAULT 0,
  total_lifetime_value  DECIMAL NOT NULL DEFAULT 0,
  preferred_channel     TEXT NOT NULL DEFAULT 'line',
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aed_conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       UUID REFERENCES aed_customers(id) ON DELETE CASCADE,
  channel           TEXT NOT NULL DEFAULT 'line',
  channel_thread_id TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  current_intent    TEXT,
  collected_data    JSONB NOT NULL DEFAULT '{}',
  lead_score        INT NOT NULL DEFAULT 0,
  message_count     INT NOT NULL DEFAULT 0,
  last_message_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(channel, channel_thread_id)
);

CREATE TABLE IF NOT EXISTS aed_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES aed_conversations(id) ON DELETE CASCADE,
  direction        TEXT NOT NULL,
  sender_type      TEXT NOT NULL,
  content_text     TEXT,
  content_data     JSONB,
  ai_tools_used    JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aed_deals (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                   UUID REFERENCES aed_customers(id),
  conversation_id               UUID REFERENCES aed_conversations(id),
  source_channel                TEXT NOT NULL DEFAULT 'line',
  stage                         TEXT NOT NULL DEFAULT 'new',
  product_id                    TEXT NOT NULL,
  quantity                      INT NOT NULL DEFAULT 1,
  unit_price                    DECIMAL,
  total_amount                  DECIMAL,
  vat_amount                    DECIMAL,
  flowaccount_quotation_id      TEXT,
  flowaccount_quotation_number  TEXT,
  flowaccount_receipt_id        TEXT,
  stripe_payment_link_url       TEXT,
  stripe_payment_intent_id      TEXT,
  payment_status                TEXT NOT NULL DEFAULT 'pending',
  paid_at                       TIMESTAMPTZ,
  notes                         TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at                     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS aed_followups (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       UUID REFERENCES aed_customers(id),
  conversation_id   UUID REFERENCES aed_conversations(id),
  deal_id           UUID REFERENCES aed_deals(id),
  scheduled_for     TIMESTAMPTZ NOT NULL,
  message_template  TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aed_conv_thread     ON aed_conversations(channel, channel_thread_id);
CREATE INDEX IF NOT EXISTS idx_aed_msg_conv        ON aed_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aed_deals_stage     ON aed_deals(stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aed_followups_sched ON aed_followups(scheduled_for, status);

-- RLS (service role key bypasses all policies)
ALTER TABLE aed_customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE aed_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE aed_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE aed_deals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE aed_followups     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_aed_customers"     ON aed_customers     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_aed_conversations" ON aed_conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_aed_messages"      ON aed_messages      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_aed_deals"         ON aed_deals         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_aed_followups"     ON aed_followups     FOR ALL TO service_role USING (true) WITH CHECK (true);
