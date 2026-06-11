-- ═══════════════════════════════════════════════════════
-- Migration: add fbclid to aed_leads (Meta/Facebook ad attribution)
-- Run in Supabase Dashboard → SQL Editor on existing deployments.
-- New deployments running aed_leads.sql already include this column.
-- ═══════════════════════════════════════════════════════

ALTER TABLE aed_leads ADD COLUMN IF NOT EXISTS fbclid TEXT;
