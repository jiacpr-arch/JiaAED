import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDailyDigest, formatDigestForLine } from "@/lib/aed/analytics-digest";
import { createNotifyBatch } from "@/lib/aed/notify-owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BID_READY_THRESHOLD = 15; // real leads in the window — Google's floor for conversion-based bidding
const BID_READY_DAYS = 30;
const BID_READY_KIND = "bid_strategy_ready";

async function checkBidReadiness(): Promise<{
  ready: boolean;
  count: number;
  alreadyAlerted: boolean;
}> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - BID_READY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Count REAL leads (form submits + chat captures), not raw LINE clicks. Abandoned
  // forms are stored with a "partial_*" source and must not count.
  const { count } = await supabase
    .from("aed_leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since)
    .not("source", "ilike", "partial%");

  const leads = count ?? 0;

  const { data: prevAlerts } = await supabase
    .from("aed_analytics_digest_log")
    .select("id")
    .eq("kind", BID_READY_KIND)
    .limit(1);

  return {
    ready: leads >= BID_READY_THRESHOLD,
    count: leads,
    alreadyAlerted: (prevAlerts ?? []).length > 0,
  };
}

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const batch = createNotifyBatch();

  try {
    const digest = await buildDailyDigest();

    const supabase = createAdminClient();
    const { error: logError } = await supabase
      .from("aed_analytics_digest_log")
      .upsert(
        {
          digest_date: digest.date,
          kind: "daily",
          payload: digest,
        },
        { onConflict: "digest_date,kind" },
      );
    if (logError) console.error("[cron/daily-digest] log upsert failed:", logError);

    batch.add(formatDigestForLine(digest));

    const bid = await checkBidReadiness();
    if (bid.ready && !bid.alreadyAlerted) {
      batch.add(
        [
          `🎯 พร้อมสลับ Bid Strategy แล้ว!`,
          ``,
          `${BID_READY_DAYS} วันที่ผ่านมา มี "ลีดจริง" ${bid.count} ราย`,
          `(ฟอร์ม + LINE/แชทที่เก็บเบอร์ได้ — ไม่นับ LINE click ลอย ๆ)`,
          ``,
          `Google มี conversion จริงพอให้เรียนรู้แล้ว แนะนำ:`,
          `1. Campaign Settings → Bidding`,
          `2. เปลี่ยน "เพิ่มจำนวนคลิกสูงสุด" → "Maximize Conversions"`,
          `3. รัน 2-3 สัปดาห์ให้นิ่ง แล้วค่อยใส่ Target CPA`,
          ``,
          `(ยิ่งลีดเยอะยิ่งแม่น — 30+/เดือนดีสุด)`,
        ].join("\n"),
      );

      await supabase.from("aed_analytics_digest_log").insert({
        digest_date: digest.date,
        kind: BID_READY_KIND,
        payload: {
          real_leads: bid.count,
          days: BID_READY_DAYS,
          threshold: BID_READY_THRESHOLD,
        },
      });
    }

    return NextResponse.json({ ok: true, date: digest.date, alerts: digest.alerts.length, bid });
  } catch (err) {
    console.error("[cron/daily-digest] failed:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  } finally {
    await batch.flush().catch((e) => console.error("[cron/daily-digest] batch flush failed:", e));
  }
}
