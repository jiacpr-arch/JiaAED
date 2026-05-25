-- ═══════════════════════════════════════════════════════
-- Jia AED — Daily news feed (curated from Google News RSS)
-- Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════
--
-- Items are auto-published (hidden = false) by the cron job
-- /api/cron/news-feed. The admin page can flip `hidden` to true
-- to pull an item off the public /news page (the "hide" button).
--
-- We store only a link out to the original article plus OUR OWN
-- short awareness note. We never copy the publisher's article body
-- or images (copyright), so there are no large text/blob columns here.

CREATE TABLE IF NOT EXISTS aed_news_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stable dedup key (RSS <guid> or the link). Unique so re-runs are idempotent.
  guid          TEXT NOT NULL UNIQUE,
  -- Original headline, shown small for reference only; we link out to read it.
  source_title  TEXT NOT NULL,
  -- Link to the original article (Google News redirect → publisher).
  source_url    TEXT NOT NULL,
  -- Publisher name parsed from the RSS feed.
  source_name   TEXT,
  -- Short topic label chosen by the curator (e.g. "หัวใจหยุดเต้นเฉียบพลัน").
  topic         TEXT,
  -- OUR original awareness note (Thai). This is what we display, not the news body.
  our_blurb     TEXT NOT NULL,
  -- Publish time from the feed (may be null if the feed omits it).
  published_at  TIMESTAMPTZ,
  -- Moderation flag: the admin "hide" button sets this to true.
  hidden        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aed_news_visible
  ON aed_news_items(hidden, published_at DESC NULLS LAST, created_at DESC);

ALTER TABLE aed_news_items ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, but be explicit (cron + admin use it).
CREATE POLICY "service_role_aed_news_items"
  ON aed_news_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anyone may read items that are not hidden (powers the public /news page).
CREATE POLICY "anon_read_visible_news"
  ON aed_news_items
  FOR SELECT
  TO anon
  USING (hidden = false);
