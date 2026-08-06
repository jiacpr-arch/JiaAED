// Weekly conversion-tracking reconciliation (Monday 12:30 น. ไทย = 05:30 UTC) —
// checks what fraction of real leads (aed_leads) actually made it into a
// 'sent' row in aed_conversion_log, so ads-round2's CPL-based budget
// recommendations aren't silently computed on incomplete data. See
// lib/aed/conversion-audit.ts.
import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { claimDailyCronRun } from "@/lib/aed/cron-once";
import {
  runConversionAudit,
  formatConversionAuditReport,
  isConversionAuditOk,
} from "@/lib/aed/conversion-audit";
import { notifyAnalyticsDigest, notifyAnalyticsAlert } from "@/lib/aed/notify-owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runConversionAudit();

    // At-least-once cron gate — a twin invocation already pushed this report.
    if (!(await claimDailyCronRun("conversion_audit"))) {
      return NextResponse.json({ ok: true, skipped: "already_sent" });
    }

    const ok = isConversionAuditOk(result);
    const text = formatConversionAuditReport(result);
    if (ok) await notifyAnalyticsDigest(text);
    else await notifyAnalyticsAlert(text);

    return NextResponse.json({ ok, ...result });
  } catch (e) {
    console.error("[conversion-audit] failed:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
