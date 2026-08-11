// Weekly ops backlog nudge (Monday 13:00 น. ไทย = 06:00 UTC) — reminds the owner
// about bot-opened PRs left unreviewed and news items that auto-published
// recently. See lib/aed/bot-backlog.ts.
import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { claimDailyCronRun } from "@/lib/aed/cron-once";
import { runOpsBacklogCheck, formatOpsBacklogReport } from "@/lib/aed/bot-backlog";
import { notifyAnalyticsDigest, notifyAnalyticsAlert } from "@/lib/aed/notify-owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const ghToken = process.env.GITHUB_TOKEN;
  const ghRepo = process.env.GITHUB_REPO ?? "jiacpr-arch/JiaAED";
  if (!ghToken) {
    console.warn("[ops-backlog] skipped — no GITHUB_TOKEN env var");
    return NextResponse.json({ ok: false, reason: "no_github_token" });
  }
  const [owner, repo] = ghRepo.split("/");

  try {
    const report = await runOpsBacklogCheck({ token: ghToken, owner, repo });

    // At-least-once cron gate — a twin invocation already pushed this report.
    if (!(await claimDailyCronRun("ops_backlog"))) {
      return NextResponse.json({ ok: true, skipped: "already_sent" });
    }

    const text = formatOpsBacklogReport(report);
    if (report.ok) await notifyAnalyticsDigest(text);
    else await notifyAnalyticsAlert(text);

    return NextResponse.json({
      ok: report.ok,
      stalePrs: report.stalePrs.length,
      recentNewsCount: report.recentNewsCount,
    });
  } catch (e) {
    console.error("[ops-backlog] failed:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
