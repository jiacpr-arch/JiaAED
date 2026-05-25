// Copy to: app/api/cron/weekly-review/route.ts
// Schedule in vercel.json, e.g. { "path": "/api/cron/weekly-review", "schedule": "0 2 * * 1" }
import { NextResponse } from "next/server";
import { createStore, runWeeklyReview } from "../lib";
import { config } from "../growth.config.example"; // in your project: "@/growth.config"

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    const review = await runWeeklyReview(config, createStore(config));
    return NextResponse.json({ ok: true, length: review.length });
  } catch (err) {
    console.error("[cron/weekly-review] failed:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
