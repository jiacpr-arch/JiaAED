import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAnalyticsAlert, notifyAnalyticsDigest } from "@/lib/aed/notify-owner";
import {
  fetchAdsReport,
  fetchDeviceReport,
  fetchHourlyReport,
  fetchAdGroupReport,
  fetchKeywordQualityReport,
  fetchNetworkReport,
  isConfigured,
} from "@/lib/aed/google-ads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const GOOD_CPL = 200;
const BAD_CPL = 300;
const CURRENT_DAILY_BUDGET = 150;
const RANGE_DAYS = 14;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function baht(n: number): string {
  return `฿${Math.round(n).toLocaleString("en-US")}`;
}

function pct(n: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

function networkLabel(n: string): string {
  if (n === "SEARCH") return "Search";
  if (n === "SEARCH_PARTNERS") return "Search Partners";
  if (n === "CONTENT") return "Display";
  if (n === "YOUTUBE_SEARCH") return "YouTube Search";
  if (n === "YOUTUBE_WATCH") return "YouTube Watch";
  return n;
}

function hourRange(h: number): string {
  const end = (h + 1) % 24;
  const fmt = (x: number) => `${x.toString().padStart(2, "0")}:00`;
  return `${fmt(h)}-${fmt(end)}`;
}

/** Off-hours definition: midnight–6am and 11pm (B2B pattern) */
function isOffHour(h: number): boolean {
  return h < 6 || h >= 23;
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
      { digest_date: today, kind: "ads_round2", payload },
      { onConflict: "digest_date,kind" },
    );
  } catch (e) {
    console.error("[ads-round2] logRun failed:", e);
  }
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  if (!isConfigured()) {
    await notifyAnalyticsAlert("🚨 Ads Round-2: ไม่มี GOOGLE_ADS_* env vars — ข้าม");
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 500 });
  }

  const result: Record<string, unknown> = {};

  try {
    // ── Pull all reports in parallel ──────────────────────────────────────
    const [mainReport, devices, hourly, adGroups, keywords, networks] = await Promise.all([
      fetchAdsReport(RANGE_DAYS),
      fetchDeviceReport(RANGE_DAYS).catch(() => []),
      fetchHourlyReport(RANGE_DAYS).catch(() => []),
      fetchAdGroupReport(RANGE_DAYS).catch(() => []),
      fetchKeywordQualityReport(RANGE_DAYS).catch(() => []),
      fetchNetworkReport(RANGE_DAYS).catch(() => []),
    ]);

    result.report = mainReport;
    result.devices = devices;
    result.networks = networks;

    const { totals, campaigns, topSearchTerms } = mainReport;
    const cpl = totals.cplThb;

    // ── Message 1: Summary + CPL decision ────────────────────────────────
    let decision = "";
    let actions: string[] = [];

    if (cpl == null) {
      decision = "⚠️ ยังไม่มี Conversion — เช็ค tracking ก่อน";
      actions = [
        "• ยืนยัน Lead Form Submit = primary conversion ใน Google Ads",
        "• รัน npm run report:ads เพื่อดู search terms",
        "• เช็ค Google Ads → Tools → Conversions",
      ];
    } else if (cpl <= GOOD_CPL) {
      const targetCpa = Math.round(cpl * 1.2);
      const newBudget = Math.round(CURRENT_DAILY_BUDGET * 1.2);
      decision = `✅ CPL ${baht(cpl)} ≤ ${baht(GOOD_CPL)} → Scale!`;
      actions = [
        `• ตั้ง Target CPA = ${baht(targetCpa)} (CPL จริง × 1.2)`,
        `• เพิ่มงบ +20% → ${baht(newBudget)}/วัน (จาก ${baht(CURRENT_DAILY_BUDGET)})`,
        `• Scale Ad Group ที่ CPL ดีสุด (ดูข้อความถัดไป)`,
        `• พิจารณาเปิด Brand Keywords campaign`,
        `• เพิ่ม Remarketing audience`,
      ];
    } else if (cpl <= BAD_CPL) {
      decision = `⚠️ CPL ${baht(cpl)} อยู่กลาง ${baht(GOOD_CPL)}-${baht(BAD_CPL)}`;
      actions = [
        "• คงงบเดิม — เก็บ data อีก 1 สัปดาห์",
        "• ปรับ ad copy headline ให้ชัดขึ้น",
        "• ขุด negative keyword จาก search terms",
        "• เช็ค Quality Score keyword หลัก",
      ];
    } else {
      decision = `❌ CPL ${baht(cpl)} > ${baht(BAD_CPL)} → ห้ามเพิ่มงบ`;
      actions = [
        "• ใส่ negative keyword จาก search terms ที่ 0 conv",
        "• ปรับ ad copy / headline ใหม่",
        "• รีวิว landing page (form submission rate)",
        "• ลด bid ใน keyword ที่ CPC สูงแต่ไม่ convert",
        "• เช็ค Quality Score — ถ้า < 5 แก้ ad copy ก่อน",
      ];
    }

    const zeroConvTerms = topSearchTerms
      .filter((t) => t.conversions === 0 && t.costThb > 20)
      .slice(0, 5);

    const negKeywordHint =
      zeroConvTerms.length > 0
        ? `\n🔍 Negative candidates:\n${zeroConvTerms.map((t) => `  "${t.term}" (${baht(t.costThb)}, 0 conv)`).join("\n")}`
        : "";

    const msg1 = [
      `📊 JiaAED Ads รอบ 2 — ${RANGE_DAYS} วัน`,
      `Spend: ${baht(totals.costThb)} · Conv: ${totals.conversions.toFixed(1)} · Clicks: ${totals.clicks}`,
      `CPL: ${cpl != null ? baht(cpl) : "—"}`,
      ``,
      decision,
      ``,
      actions.join("\n"),
      negKeywordHint,
    ]
      .join("\n")
      .trim();

    // ── Message 2: Campaign + Ad Group breakdown ──────────────────────────
    const campLines = campaigns.map(
      (c) =>
        `• ${c.campaign}\n  ${baht(c.costThb)} · ${c.conversions.toFixed(1)} conv · CPL ${c.cplThb != null ? baht(c.cplThb) : "—"} · ${c.clicks} clicks`,
    );

    const topAdGroups = adGroups.slice(0, 6);
    const agLines = topAdGroups.map(
      (ag) =>
        `• ${ag.adGroup} (${ag.campaign})\n  ${baht(ag.costThb)} · CPL ${ag.cplThb != null ? baht(ag.cplThb) : "—"}`,
    );

    const msg2 = [
      `🗂 แคมเปญ & Ad Group`,
      campLines.join("\n"),
      ``,
      `Ad Groups (top ${topAdGroups.length}):`,
      agLines.join("\n"),
    ].join("\n");

    // ── Message 3: Device + Network ───────────────────────────────────────
    const totalClicks = totals.clicks || 1;
    const deviceLines = devices.map(
      (d) =>
        `• ${d.device}: ${d.clicks} clicks (${pct(d.clicks, totalClicks)}) · CPL ${d.cplThb != null ? baht(d.cplThb) : "—"}`,
    );

    const mobileRow = devices.find((d) => d.device === "Mobile");
    const desktopRow = devices.find((d) => d.device === "Desktop");
    const deviceTip =
      mobileRow && desktopRow && mobileRow.cplThb != null && desktopRow.cplThb != null
        ? mobileRow.cplThb < desktopRow.cplThb
          ? `💡 Mobile CPL ดีกว่า → เพิ่ม bid desktop -20%`
          : `💡 Desktop CPL ดีกว่า → เพิ่ม bid mobile -20%`
        : "";

    const netLines = networks.map(
      (n) =>
        `• ${networkLabel(n.network)}: ${baht(n.costThb)} · ${n.clicks} clicks · CPL ${n.cplThb != null ? baht(n.cplThb) : "—"}`,
    );
    const partnerRow = networks.find((n) => n.network === "SEARCH_PARTNERS");
    const partnerTip =
      partnerRow && partnerRow.conversions === 0 && partnerRow.costThb > 50
        ? `⚠️ Search Partners: ${baht(partnerRow.costThb)} spend ไม่มี conv → ปิด Search Partners`
        : partnerRow?.conversions === 0
          ? `⚠️ Search Partners: ไม่มี conv → พิจารณาปิด`
          : "";

    const msg3 = [
      `📱 Device & Network`,
      ...deviceLines,
      deviceTip,
      ``,
      `🌐 Network:`,
      ...netLines,
      partnerTip,
    ]
      .filter(Boolean)
      .join("\n");

    // ── Message 4: Hour of day + Quality Score ────────────────────────────
    const offHourClicks = hourly.filter((h) => isOffHour(h.hour)).reduce((s, h) => s + h.clicks, 0);
    const offHourPct = pct(offHourClicks, totalClicks);
    const offHourCost = hourly.filter((h) => isOffHour(h.hour)).reduce((s, h) => s + h.costThb, 0);

    const worstHours = hourly
      .filter((h) => isOffHour(h.hour) && h.clicks > 0)
      .sort((a, b) => b.costThb - a.costThb)
      .slice(0, 3)
      .map((h) => `  ${hourRange(h.hour)}: ${h.clicks} clicks · ${baht(h.costThb)} · ${h.conversions.toFixed(1)} conv`);

    const hourTip =
      offHourClicks > 0 && parseFloat(offHourPct) >= 15
        ? `⚠️ Traffic กลางดึก-ตีเช้า (${offHourPct} · ${baht(offHourCost)}) → พิจารณาตั้ง Ad Schedule ปิดช่วงนี้`
        : `✅ Traffic กระจายปกติ (กลางดึก ${offHourPct})`;

    const lowQsKeywords = keywords.filter((k) => k.qualityScore != null && k.qualityScore <= 5);
    const qsLines =
      lowQsKeywords.length > 0
        ? lowQsKeywords
            .slice(0, 5)
            .map((k) => `  "${k.keyword}" QS=${k.qualityScore} · ${baht(k.costThb)}`)
        : ["  ✅ ไม่มี keyword QS ต่ำ"];

    const msg4 = [
      `⏰ Time of Day (กลางดึก 23:00-06:00)`,
      hourTip,
      ...(worstHours.length > 0 ? ["ชั่วโมงที่แย่:", ...worstHours] : []),
      ``,
      `🎯 Quality Score (keyword ≤ 5):`,
      ...qsLines,
      ``,
      `📋 Manual checklist:`,
      `• Google Ads → Auction Insights → เช็คคู่แข่ง`,
      `• Demographics → อายุ/เพศที่ convert ดี → bid adjust`,
      `• A/B test landing page หน้าถัดไป`,
    ].join("\n");

    // ── Message 5: Next steps ─────────────────────────────────────────────
    const phase2Ready = cpl != null && cpl <= GOOD_CPL;
    const msg5 = phase2Ready
      ? [
          `🚀 ขั้นถัดไป (Phase 2)`,
          `1. Performance Max campaign — target ROAS`,
          `2. Remarketing list (เยี่ยมชมไม่ submit)`,
          `3. Brand Search campaign (เพิ่มเติม)`,
          `4. A/B test landing page version ใหม่`,
          `5. YouTube/Display Retargeting`,
        ].join("\n")
      : [
          `🔧 แก้ก่อน scale (Priority)`,
          `1. Landing page: เพิ่ม urgency / social proof`,
          `2. Negative keywords: เพิ่มจาก search terms รายงาน`,
          `3. Ad copy: เปลี่ยน headline 1 ให้ตรงความต้องการมากขึ้น`,
          `4. รอ data อีก 7 วัน แล้วรีวิวใหม่`,
        ].join("\n");

    // ── Send LINE notifications ───────────────────────────────────────────
    const messages = [msg1, msg2, msg3, msg4, msg5].filter(Boolean);
    for (const msg of messages) {
      try {
        await notifyAnalyticsDigest(msg);
      } catch (e) {
        console.error("[ads-round2] notify failed:", e);
      }
    }

    result.cpl = cpl;
    result.decision = decision;
    result.offHourPct = offHourPct;
    result.lowQsCount = lowQsKeywords.length;
    result.partnerWarning = !!partnerTip;

    await logRun(result);
    return NextResponse.json({ ok: true, cpl, decision, messages: messages.length });
  } catch (err) {
    const msg = String(err).slice(0, 300);
    console.error("[ads-round2] failed:", err);
    await notifyAnalyticsAlert(`🚨 Ads Round-2 cron error:\n${msg}`);
    result.error = msg;
    await logRun(result);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
