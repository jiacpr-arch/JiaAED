-- ═══════════════════════════════════════════════════════
-- Jia AED — Admin-uploaded documents (Supabase Storage)
-- Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

-- Storage bucket (public read, service-role write).
-- If the bucket already exists this is a no-op.
INSERT INTO storage.buckets (id, name, public)
VALUES ('aed-documents', 'aed-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Metadata table for documents uploaded by admins via the website.
CREATE TABLE IF NOT EXISTS aed_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL DEFAULT 'other',
  storage_path  TEXT NOT NULL UNIQUE,
  public_url    TEXT NOT NULL,
  mime          TEXT NOT NULL,
  size_bytes    BIGINT NOT NULL,
  language      TEXT NOT NULL DEFAULT 'th',
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aed_docs_category  ON aed_documents(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aed_docs_published ON aed_documents(is_published, created_at DESC);

ALTER TABLE aed_documents ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, but be explicit.
CREATE POLICY "service_role_aed_documents"
  ON aed_documents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anyone to read published documents (used if you ever build a public listing query).
CREATE POLICY "anon_read_published"
  ON aed_documents
  FOR SELECT
  TO anon
  USING (is_published = true);
