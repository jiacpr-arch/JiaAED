// Google Ads tag config — account 461-594-5872 (Jia1669.com).
//
// Defaults live here (not only in env) so the tag and its conversion labels ship
// with the build instead of silently no-op'ing when a Vercel env var is missing.
// Env still wins when set, so the account can be swapped without a code change.
//
// NOTE: `process.env.NEXT_PUBLIC_*` must stay written out literally — Next.js
// inlines these at build time by static analysis, so destructuring or dynamic
// lookup would break the replacement.

export const GADS_ID = process.env.NEXT_PUBLIC_GADS_ID || "AW-873507669";

// "Lead Form Submit" (category: Submit lead form) — the conversion Google Ads
// bids on. The leading "-" is part of the label itself, not a typo.
export const GADS_LEAD_CONVERSION_LABEL =
  process.env.NEXT_PUBLIC_GADS_LEAD_CONVERSION_LABEL || "-UU0CKTs79gcENXWwqAD";

// "LINE Click" (category: Contact) — reported for MEASUREMENT ONLY. This action
// must stay **Secondary** ("Use for bidding" off) in Google Ads: tapping the LINE
// button is intent, not a confirmed contact — our own funnel shows LINE taps that
// never turn into a chat — so bidding on it would train delivery to chase
// clickers who never convert. Bidding stays on Lead Form Submit + offline
// Sale Closed.
export const GADS_LINE_CLICK_CONVERSION_LABEL =
  process.env.NEXT_PUBLIC_GADS_CONVERSION_LABEL || "M8fPCKHs79gcENXWwqAD";

/**
 * Builds the `send_to` value for a gtag conversion event, or null when either
 * half is missing (callers skip the event rather than fire a malformed one).
 */
export function gadsSendTo(label: string | undefined | null): string | null {
  if (!GADS_ID || !label) return null;
  return `${GADS_ID}/${label}`;
}
