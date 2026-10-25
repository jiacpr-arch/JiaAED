// Google Ads tag config — account 461-594-5872 (Jia1669.com), tag AW-10780588709.
//
// These are the SAME conversion actions jia1669.com already reports to (ไลน์ /
// โทร / แชทกับเรา), so every AED landing page lands its conversions in the one
// account the AED campaigns run in. Rule: never create new conversion actions —
// reuse these labels.
//
// Hard-coded on purpose (no NEXT_PUBLIC_* override): a leftover Vercel env var
// pointing at the old AW-873507669 tag would otherwise silently send
// conversions to the wrong account.

export const GADS_ID = "AW-10780588709";

// "แชทกับเรา" (form/chat submit) — fired when a lead/quote form submits.
export const GADS_LEAD_CONVERSION_LABEL = "ePoiCMySpfcCEKX1ypQo";

// "ไลน์" (LINE click).
export const GADS_LINE_CLICK_CONVERSION_LABEL = "psuVCOSSpfcCEKX1ypQo";

// "โทร" (tel: link click).
export const GADS_CALL_CLICK_CONVERSION_LABEL = "i40LCO2SpfcCEKX1ypQo";

// Same per-lead value jia1669.com sends, so values stay comparable across sites.
export const GADS_LEAD_VALUE_THB = 494.8;

/**
 * Builds the `send_to` value for a gtag conversion event, or null when either
 * half is missing (callers skip the event rather than fire a malformed one).
 */
export function gadsSendTo(label: string | undefined | null): string | null {
  if (!GADS_ID || !label) return null;
  return `${GADS_ID}/${label}`;
}

/** Full gtag `conversion` params for a label, including the lead value. */
export function gadsConversionParams(label: string): Record<string, unknown> | null {
  const sendTo = gadsSendTo(label);
  if (!sendTo) return null;
  return { send_to: sendTo, value: GADS_LEAD_VALUE_THB, currency: "THB" };
}
