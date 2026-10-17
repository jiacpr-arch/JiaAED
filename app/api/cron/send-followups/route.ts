import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { NextResponse } from "next/server";
import {
  followupSentSince,
  getCustomerLineUserId,
  getPendingFollowups,
  inboundTextsSince,
  saveMessage,
  setFollowupStatus,
} from "@/lib/aed/db-queries";
import { isAcknowledgement } from "@/lib/aed/followup-rules";
import { pushText } from "@/lib/aed/line-messaging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// The LINE bot's schedule_followup tool tells the customer "ผมจะส่งข้อความมา
// ติดตามนะครับ" and stores a row in aed_followups — but nothing ever sent them.
// This cron (hourly, Bangkok business hours) delivers what's due.
//
// A follow-up is dropped instead of sent when:
//  - it's gone stale (the customer would get "still interested?" days late —
//    this also covers the backlog that piled up before this cron existed);
//  - the customer said anything after it was scheduled beyond a bare
//    acknowledgement ("ครับ", "ได้ครับ ขอบคุณครับ") — a decline, a booking or
//    a new question means the conversation moved on (isAcknowledgement);
//  - the chat already got a follow-up in the last 36h (schedule_followup
//    also supersedes older pending ones, see scheduleFollowup). 36h, not
//    24h, so it doesn't sit exactly on this cron's daily period.
const STALE_AFTER_MS = 48 * 60 * 60 * 1000;
const ONE_PER_CHAT_MS = 36 * 60 * 60 * 1000;
// Stop starting new pushes this long before maxDuration (120s), so a slow
// LINE can't get the run killed between claiming a row and handing it back.
const RUN_BUDGET_MS = 90_000;
const MAX_TEXT = 1000;

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const result = { sent: 0, skipped_stale: 0, skipped_replied: 0, skipped_recent: 0, skipped_no_line: 0, failed: 0 };
  const startedAt = Date.now();

  try {
    const due = await getPendingFollowups();
    for (const f of due) {
      if (Date.now() - startedAt > RUN_BUDGET_MS) break; // the rest wait for the next hourly run
      if (Date.now() - new Date(f.scheduled_for).getTime() > STALE_AFTER_MS) {
        if (await setFollowupStatus(f.id, "skipped")) result.skipped_stale++;
        continue;
      }
      if (f.conversation_id) {
        const replies = await inboundTextsSince(f.conversation_id, f.created_at);
        if (replies.some((text) => !isAcknowledgement(text))) {
          if (await setFollowupStatus(f.id, "skipped")) result.skipped_replied++;
          continue;
        }
        if (await followupSentSince(f.conversation_id, new Date(Date.now() - ONE_PER_CHAT_MS).toISOString())) {
          if (await setFollowupStatus(f.id, "skipped")) result.skipped_recent++;
          continue;
        }
      }
      const lineUserId = f.customer_id ? await getCustomerLineUserId(f.customer_id) : null;
      const text = f.message_template.trim().slice(0, MAX_TEXT);
      if (!lineUserId || !text) {
        if (await setFollowupStatus(f.id, "skipped")) result.skipped_no_line++;
        continue;
      }

      // Claim first so an overlapping run can't send the same follow-up twice.
      if (!(await setFollowupStatus(f.id, "sent"))) continue;
      // The row id is a UUID: LINE drops a retried push with the same key.
      if (!(await pushText(lineUserId, text, { retryKey: f.id }))) {
        // Hand it back for the next hourly run (it goes stale after 48h).
        await setFollowupStatus(f.id, "pending", "sent");
        result.failed++;
        continue;
      }
      result.sent++;
      // Keep the transcript complete so the bot has context if they reply.
      if (f.conversation_id) {
        await saveMessage(f.conversation_id, "outbound", "ai", text).catch((e) =>
          console.error("[cron/send-followups] transcript save failed:", e),
        );
      }
    }
    return NextResponse.json({ ok: true, due: due.length, ...result });
  } catch (err) {
    console.error("[cron/send-followups] failed:", err);
    return NextResponse.json({ ok: false, error: String(err), ...result }, { status: 500 });
  }
}
