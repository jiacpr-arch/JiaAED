import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDailyDigest, formatDigestForLine } from "@/lib/aed/analytics-digest";
import { notifyAnalyticsDigest, notifyAnalyticsAlert } from "@/lib/aed/notify-owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BID_READY_THRESHOLD = 30;
const BID_READY_DAYS = 14;
const BID_READY_KIND = "bid_strategy_ready";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

async function checkBidReadiness(): Promise<{
  ready: boolean;
  count: number;
  lineClicks: number;
  formSubmits: number;
  alreadyAlerted: boolean;
}> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - BID_READY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const countEvent = async (name: string) => {
    const { count } = await supabase
      .from("aed_analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_name", name)
      .gte("created_at", since);
    return count ?? 0;
  };

  const [lineClicks, formSubmits] = await Promise.all([
    countEvent("line_click"),
    countEvent("lead_form_submit"),
  ]);
  const conversions = lineClicks + formSubmits;

  const { data: prevAlerts } = await supabase
    .from("aed_analytics_digest_log")
    .select("id")
    .eq("kind", BID_READY_KIND)
    .limit(1);

  return {
    ready: conversions >= BID_READY_THRESHOLD,
    count: conversions,
    lineClicks,
    formSubmits,
    alreadyAlerted: (prevAlerts ?? []).length > 0,
  };
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

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

    const text = formatDigestForLine(digest);
    await notifyAnalyticsDigest(text);

    const bid = await checkBidReadiness();
    if (bid.ready && !bid.alreadyAlerted) {
      const lines = [
        `🎯 พร้อมสลับ Bid Strategy แล้ว!`,
        ``,
        `${BID_READY_DAYS} วันที่ผ่านมา มี conversion ${bid.count} ครั้ง`,
        `• LINE clicks: ${bid.lineClicks}`,
        `• ส่งฟอร์มจริง: ${bid.formSubmits}`,
        ``,
      ];
      if (bid.formSubmits === 0) {
        lines.push(
          `⚠️ conversion เกือบทั้งหมดเป็น "LINE click" ไม่ใช่ลีดที่ส่งฟอร์ม`,
          `ถ้าสลับเป็น Target CPA ตอนนี้ Google จะ optimize เพื่อหาคน "คลิก LINE"`,
          `ไม่ใช่ลูกค้าจริง — เช็คก่อนว่า LINE click กลายเป็นการขายจริงแค่ไหน`,
          ``,
        );
      }
      lines.push(
        `แนะนำให้ทำใน Google Ads:`,
        `1. Campaign Settings → Bidding`,
        `2. เปลี่ยน "จำนวนคลิก" → "Conversion"`,
        `3. ตั้ง Target CPA = ฿1,500`,
        `4. บันทึก`,
      );
      await notifyAnalyticsAlert(lines.join("\n"));

      await supabase.from("aed_analytics_digest_log").insert({
        digest_date: digest.date,
        kind: BID_READY_KIND,
        payload: {
          count: bid.count,
          line_clicks: bid.lineClicks,
          form_submits: bid.formSubmits,
          days: BID_READY_DAYS,
          threshold: BID_READY_THRESHOLD,
        },
      });
    }

    return NextResponse.json({ ok: true, date: digest.date, alerts: digest.alerts.length, bid });
  } catch (err) {
    console.error("[cron/daily-digest] failed:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
