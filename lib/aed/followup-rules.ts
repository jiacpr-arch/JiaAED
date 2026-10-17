// Pure rules for the follow-up cron (app/api/cron/send-followups), kept apart
// so they're unit-tested without a database.

// Polite particles and filler that carry no meaning on their own.
const PARTICLES = /(ครับผม|ครับ|คับ|ค่ะ|คะ|ค่า|จ้า|จ้ะ|นะ|ฮะ)/g;
// Messages made only of these (after particles are dropped) just acknowledge
// the bot's last message — they don't mean the customer decided anything.
const ACK_WORDS = ["ok", "okay", "โอเค", "ได้", "ขอบคุณมาก", "ขอบคุณ", "ขอบใจ", "รับทราบ", "ทราบแล้ว", "thanks", "thank you", "thx", "ty"];

/**
 * True for a bare acknowledgement ("ครับ", "ได้ครับ ขอบคุณครับ", "ok 👍"),
 * false for anything that says something ("แพงไป ไม่เอาแล้ว", "ไม่ได้ครับ",
 * "ตกลงซื้อครับ"). A follow-up is cancelled by any non-acknowledgement the
 * customer sends after it was scheduled.
 */
export function isAcknowledgement(text: string): boolean {
  let s = text
    .toLowerCase()
    .replace(/[\p{P}\p{S}\p{Extended_Pictographic}\s]+/gu, "")
    .replace(PARTICLES, "");
  for (let changed = true; changed && s; ) {
    changed = false;
    for (const w of ACK_WORDS) {
      const word = w.replace(/\s+/g, "");
      if (s.startsWith(word)) {
        s = s.slice(word.length);
        changed = true;
      }
    }
  }
  return s.length === 0;
}
