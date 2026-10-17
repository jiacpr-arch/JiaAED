// Pure rules for the follow-up cron (app/api/cron/send-followups), kept apart
// so they're unit-tested without a database.

// Polite particles and filler that carry no meaning on their own, including
// the stretched spellings people type in chat ("ครับบ", "ค่าาา", "คร้าบ").
const PARTICLES = /(ครับผม|คร[ั้]*า?บ+|ค[ั้]+า?บ+|ค่ะ+|คะ+|ค่า+|จ้า+|จ้ะ|นะ+|ฮะ)/g;
// LINE emoticons sent as text, like "(love)" — removed before NOISE, which
// would otherwise eat the brackets and leave the word.
const EMOTICON = /\([a-z ]+\)/g;
// Punctuation, symbols, emoji (and their variation selector), zero-width
// joiners/spaces and the Thai repetition mark "ๆ".
const NOISE = /[\p{P}\p{S}\p{Extended_Pictographic}\s\u200b-\u200d\ufe0f\u0e46]+/gu;
// Messages made only of these (after particles are dropped) just acknowledge
// the bot's last message — they don't mean the customer decided anything.
// Longest first, so "okay" isn't consumed as "ok" + "ay".
const ACK_WORDS = ["ok", "okay", "โอเค", "ได้", "ขอบคุณมาก", "ขอบคุณ", "ขอบใจ", "รับทราบ", "ทราบแล้ว", "thanks", "thank you", "thank u", "thx", "ty", "ka", "krub"]
  .map((w) => w.replace(/\s+/g, ""))
  .sort((a, b) => b.length - a.length);

/**
 * True for a bare acknowledgement ("ครับ", "ได้ครับ ขอบคุณครับ", "ok 👍"),
 * false for anything that says something ("แพงไป ไม่เอาแล้ว", "ไม่ได้ครับ",
 * "ตกลงซื้อครับ"). A follow-up is cancelled by any non-acknowledgement the
 * customer sends after it was scheduled.
 */
export function isAcknowledgement(text: string): boolean {
  let s = text.toLowerCase().replace(EMOTICON, "").replace(NOISE, "").replace(PARTICLES, "");
  for (let changed = true; changed && s; ) {
    changed = false;
    for (const word of ACK_WORDS) {
      if (s.startsWith(word)) {
        s = s.slice(word.length);
        changed = true;
        break;
      }
    }
  }
  return s.length === 0;
}
