import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { flushNotifyQueue } from "@/lib/aed/notify-queue";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
