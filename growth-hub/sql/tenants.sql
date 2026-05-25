-- Growth Hub — control-plane tenant registry.
-- Run in the HUB's own Supabase project (HUB_SUPABASE_URL).
-- Secrets are NOT stored here — only non-secret config. Tokens/keys are resolved
-- from env per tenant (HUB_<ID>_SUPABASE_URL, HUB_<ID>_LINE_TOKEN, ...).

CREATE TABLE IF NOT EXISTS growth_tenants (
  id         TEXT PRIMARY KEY,            -- e.g. 'pharmroo'
  brand      TEXT NOT NULL,
  enabled    BOOLEAN NOT NULL DEFAULT true,
  config     JSONB NOT NULL,              -- TenantConfig (see lib/tenants.ts)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE growth_tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_growth_tenants" ON growth_tenants
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Adding a new business = INSERT one row + set its HUB_<ID>_* env vars.
-- Example:
-- INSERT INTO growth_tenants (id, brand, config) VALUES (
--   'pharmroo', 'PharmRoo',
--   '{
--     "brand": "PharmRoo",
--     "locale": "th-TH",
--     "timezone": "Asia/Bangkok",
--     "channels": [{ "kind": "telegram", "chatId": "-1001234567890" }],
--     "storeTable": "growth_events",
--     "scoring": {
--       "weights": { "line_click": 5, "lead_form_start": 3, "scroll_depth_75": 2, "engaged_session": 1 },
--       "triggerEvents": ["line_click", "lead_form_start"],
--       "hotThreshold": 7, "lookbackMinutes": 30
--     },
--     "digest": {
--       "conversionEvents": ["line_click", "lead_form_submit"],
--       "funnel": ["engaged_session", "lead_form_start", "lead_form_submit"],
--       "minVisitsForAlert": 50
--     },
--     "llm": { "model": "claude-sonnet-4-5", "maxTokens": 1024, "systemPrompt": "คุณคือนักวิเคราะห์การตลาดของ PharmRoo ..." }
--   }'::jsonb
-- );
