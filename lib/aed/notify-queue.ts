import { createAdminClient } from "@/lib/supabase/admin";
import { chunkForLine, pushToOwner, NOTIFY_BATCH_SEPARATOR } from "@/lib/aed/notify-owner";

// No new message in this long -> whatever's pending is probably one cron
// cluster that's done firing, so send it.
const QUIET_WINDOW_MS = 3 * 60 * 1000;
// Force-send even if messages are still trickling in, so a steady stream
// never delays delivery indefinitely.
const MAX_WAIT_MS = 15 * 60 * 1000;

type QueueRow = { id: number; text: string; created_at: string };

export async function flushNotifyQueue(): Promise<{
  flushed: boolean;
  count: number;
  reason: "empty" | "debouncing" | "quiet" | "max_wait";
}> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("aed_notify_queue")
    .select("id, text, created_at")
    .eq("sent", false)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as QueueRow[];
  if (rows.length === 0) return { flushed: false, count: 0, reason: "empty" };

  const now = Date.now();
  const newest = new Date(rows[rows.length - 1].created_at).getTime();
  const oldest = new Date(rows[0].created_at).getTime();
  const quietMs = now - newest;
  const waitingMs = now - oldest;

  if (quietMs < QUIET_WINDOW_MS && waitingMs < MAX_WAIT_MS) {
    return { flushed: false, count: rows.length, reason: "debouncing" };
  }

  // Claim before sending: only rows this run flips from unsent → sent come
  // back, so an overlapping run (Vercel can re-deliver a cron tick) can't send
  // the same rows again. Postgres re-checks `sent = false` after waiting on the
  // other run's row locks, which makes the claim exclusive.
  const { data: claimed, error: claimError } = await supabase
    .from("aed_notify_queue")
    .update({ sent: true, sent_at: new Date(now).toISOString() })
    .in("id", rows.map((r) => r.id))
    .eq("sent", false)
    .select("id");
  if (claimError) throw claimError;

  const claimedIds = new Set(((claimed ?? []) as Array<{ id: number }>).map((r) => r.id));
  const mine = rows.filter((r) => claimedIds.has(r.id));
  if (mine.length === 0) return { flushed: false, count: 0, reason: "empty" };

  const combined = mine.map((r) => r.text).join(NOTIFY_BATCH_SEPARATOR);
  // Send directly — going through notifyAnalyticsDigest here would re-enqueue
  // the combined text and the queue would never drain.
  let delivered = true;
  for (const chunk of chunkForLine(combined)) {
    if (!(await pushToOwner(chunk))) {
      delivered = false;
      break;
    }
  }

  if (!delivered) {
    // LINE rejected or timed out (429/5xx, missing token): hand the rows back
    // so the next run retries, instead of marking the day's reports sent.
    await supabase
      .from("aed_notify_queue")
      .update({ sent: false, sent_at: null })
      .in("id", [...claimedIds]);
    throw new Error(`LINE push failed — ${mine.length} queued message(s) kept for retry`);
  }

  return { flushed: true, count: mine.length, reason: waitingMs >= MAX_WAIT_MS ? "max_wait" : "quiet" };
}
