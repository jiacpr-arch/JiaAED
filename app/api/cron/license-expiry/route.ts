// Weekly license-expiry watchdog (Monday 13:30 น. ไทย = 06:30 UTC) — alerts the
// owner before any อย./ฆพ. registration/advertising-license number lapses.
// See lib/aed/license-expiry.ts for why this matters (Amoul i7 precedent).
import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { claimDailyCronRun } from "@/lib/aed/cron-once";
import {
  checkLicenseExpiries,
  formatLicenseExpiryReport,
} from "@/lib/aed/license-expiry";
import { PRIMEDIC_LICENSE_EXPIRIES } from "@/lib/aed/regulatory";
import { notifyAnalyticsDigest, notifyAnalyticsAlert } from "@/lib/aed/notify-owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  try {
    const results = checkLicenseExpiries(PRIMEDIC_LICENSE_EXPIRIES, new Date());

    // At-least-once cron gate — a twin invocation already pushed this report.
    if (!(await claimDailyCronRun("license_expiry"))) {
      return NextResponse.json({ ok: true, skipped: "already_sent" });
    }

    const anyUrgent = results.some((r) => r.urgent);
    const text = formatLicenseExpiryReport(results);
    if (anyUrgent) await notifyAnalyticsAlert(text);
    else await notifyAnalyticsDigest(text);

    return NextResponse.json({ ok: !anyUrgent, licenses: results });
  } catch (e) {
    console.error("[license-expiry] failed:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
