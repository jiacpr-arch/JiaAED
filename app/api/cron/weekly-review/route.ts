import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildWeeklyContext, generateWeeklyReview } from "@/lib/aed/analytics-weekly-review";
import { notifyAnalyticsDigest } from "@/lib/aed/notify-owner";
import { claimDailyCronRun } from "@/lib/aed/cron-once";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function todayLabelBkk(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  try {
    const ctx = await buildWeeklyContext();
    const review = await generateWeeklyReview(ctx);

    // At-least-once cron gate: a twin invocation on the same Bangkok day has
    // already pushed this review — don't send it to LINE twice.
    if (!(await claimDailyCronRun("weekly_ai", { date: todayLabelBkk() }))) {
      return NextResponse.json({ ok: true, skipped: "already_sent" });
    }

    const supabase = createAdminClient();
    await supabase
      .from("aed_analytics_digest_log")
      .upsert(
        {
          digest_date: todayLabelBkk(),
          kind: "weekly_ai",
          payload: { ctx, review },
        },
        { onConflict: "digest_date,kind" },
      );

    await notifyAnalyticsDigest(review);

    return NextResponse.json({ ok: true, range: ctx.range_label, visits: ctx.visits });
  } catch (err) {
    console.error("[cron/weekly-review] failed:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
