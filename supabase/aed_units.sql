-- ═══════════════════════════════════════════════════════
-- Jia AED — Unit registry (per-customer device tracking)
-- Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════
--
-- Mirrors the 11-column Google Sheet schema in docs/rental-ops-kit.md
-- (section 4, "ทะเบียนเครื่อง") — that sheet is the owner's existing manual
-- device registry; this table is the same data, made queryable so the
-- /api/cron/unit-expiry-check cron can alert before a pad or battery expires.
-- Delivers what lib/aed/subscription.ts's PRO/ELITE tiers already market as
-- "แจ้งเตือนแบต / แผ่นแปะหมดอายุ" — previously copy with no code behind it.
--
-- serial_number is intentionally nullable/non-unique: the owner's real
-- consumable-tracking sheet ("รวม pad batt aed หมดอายุ") has no serial number
-- column at all — it's one row per pad-or-battery item against a customer
-- name, not one row per physical unit. Forcing a fabricated serial here would
-- misrepresent real inventory data, so rows without one just leave it blank.

CREATE TABLE IF NOT EXISTS aed_units (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- เลขซีเรียล — optional; fill in later via /admin/units once known.
  serial_number         TEXT,
  -- สถานะ: ว่าง | ปล่อยเช่า | ซ่อม | สำรองอีเวนต์
  status                TEXT NOT NULL DEFAULT 'ว่าง',
  customer_name         TEXT,
  -- ประเภท: รายปี | รายเดือน | รายวัน | (ว่างไว้สำหรับเครื่องที่ซื้อขาด)
  plan_type             TEXT,
  start_date            DATE,
  end_date              DATE,
  rent_amount           NUMERIC,
  deposit_amount        NUMERIC,
  pad_expiry_date       DATE,
  battery_expiry_date   DATE,
  next_inspection_date  DATE,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aed_units_expiry
  ON aed_units(pad_expiry_date, battery_expiry_date);

ALTER TABLE aed_units ENABLE ROW LEVEL SECURITY;

-- Service role only — no anon policy. Customer names and deposit amounts are
-- internal ops data, never public (same posture as aed_leads.sql).
CREATE POLICY "service_role_aed_units"
  ON aed_units
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
