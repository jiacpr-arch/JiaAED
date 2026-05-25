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
--
-- PostHog-backed variant: set "source": "posthog" and provide HUB_<ID>_POSTHOG_*
-- env vars. When the PostHog project also holds unrelated events (e.g. shared
-- with PostHog's own MCP analytics), set "eventAllowlist" so digests only see
-- this brand's web events. Example for JiaAED:
-- INSERT INTO growth_tenants (id, brand, config) VALUES (
--   'jiaaed', 'JiaAED',
--   '{
--     "brand": "JiaAED",
--     "locale": "th-TH",
--     "timezone": "Asia/Bangkok",
--     "channels": [{ "kind": "line", "to": "Uxxxxxxxx" }],
--     "source": "posthog",
--     "eventAllowlist": [
--       "$pageview", "engaged_session", "scroll_depth",
--       "hero_cta_view", "hero_headline_view", "price_view",
--       "line_click", "doc_download", "cta_click",
--       "lead_form_view", "lead_form_start", "lead_form_field_focus",
--       "lead_form_abandon", "lead_form_submit",
--       "web_chat_open", "web_chat_message_sent", "web_chat_reset", "web_chat_contact_click"
--     ],
--     "storeTable": "aed_analytics_events",
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
--     "llm": { "model": "claude-sonnet-4-5", "maxTokens": 1024, "systemPrompt": "คุณคือนักวิเคราะห์การตลาดของ JiaAED ..." }
--   }'::jsonb
-- );
