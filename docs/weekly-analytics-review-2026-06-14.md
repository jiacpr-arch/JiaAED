# Weekly Analytics Review — 8–14 Jun 2026

Source of truth: `aed_*` tables in the `jia-unified` Supabase project, week window
`2026-06-08 → 2026-06-14`. This review re-grounds the auto-generated LINE digest
against the raw data, corrects two wrong conclusions in it, and records the fixes
shipped this week.

## Verified KPIs (raw data, not the digest's estimates)

| Metric | Value | Note |
| --- | --- | --- |
| Ad visits (`aed_ad_visits`) | 336 | 102 with `gclid`, 179 with `utm`, 57 no attribution |
| `lead_form_view` | 138 | 82 on the ads page (`ads_mini`), 35 home mini, 14 full, 7 rental |
| `lead_form_start` | 3 | **all 3 on the ads page**; home/full/rental = 0 starts |
| `lead_form_submit` | 1 | stored lead: `source = ads_mini_form` |
| `line_click` | 171 | see breakdown below |
| LINE chats started (`aed_conversations`) | **1** | only 4 inbound messages all week |
| Stored leads | 1 | the ads-page mini-form submit |

## What the auto-digest got wrong

1. **"Lead form อาจมี bug / form ไม่ทำงาน" — false.** The form works. One submit
   reached `aed_leads`, and the `lead_form_view → start → submit` events fire
   correctly. The problem is volume into the form, not the form itself.

2. **"Lead submit 1 ราย จาก organic 100%" — misattributed.** The single lead came
   through the ads landing page mini-form (`source = ads_mini_form`), not organic.
   Its `gclid`/`utm` were empty, so the digest read it as organic. The lead is paid
   traffic whose click id simply wasn't on the localStorage at submit time.

3. **"คนกด LINE มากกว่ากรอกฟอร์ม 133:2 → คนชอบคุย LINE" — wrong cause.** The 171 LINE
   clicks were **not** 171 people wanting to chat.

## Root cause: the product image was a LINE link

`line_click` by location this week:

| location | clicks |
| --- | --- |
| **`ads_product` (the product photo)** | **132 (77%)** |
| `floating_button` | 12 |
| `ads_footer` | 6 |
| `ads_hero` (the real "แชท LINE" button) | 4 |
| everything else | 17 |

The hero product image on `/aed/amoul-i7` was wrapped in an `href={LINE_OA}` anchor.
People tapped the photo to inspect the product and were bounced to LINE. Of the full
171 LINE clicks, **exactly 1 became a LINE conversation** (0.6%). The genuine
"แชท LINE" CTA only drew 4 clicks. So the "133:2 LINE-vs-form" ratio is an artifact
of accidental image taps, not a real preference for chat over form.

## Shipped this week

1. **Product image no longer links to LINE** (`app/aed/amoul-i7/page.tsx`). Tapping
   the photo now smooth-scrolls to the on-page quote form (`#ads-quote`) and is
   tracked as `cta_click` (`data-cta="ads_product_image"`). This converts inspection
   intent into a trackable lead instead of a dead-end LINE bounce. The intentional
   LINE entry points (hero button, navbar, footer, floating button) are unchanged.

2. **Weekly-review generator now measures LINE outcomes, not just clicks**
   (`lib/aed/analytics-weekly-review.ts`). `WeeklyContext` gained
   `line_outcome { clicks, chats, messages }` (chats/messages from
   `aed_conversations` / `aed_messages` in the window), and the prompt now instructs
   the model to (a) compare clicks vs real chats and call out a leak when clicks ≫
   chats, and (b) treat a non-CTA location dominating `top_line_locations` (e.g. the
   product image) as accidental taps rather than chat intent. This is the signal
   whose absence let the "133:2" misread through in the first place.

## Recommendations carried forward (not code — for the operator)

- **Google Ads optimisation is starving.** Only the gclid/utm visit is captured;
  the one converting lead lost its gclid, so the Ads conversion almost certainly did
  not fire with attribution. Confirm `recordConversion` is uploading and that the
  landing keeps `gclid` in localStorage through the redirect from `/`.
- **Give the form the discount the page promises.** The "ลด 2,000" hook currently
  reads as LINE-exclusive ("แชท LINE รับส่วนลดเลย"). Now that image taps land on the
  form, the form copy should also promise the discount so the redirect pays off.
- **A/B hero test is still under-powered** (a: 4 clicks, b: 1) — keep running, do not
  conclude yet.
