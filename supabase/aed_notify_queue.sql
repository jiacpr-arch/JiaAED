-- ═══════════════════════════════════════════════════════
-- Jia AED — Notify queue (cross-cron LINE message batching)
-- Cron routes enqueue their combined message here instead of pushing to
-- LINE directly; /api/cron/flush-notify-queue debounces and sends all
-- pending rows as a single LINE message once things go quiet.
-- Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aed_notify_queue (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  text       TEXT NOT NULL,
  sent       BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aed_notify_queue_unsent
  ON aed_notify_queue(created_at)
  WHERE sent = FALSE;

ALTER TABLE aed_notify_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_aed_notify_queue" ON aed_notify_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);
