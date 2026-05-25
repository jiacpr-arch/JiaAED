# Growth Hub (multi-tenant)

The **central-hub** evolution of Growth Kit (model #3). One service runs the
daily digest and weekly AI review for **every** brand, so adding a business is an
`INSERT` — no new deploy.

```
 Site A ─┐
 Site B ─┼─ events ─▶ each brand's own store (growth_events)
 Site C ─┘
                         ┌──────────── GROWTH HUB ────────────┐
   control-plane DB  ───▶│ cron → loadTenants() → for each:    │
   (growth_tenants)      │   resolveGrowthConfig (+env secrets)│
                         │   runDailyDigest / runWeeklyReview  │──▶ each brand's
                         └─────────────────────────────────────┘    LINE/Telegram
```

It **reuses Growth Kit** — `run.ts` just loops tenants and calls the kit's
`runDailyDigest` / `runWeeklyReview`. The kit's `DigestSource` interface is the
seam: set a tenant's `source` to `"supabase"` (default) or `"posthog"` and the
hub reads from the right place without any other change.

## Files

```
growth-hub/
├─ lib/
│  ├─ tenants.ts   # registry loader + resolveGrowthConfig (merges env secrets)
│  └─ run.ts       # runAllDailyDigests / runAllWeeklyReviews (per-tenant isolated)
├─ examples/       # one cron route per schedule, drives all tenants
│  ├─ run-all-daily-cron.ts
│  └─ run-all-weekly-cron.ts
└─ sql/tenants.sql # control-plane registry table
```

## Security: secrets are NOT in the database

`growth_tenants.config` holds only **non-secret** settings (brand, weights,
chat IDs, persona). Per-tenant secrets are resolved from env by convention:

| Need | Env var |
|------|---------|
| Tenant Supabase | `HUB_<ID>_SUPABASE_URL`, `HUB_<ID>_SUPABASE_SERVICE_ROLE_KEY` |
| Tenant PostHog (if `source: "posthog"`) | `HUB_<ID>_POSTHOG_HOST`, `HUB_<ID>_POSTHOG_PROJECT_ID`, `HUB_<ID>_POSTHOG_API_KEY` |
| LINE token | `HUB_<ID>_LINE_TOKEN` |
| Telegram bot token | `HUB_<ID>_TELEGRAM_BOT_TOKEN` |
| Claude (shared) | `ANTHROPIC_API_KEY` |
| Hub control-plane | `HUB_SUPABASE_URL`, `HUB_SUPABASE_SERVICE_ROLE_KEY` |

`<ID>` is the tenant id upper-cased with non-alphanumerics as `_`
(e.g. `pharmroo` → `HUB_PHARMROO_LINE_TOKEN`).

## Add a new business

1. `INSERT` a row into `growth_tenants` (see `sql/tenants.sql` for the shape).
2. Set that tenant's `HUB_<ID>_*` env vars.
3. Done — the next cron run includes it. No deploy.

## Schedule (one cron drives all tenants)

```json
{ "crons": [
  { "path": "/api/cron/run-all-daily",  "schedule": "0 2 * * *" },
  { "path": "/api/cron/run-all-weekly", "schedule": "0 2 * * 1" }
]}
```

> Hot-lead **real-time** alerts are best left at each site's edge (call the kit's
> `ingestEvent` from each site's `/api/event`). The hub centralises the
> **scheduled** digests/reviews, which is where managing many brands hurts most.
