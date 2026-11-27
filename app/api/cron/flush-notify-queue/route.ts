import { deliverRentalLine } from "@/lib/aed/rental-line-outbox";
import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { flushNotifyQueue } from "@/lib/aed/notify-queue";
import { flushCustomerNotify } from "@/lib/aed/customer-notify";
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

  // Customer alerts go out on their own, so a failing owner push can't hold
  // them back (and the other way round).
  const rental = await deliverRentalLine().catch(() => {
    console.error("[cron/flush-notify-queue] rental LINE delivery failed");
    return null;
  });
  const customers = await flushCustomerNotify().catch((err) => {
    console.error("[cron/flush-notify-queue] customer alerts failed:", err);
    return { error: String(err) };
  });

  try {
    const result = await flushNotifyQueue();
    return NextResponse.json({ ok: true, ...result, customers, rental });
  } catch (err) {
    console.error("[cron/flush-notify-queue] failed:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
