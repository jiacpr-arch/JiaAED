// Phone normalization for ad-platform matching (Google enhanced conversions,
// Meta CAPI). Both hash the number, so the input has to land on exactly the
// E.164 form the platform hashed on its side, or the match silently fails.

/**
 * Thai (or already-international) number → E.164 digits without "+",
 * e.g. "081-234-5678" / "+66 81 234 5678" / "+66 081…" → "66812345678",
 * Bangkok landline "02-123-4567" → "6621234567". Null if it can't be a phone.
 */
export function phoneE164Digits(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2); // international dialling prefix

  if (d.startsWith("66") && d.length >= 10) {
    d = d.slice(2).replace(/^0/, ""); // "+66 081…" keeps a stray trunk 0
  } else if (d.startsWith("0")) {
    d = d.slice(1); // domestic trunk prefix
  } else if (raw.trim().startsWith("+")) {
    return d.length >= 8 && d.length <= 15 ? d : null; // another country's E.164
  }

  // Thai national number: 9 digits for mobile, 8 for landline.
  return d.length === 8 || d.length === 9 ? `66${d}` : null;
}
