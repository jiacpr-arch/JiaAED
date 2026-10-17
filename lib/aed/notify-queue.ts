import { createAdminClient } from "@/lib/supabase/admin";
import {
  chunkForLine,
  pushTextsToOwner,
  LINE_TEXT_LIMIT,
  MAX_MESSAGES_PER_PUSH,
  NOTIFY_BATCH_SEPARATOR,
} from "@/lib/aed/notify-owner";

// No new message in this long -> whatever's pending is probably one cron
// cluster that's done firing, so send it.
const QUIET_WINDOW_MS = 3 * 60 * 1000;
// Force-send even if messages are still trickling in, so a steady stream
// never delays delivery indefinitely.
const MAX_WAIT_MS = 15 * 60 * 1000;
// Rows LINE couldn't take for this long (quota exhausted, token missing) are
// dropped rather than replayed — a month of stale digests arriving at once
// would only burn the new month's quota.
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

type QueueRow = { id: number; text: string; created_at: string };

/**
 * The LINE messages for one group — never more than one push request's worth,
 * so a group is delivered whole or not at all. Text past that is cut with a
 * note (only a runaway report gets there: 5 messages hold ~20k+ chars).
 */
export function groupMessages(text: string): string[] {
  const chunks = chunkForLine(text);
  if (chunks.length <= MAX_MESSAGES_PER_PUSH) return chunks;
  const kept = chunks.slice(0, MAX_MESSAGES_PER_PUSH);
  const note = "\n\n… (รายงานยาวเกิน — ตัดส่วนที่เหลือ ดูข้อมูลเต็มในหน้า admin)";
  const last = kept[kept.length - 1];
  const room = LINE_TEXT_LIMIT - note.length;
  // Cut on a line break so a line (or a Thai syllable / emoji) isn't split.
  const nl = last.lastIndexOf("\n", room);
  kept[kept.length - 1] = (last.length <= room ? last : last.slice(0, nl > room / 2 ? nl : room)) + note;
  return kept;
}

/**
 * Pack queued rows, in order, into LINE messages made of whole rows, so each
 * push delivers a known set of rows and a failure part-way through only hands
 * back the rows that weren't sent. A single row longer than one message gets a
 * group of its own; its chunkForLine pieces go out in one push request (see
 * groupMessages), so it too is delivered whole or not at all.
 */
export function packRows<T extends { text: string }>(rows: T[], limit = LINE_TEXT_LIMIT): T[][] {
  const groups: T[][] = [];
  let current: T[] = [];
  let length = 0;
  for (const row of rows) {
    const added = (current.length ? NOTIFY_BATCH_SEPARATOR.length : 0) + row.text.length;
    if (current.length && length + added > limit) {
      groups.push(current);
      current = [];
      length = 0;
    }
    length += (current.length ? NOTIFY_BATCH_SEPARATOR.length : 0) + row.text.length;
    current.push(row);
  }
  if (current.length) groups.push(current);
  return groups;
}

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

  const stale = mine.filter((r) => now - new Date(r.created_at).getTime() > STALE_AFTER_MS);
  if (stale.length) console.error(`[notify-queue] dropping ${stale.length} message(s) older than 24h`);
  const fresh = mine.filter((r) => !stale.includes(r));

  // Send directly — going through notifyAnalyticsDigest here would re-enqueue
  // the combined text and the queue would never drain.
  const groups = packRows(fresh);
  for (let g = 0; g < groups.length; g++) {
    const text = groups[g].map((r) => r.text).join(NOTIFY_BATCH_SEPARATOR);
    if (await pushTextsToOwner(groupMessages(text))) continue;

    // LINE refused or timed out (429/5xx, missing token): hand back the rows
    // not yet delivered so the next run retries them — but not the groups
    // that already went out, which would otherwise be sent twice.
    const unsent = groups.slice(g).flat().map((r) => r.id);
    let released = false;
    for (let attempt = 0; attempt < 3 && !released; attempt++) {
      const { error: releaseError } = await supabase
        .from("aed_notify_queue")
        .update({ sent: false, sent_at: null })
        .in("id", unsent);
      if (releaseError) console.error("[notify-queue] release attempt failed:", releaseError.message);
      else released = true;
    }
    throw new Error(
      released
        ? `LINE push failed — ${unsent.length} queued message(s) kept for retry`
        : `LINE push failed and ${unsent.length} queued message(s) could not be released — they will not be retried`,
    );
  }

  return { flushed: true, count: fresh.length, reason: waitingMs >= MAX_WAIT_MS ? "max_wait" : "quiet" };
}
