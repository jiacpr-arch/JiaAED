// Copy to: app/api/cron/daily-digest/route.ts
// Schedule in vercel.json, e.g. { "path": "/api/cron/daily-digest", "schedule": "0 2 * * *" }
import { NextResponse } from "next/server";
import { createStore, runDailyDigest } from "../lib";
import { config } from "../growth.config.example"; // in your project: "@/growth.config"

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }
  try {
    const digest = await runDailyDigest(config, createStore(config));
    return NextResponse.json({ ok: true, visits: digest.visits, alerts: digest.alerts.length });
  } catch (err) {
    console.error("[cron/daily-digest] failed:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
