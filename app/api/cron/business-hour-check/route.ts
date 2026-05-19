import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAnalyticsAlert } from "@/lib/aed/notify-owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BKK_TZ = "Asia/Bangkok";
const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 18;
const WINDOW_HOURS = 4;
const VISITOR_THRESHOLD = 30;
const ALERT_COOLDOWN_HOURS = 6;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function bkkHour(): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: BKK_TZ,
    hour: "2-digit",
    hour12: false,
  });
  return Number(fmt.format(new Date()));
}

function bkkDateLabel(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: BKK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const hour = bkkHour();
  if (hour < BUSINESS_START_HOUR || hour > BUSINESS_END_HOUR) {
    return NextResponse.json({ ok: true, skipped: "outside_business_hours", hour });
  }

  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const cooldownSince = new Date(Date.now() - ALERT_COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();
  const supabase = createAdminClient();

  const [visitsRes, submitsRes, recentAlertRes] = await Promise.all([
    supabase
      .from("aed_ad_visits")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since),
    supabase
      .from("aed_analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_name", "lead_form_submit")
      .gte("created_at", since),
    supabase
      .from("aed_analytics_digest_log")
      .select("id")
      .eq("kind", "no_leads_alert")
      .gte("created_at", cooldownSince)
      .limit(1),
  ]);

  const visits = visitsRes.count ?? 0;
  const submits = submitsRes.count ?? 0;
  const recentAlertSent = (recentAlertRes.data ?? []).length > 0;

  if (visits >= VISITOR_THRESHOLD && submits === 0 && !recentAlertSent) {
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

    await supabase.from("aed_analytics_digest_log").insert({
      digest_date: bkkDateLabel(),
      kind: "no_leads_alert",
      payload: { visits, submits, hour },
    });

    return NextResponse.json({ ok: true, alerted: true, visits, submits });
  }

  return NextResponse.json({ ok: true, alerted: false, visits, submits, recentAlertSent });
}
