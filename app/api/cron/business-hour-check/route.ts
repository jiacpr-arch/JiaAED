import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAnalyticsAlert } from "@/lib/aed/notify-owner";
import { claimDailyCronRun } from "@/lib/aed/cron-once";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BKK_TZ = "Asia/Bangkok";
const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 18;
const WINDOW_HOURS = 4;
const VISITOR_THRESHOLD = 30;

function bkkHour(): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: BKK_TZ,
    hour: "2-digit",
    hour12: false,
  });
  return Number(fmt.format(new Date()));
}

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const hour = bkkHour();
  if (hour < BUSINESS_START_HOUR || hour > BUSINESS_END_HOUR) {
    return NextResponse.json({ ok: true, skipped: "outside_business_hours", hour });
  }

  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const supabase = createAdminClient();

  const [visitsRes, submitsRes] = await Promise.all([
    supabase
      .from("aed_ad_visits")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since),
    supabase
      .from("aed_analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_name", "lead_form_submit")
      .gte("created_at", since),
  ]);

  const visits = visitsRes.count ?? 0;
  const submits = submitsRes.count ?? 0;

  if (visits >= VISITOR_THRESHOLD && submits === 0) {
    // At most one alert per Bangkok day. The old 6-hour cooldown read the
    // previous alert row, but a second same-day row could never be written
    // (UNIQUE(digest_date, kind)), so after the cooldown it re-alerted hourly.
    // The claim insert is atomic, which also covers re-delivered cron ticks.
    if (!(await claimDailyCronRun("no_leads_alert"))) {
      return NextResponse.json({ ok: true, alerted: false, already_alerted_today: true, visits, submits });
    }
    const msg = [
      `🚨 ไม่มี Lead ในช่วงทำการ!`,
      ``,
      `${WINDOW_HOURS} ชั่วโมงที่ผ่านมา:`,
      `• visitors ${visits} คน`,
      `• lead form submit: 0`,
      ``,
      `ตรวจ: ฟอร์มยังทำงานปกติไหม / Google Ads ส่ง traffic ตรงกลุ่มไหม`,
    ].join("\n");
    await notifyAnalyticsAlert(msg);

    return NextResponse.json({ ok: true, alerted: true, visits, submits });
  }

  return NextResponse.json({ ok: true, alerted: false, visits, submits });
}
