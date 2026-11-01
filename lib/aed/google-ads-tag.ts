// Existing Google tag and form destination. Ownership of AW-10780588709 has
// not been verified; keep the current form route unchanged in this scoped edit.
// Jia1669.com (461-594-5872) tag setup verified AW-873507669 and the LINE /
// phone conversion labels below. Only those two click actions use that ID.

export const GADS_ID = "AW-10780588709";
export const GADS_VERIFIED_LEAD_ID = "AW-873507669";

// "แชทกับเรา" (form/chat submit) — fired when a lead/quote form submits.
export const GADS_LEAD_CONVERSION_LABEL = "ePoiCMySpfcCEKX1ypQo";

// "ไลน์" (LINE click).
export const GADS_LINE_CLICK_CONVERSION_LABEL = "nOwLCPvsjdgYENXWwqAD";

// "โทร" (tel: link click).
export const GADS_CALL_CLICK_CONVERSION_LABEL = "n5asCPjsjdgYENXWwqAD";

// Same per-lead value jia1669.com sends, so values stay comparable across sites.
export const GADS_LEAD_VALUE_THB = 494.8;

/**
 * Builds the `send_to` value for a gtag conversion event, or null when either
 * half is missing (callers skip the event rather than fire a malformed one).
 */
export function gadsSendTo(label: string | undefined | null): string | null {
  if (!GADS_ID || !label) return null;
  const id = label === GADS_LINE_CLICK_CONVERSION_LABEL || label === GADS_CALL_CLICK_CONVERSION_LABEL
    ? GADS_VERIFIED_LEAD_ID : GADS_ID;
  return `${id}/${label}`;
}

/** Full gtag `conversion` params for a label, including the lead value. */
export function gadsConversionParams(label: string): Record<string, unknown> | null {
  const sendTo = gadsSendTo(label);
  if (!sendTo) return null;
  return { send_to: sendTo, value: GADS_LEAD_VALUE_THB, currency: "THB" };
}
