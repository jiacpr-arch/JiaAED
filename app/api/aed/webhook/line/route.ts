/**
 * LINE Webhook — JiaAED OA
 * POST /api/aed/webhook/line
 *
 * LINE Developers Console → Webhook URL:
 *   https://<domain>/api/aed/webhook/line
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { getOrCreateCustomerByLine, getOrCreateConversation, saveMessage, bumpConversation } from "@/lib/aed/db-queries";
import { runAI } from "@/lib/aed/ai-orchestrator";
import { notifyNewFollow } from "@/lib/aed/notify-owner";
import type { LineEvent } from "@/lib/aed/types";

export const runtime = "nodejs";

// ─── Signature verification ───────────────────────────────────────────────────

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.AED_LINE_CHANNEL_SECRET;
  if (!secret) {
    console.error("[AED] AED_LINE_CHANNEL_SECRET not set");
    return false;
  }
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ─── LINE push helper ─────────────────────────────────────────────────────────

async function pushMessage(lineUserId: string, text: string): Promise<void> {
  const token = process.env.AED_LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;

  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to: lineUserId, messages: [{ type: "text", text }] }),
  });
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body) as { events: LineEvent[] };
  const events = payload.events ?? [];

  // LINE sends an empty events array to verify the webhook URL
  if (events.length === 0) {
    return NextResponse.json({ ok: true });
  }

  // waitUntil keeps the Vercel function alive after response is sent
  waitUntil(processEvents(events).catch((err) => console.error("[AED] processEvents error:", err)));

  return NextResponse.json({ ok: true });
}

// ─── Event processor ──────────────────────────────────────────────────────────

async function processEvents(events: LineEvent[]): Promise<void> {
  for (const event of events) {
    const lineUserId = event.source?.userId;
    if (!lineUserId) continue;

    // ── Follow (ลูกค้าเพิ่มเพื่อน) ──────────────────────────────────────────
    if (event.type === "follow") {
      await notifyNewFollow(lineUserId).catch(() => null);

      const welcomeMsg = [
        "สวัสดีครับ! 🙏 ผมเจี่ย ผู้ช่วยขาย AED จาก เจี่ยรักษา ครับ",
        "",
        "เราขาย AED Amoul i7 เครื่องช่วยชีวิตคุณภาพสูง ราคาเริ่มต้น ฿39,999 ครับ",
        "",
        "สนใจสอบถามข้อมูล หรือต้องการใบเสนอราคาได้เลยนะครับ 😊",
      ].join("\n");

      await pushMessage(lineUserId, welcomeMsg);
      continue;
    }

    // ── Text message ─────────────────────────────────────────────────────────
    if (event.type !== "message") continue;
    const textEvent = event as { type: "message"; source: { userId: string }; message: { type: string; text?: string } };
    if (textEvent.message.type !== "text" || !textEvent.message.text) continue;

    const userText = textEvent.message.text.trim();

    // ── "myid" helper (สำหรับเพิ่มแอดมินรับ notify) ──────────────────────────
    // แอดมินคนใหม่พิมพ์ "myid" เพื่อขอ LINE User ID ของตัวเอง แล้วเอาไปใส่ env
    // AED_ADMIN_LINE_USER_IDS ดูวิธีที่ docs/google-ads-setup.md
    if (/^\/?(myid|my\s*id|ไอดี|user\s*id)$/i.test(userText)) {
      await pushMessage(
        lineUserId,
        ["🆔 LINE User ID ของคุณคือ:", lineUserId, "", "ส่ง ID นี้ให้แอดมินเพื่อเพิ่มสิทธิ์รับแจ้งเตือนครับ"].join("\n"),
      );
      continue;
    }

    try {
      // Get or create customer + conversation
      const customer = await getOrCreateCustomerByLine(lineUserId);
      const conversation = await getOrCreateConversation(customer.id, "line", lineUserId);

      // Save inbound message
      await saveMessage(conversation.id, "inbound", "customer", userText);
      await bumpConversation(conversation.id);

      // Run AI
      const { reply, toolsUsed } = await runAI(userText, { customer, conversation });

      // Save AI reply
      await saveMessage(conversation.id, "outbound", "ai", reply, toolsUsed.length > 0 ? toolsUsed : undefined);
      await bumpConversation(conversation.id);

      // Send reply via LINE
      await pushMessage(lineUserId, reply);

    } catch (err) {
      console.error("[AED] Error processing message:", err);
      await pushMessage(lineUserId, "ขออภัยครับ เกิดข้อผิดพลาดชั่วคราว กรุณาลองใหม่อีกครั้งครับ 🙏");
    }
  }
}
