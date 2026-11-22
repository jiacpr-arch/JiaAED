// Alerts for rental customers who linked their LINE to their AED units
// (they send "เชื่อม AED <code>" to the OA; see the LINE webhook). Rows are
// written by the database (trigger on aed_iot_alerts, monthly summary) into
// aed_customer_notify; this sends them one push per row.

import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushText } from "@/lib/aed/line-messaging";

const MAX_ROWS_PER_RUN = 40;
const MAX_ATTEMPTS = 5;
// A customer alert that couldn't go out for a day is no longer news.
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

type Row = { id: number; line_user_id: string; text: string; created_at: string; attempts: number };

/** Stable UUID per queue row, so LINE drops a retried push it already delivered. */
export function retryKeyFor(id: number): string {
  const h = crypto.createHash("sha256").update(`aed-customer-notify:${id}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${((parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export async function flushCustomerNotify(): Promise<{ sent: number; failed: number; dropped: number }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("aed_customer_notify")
    .select("id, line_user_id, text, created_at, attempts")
    .eq("sent", false)
    .order("created_at", { ascending: true })
    .limit(MAX_ROWS_PER_RUN);
  if (error) throw error;
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return { sent: 0, failed: 0, dropped: 0 };

  // Claim first so an overlapping cron run can't push the same row twice.
  const now = Date.now();
  const { data: claimed, error: claimError } = await supabase
    .from("aed_customer_notify")
    .update({ sent: true, sent_at: new Date(now).toISOString() })
    .in("id", rows.map((r) => r.id))
    .eq("sent", false)
    .select("id");
  if (claimError) throw claimError;
  const mine = new Set(((claimed ?? []) as Array<{ id: number }>).map((r) => r.id));

  let sent = 0;
  let failed = 0;
  let dropped = 0;
  for (const row of rows) {
    if (!mine.has(row.id)) continue;
    if (now - new Date(row.created_at).getTime() > STALE_AFTER_MS) {
      dropped++;
      await supabase.from("aed_customer_notify").update({ error: "stale — not sent" }).eq("id", row.id);
      continue;
    }
    if (await pushText(row.line_user_id, row.text, { retryKey: retryKeyFor(row.id) })) {
      sent++;
      continue;
    }
    failed++;
    const attempts = row.attempts + 1;
    await supabase
      .from("aed_customer_notify")
      .update(
        attempts >= MAX_ATTEMPTS
          ? { attempts, error: "LINE push failed — gave up" }
          : { attempts, sent: false, sent_at: null, error: "LINE push failed — will retry" },
      )
      .eq("id", row.id);
  }
  return { sent, failed, dropped };
}
