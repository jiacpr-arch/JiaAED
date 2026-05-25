# Growth Kit

A config-driven, brand-agnostic distillation of the JiaAED system:

```
track event → store → score lead → alert hot leads on chat
                   └→ cron → build digest → (AI) analyse → push to chat
```

This is the **Template** model: clone it per project and change one config file.
Everything is driven by `growth.config.ts` — events, point weights, copy,
channels, and the data store.

## File map

```
growth-kit/
├─ growth.config.example.ts   # the ONLY file you edit per brand
├─ lib/
│  ├─ types.ts                # GrowthConfig + event/score types
│  ├─ scoring.ts              # per-session lead scoring + hot-lead message
│  ├─ store.ts                # Supabase data layer (atomic dedup gate)
│  ├─ digest.ts               # build + format a digest from events
│  ├─ analyze.ts              # Claude turns metrics → Thai recommendations
│  ├─ notify.ts               # fan-out to LINE + Telegram
│  └─ index.ts                # ingestEvent / runDailyDigest / runWeeklyReview
├─ examples/                  # copy these into your app's app/ dir
│  ├─ event-route.ts
│  ├─ daily-digest-cron.ts
│  └─ weekly-review-cron.ts
├─ sql/schema.sql             # events table + hot-lead dedup index
└─ .env.example
```

## Setup (per new brand)

1. Copy `growth-kit/` into a Next.js project (deps: `@supabase/supabase-js`,
   `@anthropic-ai/sdk`).
2. Run `sql/schema.sql` in the project's Supabase SQL Editor.
3. Copy `growth.config.example.ts` → `growth.config.ts` and edit it (brand,
   weights, conversion events, channels, LLM persona).
4. Copy the files in `examples/` into `app/` (e.g. `app/api/event/route.ts`)
   and change the import to `@/growth.config`.
5. Fill `.env` from `.env.example`.
6. Schedule the crons in `vercel.json`:
   ```json
   { "crons": [
     { "path": "/api/cron/daily-digest",  "schedule": "0 2 * * *" },
     { "path": "/api/cron/weekly-review", "schedule": "0 2 * * 1" }
   ]}
   ```
7. Track events from the browser by `POST`ing to `/api/event` with
   `{ eventName, sessionId, pageUrl, properties, utmSource, utmCampaign, gclid }`.

## Channels

`config.channels` takes any mix of LINE and Telegram. Each gets the same plain
text; a channel with missing credentials is skipped (it never blocks the rest).

## The dedup guarantee

`store.recordAlert` is the atomic gate: a partial unique index on `session_id`
(where `event_name = 'hot_lead_alert_fired'`) means two concurrent trigger
events for the same session collide — exactly one wins, so a session is alerted
**at most once**, even under load. This is the JiaAED PR #37 fix, baked in.

## Graduating to a central hub (multi-tenant)

When you run many brands, swap the per-project copies for one **hub**: each site
sends events to a shared store (or PostHog) tagged with a `project_id`; the hub
loops over a `tenants` table and runs `runDailyDigest` / `runWeeklyReview` per
brand, pushing to that brand's channel. The `Store` interface in `lib/store.ts`
is the seam — add a PostHog-backed implementation and the rest is unchanged.
