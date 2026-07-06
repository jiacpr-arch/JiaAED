import { createAdminClient } from "@/lib/supabase/admin";
import { chunkForLine, notifyAnalyticsDigest, NOTIFY_BATCH_SEPARATOR } from "@/lib/aed/notify-owner";

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

  const combined = rows.map((r) => r.text).join(NOTIFY_BATCH_SEPARATOR);
  for (const chunk of chunkForLine(combined)) {
    await notifyAnalyticsDigest(chunk);
  }

  const ids = rows.map((r) => r.id);
  await supabase
    .from("aed_notify_queue")
    .update({ sent: true, sent_at: new Date(now).toISOString() })
    .in("id", ids);

  return { flushed: true, count: rows.length, reason: waitingMs >= MAX_WAIT_MS ? "max_wait" : "quiet" };
}
