import { describe, expect, it } from "vitest";
import { isAcknowledgement } from "./followup-rules";

describe("isAcknowledgement", () => {
  it.each(["ครับ", "ค่ะ", "ได้ครับ", "ได้ครับ ขอบคุณครับ", "ขอบคุณมากค่ะ 🙏", "ok 👍", "โอเคครับ", "รับทราบครับผม", "Thank you!"])(
    "treats %s as a bare acknowledgement",
    (text) => expect(isAcknowledgement(text)).toBe(true),
  );

  it.each(["แพงไปครับ ไม่เอาแล้ว", "ไม่ได้ครับ", "ตกลงซื้อครับ", "โอนแล้วนะครับ", "ขอเลขบัญชีครับ", "ได้ครับ ส่งที่อยู่ให้นะครับ ซอย 5"])(
    "treats %s as a real reply",
    (text) => expect(isAcknowledgement(text)).toBe(false),
  );
});
