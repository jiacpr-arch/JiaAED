import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAnalyticsAlert } from "@/lib/aed/notify-owner";
import {
  curate,
  fetchAllCandidates,
  filterNew,
  insertCurated,
} from "@/lib/aed/news-feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function logRun(payload: Record<string, unknown>): Promise<void> {
  try {
    const supabase = createAdminClient();
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    await supabase.from("aed_analytics_digest_log").upsert(
      { digest_date: today, kind: "news_feed", payload },
      { onConflict: "digest_date,kind" },
    );
  } catch (e) {
    console.error("[news-feed] logRun failed:", e);
  }
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const result: Record<string, unknown> = {};

  try {
    const candidates = await fetchAllCandidates();
    result.candidates = candidates.length;

    const fresh = await filterNew(candidates);
    result.fresh = fresh.length;

    if (fresh.length === 0) {
      await logRun({ ...result, skipped: "no_new_items" });
      return NextResponse.json({ ok: true, skipped: "no_new_items", ...result });
    }

    const curated = await curate(fresh);
    result.curated = curated.length;

    const inserted = await insertCurated(curated);
    result.inserted = inserted;

    // No separate LINE push here: published items are folded into the 09:00
    // daily digest (see fetchTodayNews in analytics-digest.ts) so the owner
    // gets one consolidated daily report instead of two messages.
    await logRun(result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = String(err).slice(0, 300);
    console.error("[news-feed] failed:", err);
    await notifyAnalyticsAlert(`🚨 News-feed error:\n${msg}`);
    await logRun({ ...result, error: msg });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
