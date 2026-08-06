// Weekly AI SEO health check (Monday 05:00 UTC = 12:00 น. ไทย, after the other
// Monday crons) — fetches the live site and verifies llms.txt / robots /
// sitemap / JSON-LD, then reports to the owner's LINE. See lib/aed/ai-seo-health.
import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { claimDailyCronRun } from "@/lib/aed/cron-once";
import {
  runAiSeoHealthCheck,
  formatHealthReport,
} from "@/lib/aed/ai-seo-health";
import {
  notifyAnalyticsAlert,
  notifyAnalyticsDigest,
} from "@/lib/aed/notify-owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  try {
    const report = await runAiSeoHealthCheck();

    // At-least-once cron gate — a twin invocation already pushed this report.
    if (!(await claimDailyCronRun("ai_seo_health"))) {
      return NextResponse.json({ ok: true, skipped: "already_sent" });
    }

    const text = formatHealthReport(report);
    // Failures use the alert channel so they stand out from routine digests.
    if (report.ok) await notifyAnalyticsDigest(text);
    else await notifyAnalyticsAlert(text);

    return NextResponse.json({ ok: report.ok, checks: report.checks });
  } catch (e) {
    console.error("[ai-seo-health] failed:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
