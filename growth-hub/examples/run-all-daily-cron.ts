// Copy to: app/api/cron/run-all-daily/route.ts
// One cron drives the daily digest for every enabled tenant.
import { NextResponse } from "next/server";
import { runAllDailyDigests } from "../lib/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }
  const results = await runAllDailyDigests();
  return NextResponse.json({ ok: true, tenants: results.length, results });
}
