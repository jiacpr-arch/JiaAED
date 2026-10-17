import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL || "JiaAED <noreply@jiaaed.com>";
const REPLY_TO = process.env.RESEND_REPLY_TO || "sales@jiaaed.com";
import { LINE_OA } from "@/lib/aed/line";
import { PRIMEDIC_REGULATORY, regLine } from "./regulatory";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// True for text a mail client could turn into a clickable link (scheme, www.,
// or a bare domain like "evil.com"). Thai/English person names never need these.
export function looksLikeLink(s: string): boolean {
  return /[a-z][a-z0-9+.-]*:\/\/|www\.|[a-z0-9-]\.[a-z]{2,}\b|[<>@\/\\]/i.test(s);
}

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

  // fullName is whatever the visitor typed into a public form, and `to` is any
  // address they chose — so it must never carry markup or a link, or this route
  // becomes a phishing relay signed by our domain. Escape it, and fall back to a
  // generic greeting for anything that looks like a URL or domain.
  const safeName = p.fullName && !looksLikeLink(p.fullName) ? p.fullName : null;
  const greeting = safeName ? `คุณ${safeName}` : "ลูกค้า";
  const product = p.productName ? `รุ่น ${p.productName}` : "AED Yuwell / PRIMEDIC HeartSave";

  const subject = `JiaAED — ได้รับข้อมูลของคุณแล้ว`;
  const html = `<!DOCTYPE html>
<html lang="th">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width:560px; margin:0 auto; padding:24px; color:#1a1a1a;">
  <h2 style="color:#b8860b;">สวัสดี${escapeHtml(greeting)} 👋</h2>
  <p>ขอบคุณที่สนใจ <strong>${escapeHtml(product)}</strong> ทีมงานเจี่ยรักษาจะติดต่อกลับภายใน 24 ชั่วโมง</p>
  <p>หากเร่งด่วน คุยกับ AI เจี่ยทาง LINE ได้ทันที 24 ชั่วโมง:</p>
  <p style="text-align:center; margin: 24px 0;">
    <a href="${LINE_OA}" style="display:inline-block; background:#06C755; color:#fff; font-weight:bold; text-decoration:none; padding:12px 28px; border-radius:24px;">💬 เพิ่มเพื่อน LINE</a>
  </p>
  <hr style="border:none; border-top:1px solid #eee; margin:24px 0;">
  <p style="font-size:13px; color:#666;">
    JiaAED by เจี่ยรักษา · ${regLine(PRIMEDIC_REGULATORY)}<br>
    เครื่องกระตุกหัวใจไฟฟ้าอัตโนมัติ AED Yuwell / PRIMEDIC HeartSave
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
    regLine(PRIMEDIC_REGULATORY),
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

// Recipients for new-lead alerts (comma/space separated). Runs alongside the
// LINE push in notify-owner.ts so a lead still reaches the owner if LINE fails.
function getOwnerEmails(): string[] {
  const raw = process.env.AED_OWNER_NOTIFY_EMAILS || "jiacpr@gmail.com";
  return [...new Set(raw.split(/[,\s]+/).map((e) => e.trim()).filter(Boolean))];
}

export async function sendLeadOwnerNotification(p: {
  leadId: string;
  source: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  productName: string | null;
  unitCount: string | null;
  message: string | null;
  adSource: string;
  pageUrl: string | null;
}): Promise<{ ok: boolean; reason?: string }> {
  const client = getClient();
  if (!client) return { ok: false, reason: "RESEND_API_KEY not set" };
  const to = getOwnerEmails();
  if (to.length === 0) return { ok: false, reason: "no owner email" };

  const when = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  const rows: [string, string | null][] = [
    ["ชื่อ", p.fullName],
    ["เบอร์โทร", p.phone],
    ["อีเมล", p.email],
    ["บริษัท", p.company],
    ["รุ่นที่สนใจ", p.productName],
    ["จำนวนเครื่อง", p.unitCount],
    ["ข้อความ", p.message],
    ["ฟอร์ม", p.source],
    ["ที่มา", p.adSource],
    ["หน้าเว็บ", p.pageUrl],
    ["เวลา", when],
    ["Lead ID", p.leadId],
  ];
  const filled = rows.filter((r): r is [string, string] => !!r[1]);

  const who = p.company || p.fullName || p.phone || p.email || "ลูกค้า";
  const subject = `🎯 Lead ใหม่ (${p.source}) — ${who}`;
  const html = `<!DOCTYPE html>
<html lang="th">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width:560px; margin:0 auto; padding:24px; color:#1a1a1a;">
  <h2 style="color:#b8860b; margin-top:0;">🎯 Lead ใหม่จากเว็บไซต์</h2>
  <table style="border-collapse:collapse; width:100%; font-size:14px;">
    ${filled
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 8px; color:#666; vertical-align:top; white-space:nowrap;">${k}</td><td style="padding:6px 8px; white-space:pre-wrap;">${escapeHtml(v)}</td></tr>`,
      )
      .join("\n    ")}
  </table>
</body>
</html>`;
  const text = [`Lead ใหม่จากเว็บไซต์`, ``, ...filled.map(([k, v]) => `${k}: ${v}`)].join("\n");

  const res = await client.emails.send({
    from: FROM,
    to,
    // Hitting "reply" answers the customer directly when they left an email.
    replyTo: p.email || REPLY_TO,
    subject,
    html,
    text,
  });

  if (res.error) {
    console.error("[AED] owner lead email failed:", res.error);
    return { ok: false, reason: String(res.error.message || res.error) };
  }
  return { ok: true };
}
