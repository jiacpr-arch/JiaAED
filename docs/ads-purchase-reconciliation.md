# AED purchase reconciliation

Apply `supabase/aed_ads_delivery.sql` before enabling `OPENAI_ADS_WEBHOOK_ENABLED=true` on the checkout service. Keep the current CAPI key and Pixel configuration. Test the signed Stripe webhook endpoint for checkout.session.completed and checkout.session.async_payment_succeeded before release. Use a test-mode checkout to verify payment operations; test payments never reach Ads. Keep this flag off until the consent and retention checks below pass on the deployed hosts.

On each Bangkok reporting day, use the restricted service role to run:

```sql
select * from public.aed_ads_daily order by paid_day desc limit 30;
```

Compare paid sessions and baht against Stripe for this storefront, using payment date rather than checkout creation date. API acceptance records delivery acknowledgment. Compare attributed purchases and value separately in Ads Manager using the same currency, dates, click/view windows and reporting date basis. Keep missing attribution unavailable. A difference between paid and bound sessions can include older sessions, missing consent, private browsing or a failed receipt write. For retry alerts inspect awaiting_acceptance and Stripe webhook redelivery. Ads data is never necessary to complete payment.

Before enabling in production, verify decline, withdrawal, cross-host navigation, reopening a paid checkout, delayed payment without returning, and duplicate delivery. Consent changes that cannot reach the server immediately are retried by the browser. A request already in flight cannot be recalled. Restrict access to these ledger tables and set retention for unsent attribution and expired receipts according to the storefront's approved policy. For real attribution, reconcile one genuine consented order without initiating a charge for testing.

Schedule a daily service-role call to `public.aed_ads_delivery_op('cleanup', '{}'::jsonb)` when enabling the database migration. This clears outstanding click tokens after two days and prunes unbound receipts past the cookie lifetime.
