import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { flushNotifyQueue } from "@/lib/aed/notify-queue";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Room for several LINE pushes (10s timeout each) plus the release on failure,
// so the run isn't killed between claiming rows and handing them back.
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await flushNotifyQueue();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/flush-notify-queue] failed:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
