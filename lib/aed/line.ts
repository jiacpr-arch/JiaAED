/**
 * Single source of truth for the LINE Official Account URL.
 * Change the OA handle or default prefill message here — nowhere else.
 *
 * ⚠️ ชั่วคราว: กลับมาใช้ Basic ID ของ channel เก่า เพราะ OA @jiacpr ยังไม่ได้
 * ตั้งค่า Messaging API (webhook/บอท/แจ้งเตือน ทั้งหมดผูกกับ channel เก่า)
 * — ลิงก์ @jiacpr ที่ปล่อยไป 18 มิ.ย.–27 ก.ค. ทำให้ยอดแอดเป็นศูนย์
 * เมื่อตั้งค่า channel @jiacpr ครบ (webhook URL + secret/token ใน Vercel)
 * ค่อยเปลี่ยนค่านี้กลับเป็น "@jiacpr" ที่เดียวจบ
 */
export const LINE_OA_ID = "@273fzpzs";

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
