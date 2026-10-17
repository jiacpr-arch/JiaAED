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
import { getOrCreateCustomerByLine, getOrCreateConversation, saveMessage, bumpConversation, recordLineFollow, updateConversationState, countRecentInbound } from "@/lib/aed/db-queries";
import { runAI } from "@/lib/aed/ai-orchestrator";
import { notifyNewFollow, notifyHotConversation, notifyProcessingError } from "@/lib/aed/notify-owner";
import { scoreConversation, CONVERSATION_HOT_THRESHOLD } from "@/lib/aed/lead-scoring";
import { replyOrPush } from "@/lib/aed/line-messaging";
import { primedicModels } from "@/lib/aed/primedic";
import type { LineEvent } from "@/lib/aed/types";

export const runtime = "nodejs";
// The AI turn runs after the 200 (waitUntil) and can chain several model and
// FlowAccount calls; give it the plan's full budget rather than the default.
export const maxDuration = 300;

// A person sending a few short lines in a row is normal; dozens a minute is a
// script burning model tokens. Past this, messages are saved but not answered.
const MAX_INBOUND_PER_MINUTE = 8;
// Events in one delivery are handled one after another inside a single
// invocation, so they share one deadline (with headroom under maxDuration).
const PROCESSING_BUDGET_MS = 240_000;
// Don't start an AI turn with less than this left before the deadline.
const MIN_TURN_MS = 60_000;

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

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { events?: LineEvent[] };
  try {
    payload = JSON.parse(body) as { events?: LineEvent[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const events = payload.events ?? [];

  // LINE sends an empty events array to verify the webhook URL
  if (events.length === 0) {
    return NextResponse.json({ ok: true });
  }

  // waitUntil keeps the Vercel function alive after response is sent
  const deadline = Date.now() + PROCESSING_BUDGET_MS;
  waitUntil(processEvents(events, deadline).catch((err) => console.error("[AED] processEvents error:", err)));

  return NextResponse.json({ ok: true });
}

// ─── Event processor ──────────────────────────────────────────────────────────

async function processEvents(events: LineEvent[], deadline: number): Promise<void> {
  // Messages that arrived after the time ran out: acknowledged to the
  // customer, then reported to the owner in ONE alert after the loop rather
  // than a push per message eating into what little time is left.
  const deferred: Array<{ lineUserId: string; userText: string }> = [];
  for (const event of events) {
    const lineUserId = event.source?.userId;
    if (!lineUserId) continue;
    // Answer with the event's free reply token; replyOrPush falls back to a
    // (quota-counted) push if the token is missing or already expired.
    const target = {
      userId: lineUserId,
      replyToken: "replyToken" in event && typeof event.replyToken === "string" ? event.replyToken : null,
    };

    // ── Follow (ลูกค้าเพิ่มเพื่อน) ──────────────────────────────────────────
    if (event.type === "follow") {
      // Record the friend-add so it's countable in the weekly review — this is
      // the real LINE conversion, distinct from a line_click (button intent).
      await recordLineFollow().catch(() => null);
      await notifyNewFollow(lineUserId).catch(() => null);

      const welcomeMsg = [
        "สวัสดีครับ! 🙏 ผมเจี่ย ผู้ช่วยขาย AED จาก เจี่ยรักษา ครับ",
        "",
        `เราขาย AED Yuwell / PRIMEDIC HeartSave เครื่องช่วยชีวิตคุณภาพสูง ราคาเริ่มต้น ฿${Math.min(...primedicModels.map((m) => m.price)).toLocaleString("en-US")} ครับ`,
        "",
        "สนใจสอบถามข้อมูล หรือต้องการใบเสนอราคาได้เลยนะครับ 😊",
      ].join("\n");

      await replyOrPush(target, welcomeMsg);
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
      await replyOrPush(
        target,
        ["🆔 LINE User ID ของคุณคือ:", lineUserId, "", "ส่ง ID นี้ให้แอดมินเพื่อเพิ่มสิทธิ์รับแจ้งเตือนครับ"].join("\n"),
      );
      continue;
    }

    let replied = false;
    try {
      // Get or create customer + conversation
      const customer = await getOrCreateCustomerByLine(lineUserId);
      const conversation = await getOrCreateConversation(customer.id, "line", lineUserId);

      // Save inbound message
      await saveMessage(conversation.id, "inbound", "customer", userText);
      await bumpConversation(conversation.id);

      const recentInbound = await countRecentInbound(conversation.id, 60_000);
      if (recentInbound !== null && recentInbound > MAX_INBOUND_PER_MINUTE) {
        console.warn("[AED] LINE flood — not answering", lineUserId.slice(0, 8), recentInbound);
        continue;
      }

      // Earlier events in this delivery used up the time: acknowledge, and let
      // the owner answer by hand rather than being killed mid-turn.
      if (deadline - Date.now() < MIN_TURN_MS) {
        replied = await replyOrPush(target, "ได้รับข้อความแล้วครับ ทีมงานจะตอบกลับโดยเร็วที่สุด 🙏");
        deferred.push({ lineUserId, userText });
        continue;
      }

      // Run AI (the inbound message is already in the history it loads)
      const { reply, toolsUsed, incomplete } = await runAI(userText, { customer, conversation }, { deadline });

      // Send first: a bookkeeping failure below must not cost the customer
      // their answer, nor trigger the "error, please retry" message on top of it.
      replied = await replyOrPush(target, reply);

      await saveMessage(conversation.id, "outbound", "ai", reply, toolsUsed.length > 0 ? toolsUsed : undefined).catch(
        (e) => console.error("[AED] save AI reply failed:", e),
      );
      await bumpConversation(conversation.id);

      // The model failed after tools ran; the customer got a holding reply.
      if (incomplete) {
        await notifyProcessingError({
          lineUserId,
          userText,
          error: new Error("บอทตอบไม่จบ (model ล้มเหลวหลังเรียก tool) — ลูกค้าได้ข้อความรับเรื่องแล้ว กรุณาตามต่อ"),
        }).catch(() => null);
      }

      // Score the conversation now that we know the latest contact info + what
      // the AI did, and write it back. This is the ONLY place
      // aed_conversations.lead_score / current_intent ever get set — without it
      // every LINE chat stays at score 0 and the owner can't rank leads.
      const prevScore = conversation.lead_score ?? 0;
      const { score, intent, reasons } = scoreConversation({
        customer,
        toolsUsed,
        messageCount: (conversation.message_count ?? 0) + 2, // +inbound +outbound this turn
      });
      await updateConversationState(conversation.id, { lead_score: score, current_intent: intent }).catch(
        (e) => console.error("[AED] updateConversationState failed:", e),
      );

      // Alert the owner the moment a chat crosses into "hot" — but only on the
      // upward crossing, so a hot lead pings once, not on every later message.
      if (score >= CONVERSATION_HOT_THRESHOLD && prevScore < CONVERSATION_HOT_THRESHOLD) {
        await notifyHotConversation({
          customerName: customer.full_name,
          lineUserId,
          score,
          intent,
          reasons,
        }).catch((e) => console.error("[AED] notifyHotConversation failed:", e));
      }
    } catch (err) {
      console.error("[AED] Error processing message:", err);
      // A real person just hit a wall — make sure the owner knows so they can
      // reply by hand. A swallowed error here is a silently lost lead.
      await notifyProcessingError({ lineUserId, userText, error: err }).catch(() => null);
      if (!replied) {
        await replyOrPush(target, "ขออภัยครับ เกิดข้อผิดพลาดชั่วคราว กรุณาลองใหม่อีกครั้งครับ 🙏");
      }
    }
  }

  if (deferred.length > 0) {
    const first = deferred[0];
    await notifyProcessingError({
      lineUserId: first.lineUserId,
      userText: deferred.map((d) => d.userText).join(" | ").slice(0, 200),
      error: new Error(
        `ข้อความ ${deferred.length} รายการมาในรอบเดียวกันจนบอทตอบไม่ทัน (ลูกค้าได้ข้อความรับเรื่องแล้ว) — กรุณาตอบเอง` +
          (new Set(deferred.map((d) => d.lineUserId)).size > 1 ? " · มีลูกค้ามากกว่า 1 ราย ดูใน LINE OA" : ""),
      ),
    }).catch(() => null);
  }
}
