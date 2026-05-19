import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDailyDigest, formatDigestForLine } from "@/lib/aed/analytics-digest";
import { notifyAnalyticsDigest } from "@/lib/aed/notify-owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // allow when not configured (dev/preview)
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  try {
    const digest = await buildDailyDigest();

    const supabase = createAdminClient();
    const { error: logError } = await supabase
      .from("aed_analytics_digest_log")
      .upsert(
        {
          digest_date: digest.date,
          kind: "daily",
          payload: digest,
        },
        { onConflict: "digest_date,kind" },
      );
    if (logError) console.error("[cron/daily-digest] log upsert failed:", logError);

    const text = formatDigestForLine(digest);
    await notifyAnalyticsDigest(text);

    return NextResponse.json({ ok: true, date: digest.date, alerts: digest.alerts.length });
  } catch (err) {
    console.error("[cron/daily-digest] failed:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
