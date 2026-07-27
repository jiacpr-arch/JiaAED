/**
 * Single source of truth for the LINE Official Account URL.
 * Change the OA handle or default prefill message here — nowhere else.
 */
export const LINE_OA_ID = "@jiacpr";

/**
 * Chat URL that opens the OA with a prefilled message.
 *
 * LINE URL scheme: https://line.me/R/oaMessage/{OA_ID}/?{percent-encoded text}
 * — the message is the raw query string, NOT a `text=` parameter, and spaces
 * must stay %20 (a literal `+` is shown as "+" in the chat box).
 */
export function lineOaUrl(message = "สนใจ AED ครับ"): string {
  return `https://line.me/R/oaMessage/${encodeURIComponent(LINE_OA_ID)}/?${encodeURIComponent(message)}`;
}

/** Default chat link — identical to the URL previously hardcoded site-wide. */
export const LINE_OA = lineOaUrl();
