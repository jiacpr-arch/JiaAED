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
 * Add-friend URL — https://line.me/R/ti/p/{OA_ID}
 *
 * This is the ONLY LINE link that produces a `follow` webhook event, and the
 * follow is the conversion the whole funnel hangs on: it fires the greeting
 * message, creates the customer row, notifies the owner, and is what paid ads
 * are actually buying.
 *
 * Why every CTA points here instead of at the prefilled chat link: 30 days of
 * `aed_analytics_events` (4 ก.ค.–3 ส.ค. 2026) recorded 159 line_click events
 * from 110 sessions — 95% of them mobile — against exactly **1** line_follow
 * and 1 conversation. `oaMessage` drops a non-friend into a chat screen where
 * adding the OA is a secondary action; `ti/p` opens the profile with "เพิ่มเพื่อน"
 * as the primary button. The prefilled message is not worth a funnel that
 * converts 1 in 110 — the click intent is still captured in analytics
 * (data-line-cta / data-product on every CTA).
 */
export const LINE_ADD_FRIEND = `https://line.me/R/ti/p/${encodeURIComponent(LINE_OA_ID)}`;

/**
 * Chat URL that opens the OA with a prefilled message.
 *
 * ⚠️ NOT for CTAs on the website — a visitor who has not added the OA lands in
 * a chat and usually leaves without following (see LINE_ADD_FRIEND). Use this
 * only for people already known to follow the OA (bot replies, owner tooling).
 *
 * LINE URL scheme: https://line.me/R/oaMessage/{OA_ID}/?{percent-encoded text}
 * — the message is the raw query string, NOT a `text=` parameter, and spaces
 * must stay %20 (a literal `+` is shown as "+" in the chat box).
 */
export function lineOaUrl(message = "สนใจ AED ครับ"): string {
  return `https://line.me/R/oaMessage/${encodeURIComponent(LINE_OA_ID)}/?${encodeURIComponent(message)}`;
}

/** The site-wide LINE CTA link. Every button/anchor on the site uses this. */
export const LINE_OA = LINE_ADD_FRIEND;
