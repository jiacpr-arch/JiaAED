import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { NextResponse } from "next/server";
import {
  getCustomerLineUserId,
  getPendingFollowups,
  hasInboundSince,
  saveMessage,
  setFollowupStatus,
} from "@/lib/aed/db-queries";
import { pushText } from "@/lib/aed/line-messaging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// The LINE bot's schedule_followup tool tells the customer "ผมจะส่งข้อความมา
// ติดตามนะครับ" and stores a row in aed_followups — but nothing ever sent them.
// This cron (hourly, Bangkok business hours) delivers what's due.
//
// A follow-up is dropped instead of sent when it's gone stale (the customer
// would get "still interested?" days late — this also covers the backlog that
// piled up before this cron existed) or when the customer has already written
// again since it was scheduled (the conversation moved on).
const STALE_AFTER_MS = 48 * 60 * 60 * 1000;
const MAX_TEXT = 1000;

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const result = { sent: 0, skipped_stale: 0, skipped_replied: 0, skipped_no_line: 0, failed: 0 };

  try {
    const due = await getPendingFollowups();
    for (const f of due) {
      if (Date.now() - new Date(f.scheduled_for).getTime() > STALE_AFTER_MS) {
        if (await setFollowupStatus(f.id, "skipped")) result.skipped_stale++;
        continue;
      }
      if (f.conversation_id && (await hasInboundSince(f.conversation_id, f.created_at))) {
        if (await setFollowupStatus(f.id, "skipped")) result.skipped_replied++;
        continue;
      }
      const lineUserId = f.customer_id ? await getCustomerLineUserId(f.customer_id) : null;
      const text = f.message_template.trim().slice(0, MAX_TEXT);
      if (!lineUserId || !text) {
        if (await setFollowupStatus(f.id, "skipped")) result.skipped_no_line++;
        continue;
      }

      // Claim first so an overlapping run can't send the same follow-up twice.
      if (!(await setFollowupStatus(f.id, "sent"))) continue;
      if (!(await pushText(lineUserId, text))) {
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
