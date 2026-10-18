// Daily data-retention sweep (03:25 น. ไทย = 20:25 UTC): deletes marketing data
// older than 13 months and leads/chat older than 2 years — see
// lib/aed/data-retention.ts for exactly what is kept. `?dry=1` reports what
// would be deleted without deleting anything.
import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { runDataRetention } from "@/lib/aed/data-retention";
import { notifyAnalyticsAlert } from "@/lib/aed/notify-owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }
  const dryRun = new URL(req.url).searchParams.get("dry") === "1";

  try {
    const deleted = await runDataRetention(new Date(), dryRun);
    return NextResponse.json({ ok: true, dryRun, [dryRun ? "wouldDelete" : "deleted"]: deleted });
  } catch (e) {
    console.error("[data-retention] failed:", e);
    // A silently failing sweep means data outlives what /privacy promises.
    if (!dryRun) {
      await notifyAnalyticsAlert(`⚠️ ลบข้อมูลเก่าตามนโยบายไม่สำเร็จ — ${String(e).slice(0, 300)}`).catch(() => null);
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
