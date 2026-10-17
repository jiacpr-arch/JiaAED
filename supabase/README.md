# Supabase schema

These files are applied by hand in the Supabase Dashboard → SQL Editor (there
is no migration runner). Each one is safe to re-run: tables, columns and
indexes use `IF NOT EXISTS`, and every policy is dropped before it is
re-created.

To build a fresh database, run them in this order:

1. `aed_schema.sql` — LINE bot: customers, conversations, messages, deals, follow-ups
2. `aed_leads.sql`, then `aed_leads_fbclid.sql` and `aed_leads_unit_count.sql`
3. `aed_analytics_events.sql` — events + the cron run/dedup log
4. `aed_ad_visits.sql` — ad visits + Google Ads conversion log
5. `aed_notify_queue.sql`
6. `aed_documents.sql`
7. `aed_news.sql`
8. `aed_units.sql`, then `aed_units_product_model.sql`
9. `aed_indexes_2026_10.sql`

Rules:

- **Never commit customer data** (names, phone numbers, emails) — this
  repository is public and mirrored. Write one-off data fixes against row ids,
  run them in the SQL editor, and keep them out of git.
- Every table has RLS enabled with a `service_role`-only policy (plus read-only
  `anon` policies for published documents and visible news). Keep it that way
  for anything holding personal data.
- When code starts writing a new column, add an additive `ALTER TABLE … ADD
  COLUMN IF NOT EXISTS` file and run it *before* deploying the code.
