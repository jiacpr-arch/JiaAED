import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL || "JiaAED <noreply@jiaaed.com>";
const REPLY_TO = process.env.RESEND_REPLY_TO || "sales@jiaaed.com";
import { LINE_OA } from "@/lib/aed/line";

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendLeadAutoReply(p: {
  to: string;
  fullName: string | null;
  productName: string | null;
}): Promise<{ ok: boolean; reason?: string }> {
  const client = getClient();
  if (!client) return { ok: false, reason: "RESEND_API_KEY not set" };

  const greeting = p.fullName ? `คุณ${p.fullName}` : "ลูกค้า";
  const product = p.productName ? `รุ่น ${p.productName}` : "AED Yuwell Y2 / PRIMEDIC HeartSave";

  const subject = `JiaAED — ได้รับข้อมูลของคุณแล้ว`;
  const html = `<!DOCTYPE html>
<html lang="th">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width:560px; margin:0 auto; padding:24px; color:#1a1a1a;">
  <h2 style="color:#b8860b;">สวัสดี${greeting} 👋</h2>
  <p>ขอบคุณที่สนใจ <strong>${product}</strong> ทีมงานเจี่ยรักษาจะติดต่อกลับภายใน 24 ชั่วโมง</p>
  <p>หากเร่งด่วน คุยกับ AI เจี่ยทาง LINE ได้ทันที 24 ชั่วโมง:</p>
  <p style="text-align:center; margin: 24px 0;">
    <a href="${LINE_OA}" style="display:inline-block; background:#06C755; color:#fff; font-weight:bold; text-decoration:none; padding:12px 28px; border-radius:24px;">💬 เพิ่มเพื่อน LINE</a>
  </p>
  <hr style="border:none; border-top:1px solid #eee; margin:24px 0;">
  <p style="font-size:13px; color:#666;">
    JiaAED by เจี่ยรักษา · ทะเบียน อย. 65-2-2-2-0013415<br>
    เครื่องกระตุกหัวใจไฟฟ้าอัตโนมัติ AED Yuwell Y2 / PRIMEDIC HeartSave
  </p>
</body>
</html>`;

  const text = [
    `สวัสดี${greeting}`,
    ``,
    `ขอบคุณที่สนใจ ${product} ทีมงานเจี่ยรักษาจะติดต่อกลับภายใน 24 ชั่วโมง`,
    ``,
    `หากเร่งด่วน คุยทาง LINE ได้ทันที: ${LINE_OA}`,
    ``,
    `JiaAED by เจี่ยรักษา`,
    `ทะเบียน อย. 65-2-2-2-0013415`,
  ].join("\n");

  const res = await client.emails.send({
    from: FROM,
    to: [p.to],
    replyTo: REPLY_TO,
    subject,
    html,
    text,
  });

  if (res.error) {
    console.error("[AED] resend send failed:", res.error);
    return { ok: false, reason: String(res.error.message || res.error) };
  }
  return { ok: true };
}
