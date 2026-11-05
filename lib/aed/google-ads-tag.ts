// Preserve the existing Google loader configuration in this scoped change.
// The three conversion actions below belong to Jia1669.com (461-594-5872),
// whose verified Google Ads destination is AW-873507669.

export const GADS_ID = "AW-10780588709";
export const GADS_VERIFIED_LEAD_ID = "AW-873507669";

// Existing "Lead Form Submit" action 7702574628 — only after lead persistence.
export const GADS_LEAD_CONVERSION_LABEL = "-UU0CKTs79gcENXWwqAD";

// "ไลน์" (LINE click).
export const GADS_LINE_CLICK_CONVERSION_LABEL = "nOwLCPvsjdgYENXWwqAD";

// "โทร" (tel: link click).
export const GADS_CALL_CLICK_CONVERSION_LABEL = "n5asCPjsjdgYENXWwqAD";

// Preserve the existing assigned LINE/phone click value; this is not revenue.
export const GADS_LEAD_VALUE_THB = 494.8;

/**
 * Builds the `send_to` value for a gtag conversion event, or null when either
 * half is missing (callers skip the event rather than fire a malformed one).
 */
export function gadsSendTo(label: string | undefined | null): string | null {
  if (!GADS_ID || !label) return null;
  const id = label === GADS_LEAD_CONVERSION_LABEL || label === GADS_LINE_CLICK_CONVERSION_LABEL || label === GADS_CALL_CLICK_CONVERSION_LABEL
    ? GADS_VERIFIED_LEAD_ID : GADS_ID;
  return `${id}/${label}`;
}

/** Full gtag `conversion` params; successful forms carry no monetary value. */
export function gadsConversionParams(label: string): Record<string, unknown> | null {
  const sendTo = gadsSendTo(label);
  if (!sendTo) return null;
  // Explicit zero overrides the action's default THB 1 when no value is sent.
  const value = label === GADS_LEAD_CONVERSION_LABEL ? 0 : GADS_LEAD_VALUE_THB;
  return { send_to: sendTo, value, currency: "THB" };
}
