// Weekly per-customer pad/battery expiry watchdog (Monday 14:00 น. ไทย =
// 07:00 UTC) — the cron half of lib/aed/unit-expiry.ts. Delivers what
// lib/aed/subscription.ts's PRO/ELITE tiers already market as "แจ้งเตือนแบต /
// แผ่นแปะหมดอายุ".
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { claimDailyCronRun } from "@/lib/aed/cron-once";
import { checkUnitExpiries, formatUnitExpiryReport } from "@/lib/aed/unit-expiry";
import { notifyAnalyticsDigest, notifyAnalyticsAlert } from "@/lib/aed/notify-owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    // Only rows with at least one expiry date set — spares with no assigned
    // electrode set yet have nothing to alert on.
    const { data, error } = await supabase
      .from("aed_units")
      .select("serial_number,customer_name,pad_expiry_date,battery_expiry_date")
      .or("pad_expiry_date.not.is.null,battery_expiry_date.not.is.null");

    if (error) {
      console.error("[unit-expiry-check] supabase error:", error.message);
      return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
    }

    const results = checkUnitExpiries(data ?? [], new Date());

    // At-least-once cron gate — a twin invocation already pushed this report.
    if (!(await claimDailyCronRun("unit_expiry"))) {
      return NextResponse.json({ ok: true, skipped: "already_sent" });
    }

    const anyUrgent = results.some((r) => r.urgent);
    const text = formatUnitExpiryReport(results);
    if (anyUrgent) await notifyAnalyticsAlert(text);
    else await notifyAnalyticsDigest(text);

    return NextResponse.json({ ok: !anyUrgent, units: results });
  } catch (e) {
    console.error("[unit-expiry-check] failed:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
