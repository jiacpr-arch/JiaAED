/**
 * Single source of truth for the LINE Official Account URL.
 * Change the OA handle or default prefill message here — nowhere else.
 */
export const LINE_OA_ID = "@jiacpr";

/** Chat URL that opens the OA with a prefilled message. */
export function lineOaUrl(message = "สนใจ AED ครับ"): string {
  const text = encodeURIComponent(message).replace(/%20/g, "+");
  return `https://line.me/R/oaMessage/${LINE_OA_ID}/?text=${text}`;
}

/** Default chat link — identical to the URL previously hardcoded site-wide. */
export const LINE_OA = lineOaUrl();
