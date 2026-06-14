#!/usr/bin/env node
// Round-2 Google Ads report for JiaAED.
//
// Pulls 14-day spend / conversions / CPL per campaign + top search terms,
// device breakdown, hour-of-day, keyword quality scores, and network split.
// Applies the week-2 decision rule (CPL <= 200 good / > 300 bad).
//
// Usage (Node 20+, no extra deps) — รันจากที่ไหนก็ได้:
//   node ~/JiaAED/scripts/google-ads-report.mjs
//   node ~/JiaAED/scripts/google-ads-report.mjs --days 30
//
// Script จะหา .env.local จาก project root อัตโนมัติ
// Requires env: GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID,
//   GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN
//   (optional) GOOGLE_ADS_LOGIN_CUSTOMER_ID

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load .env.local from project root relative to this script's location.
// This lets the script run from any working directory.
(function loadEnv() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(scriptDir, "..", ".env.local");
  let content;
  try {
    content = readFileSync(envPath, "utf8");
  } catch {
    return; // no .env.local — env vars must already be set
  }
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
})();

const ADS_BASE = "https://googleads.googleapis.com/v17";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

const GOOD_CPL = 200;
const BAD_CPL = 300;
const CURRENT_DAILY_BUDGET = 150;

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function requireEnv() {
  const keys = [
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_CUSTOMER_ID",
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
  ];
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`\n❌ ขาด env: ${missing.join(", ")}`);
    console.error("   รันด้วย: node --env-file=.env.local scripts/google-ads-report.mjs\n");
    process.exit(1);
  }
}

async function getAccessToken() {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`oauth2 ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  if (!json.access_token) throw new Error("oauth2 missing access_token");
  return json.access_token;
}

async function searchGaql(token, customerId, query) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    "Content-Type": "application/json",
  };
  if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
    headers["login-customer-id"] = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, "");
  }
  const url = `${ADS_BASE}/customers/${customerId}/googleAds:search`;
  const rows = [];
  let pageToken;
  do {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, pageSize: 1000, ...(pageToken ? { pageToken } : {}) }),
    });
    if (!res.ok) throw new Error(`ads_api ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    if (json.results) rows.push(...json.results);
    pageToken = json.nextPageToken;
  } while (pageToken);
  return rows;
}

const micros = (v) => Number(v ?? 0) / 1_000_000;
const num = (v) => Number(v ?? 0);
const baht = (n) => `฿${Math.round(n).toLocaleString("en-US")}`;
const pct = (n, total) => (total > 0 ? `${Math.round((n / total) * 100)}%` : "0%");

function deviceLabel(d) {
  if (d === "MOBILE") return "Mobile";
  if (d === "DESKTOP") return "Desktop";
  if (d === "TABLET") return "Tablet";
  return d ?? "Unknown";
}

function networkLabel(n) {
  if (n === "SEARCH") return "Search";
  if (n === "SEARCH_PARTNERS") return "Search Partners";
  if (n === "CONTENT") return "Display";
  return n;
}

function hourRange(h) {
  const end = (h + 1) % 24;
  const fmt = (x) => `${x.toString().padStart(2, "0")}:00`;
  return `${fmt(h)}-${fmt(end)}`;
}

function isOffHour(h) {
  return h < 6 || h >= 23;
}

function sep(label = "") {
  const line = "─".repeat(56);
  return label ? `\n${label}\n${line}` : line;
}

async function main() {
  requireEnv();
  const days = Number(arg("days", "14"));
  const during = days === 30 ? "LAST_30_DAYS" : days === 7 ? "LAST_7_DAYS" : "LAST_14_DAYS";
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");
  const token = await getAccessToken();

  console.log(`\n📊 JiaAED Google Ads — รอบ 2 รายงาน (${days} วัน · ${during})`);

  // ── Campaign summary ────────────────────────────────────────────────────
  console.log(sep("📁 แคมเปญ"));
  const campRows = await searchGaql(
    token,
    customerId,
    `SELECT campaign.name, metrics.cost_micros, metrics.conversions, metrics.clicks, metrics.impressions ` +
      `FROM campaign WHERE segments.date DURING ${during} AND metrics.impressions > 0`,
  );
  const byCampaign = new Map();
  for (const r of campRows) {
    const name = r.campaign?.name ?? "(unknown)";
    const m = r.metrics ?? {};
    const row = byCampaign.get(name) ?? { campaign: name, cost: 0, conv: 0, clicks: 0, impr: 0 };
    row.cost += micros(m.costMicros);
    row.conv += num(m.conversions);
    row.clicks += num(m.clicks);
    row.impr += num(m.impressions);
    byCampaign.set(name, row);
  }
  const campaigns = [...byCampaign.values()].sort((a, b) => b.cost - a.cost);
  const totalCost = campaigns.reduce((s, c) => s + c.cost, 0);
  const totalConv = campaigns.reduce((s, c) => s + c.conv, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const cpl = totalConv > 0 ? totalCost / totalConv : null;

  for (const c of campaigns) {
    const ccpl = c.conv > 0 ? baht(c.cost / c.conv) : "—";
    console.log(`• ${c.campaign}\n  spend ${baht(c.cost)} · conv ${c.conv.toFixed(1)} · CPL ${ccpl} · clicks ${c.clicks}`);
  }
  console.log(`─`.repeat(56));
  console.log(`รวม: spend ${baht(totalCost)} · conv ${totalConv.toFixed(1)} · clicks ${totalClicks} · CPL ${cpl != null ? baht(cpl) : "— (ยังไม่มี conversion)"}`);

  // ── Device breakdown ────────────────────────────────────────────────────
  console.log(sep("📱 Device"));
  try {
    const devRows = await searchGaql(
      token,
      customerId,
      `SELECT segments.device, metrics.cost_micros, metrics.conversions, metrics.clicks ` +
        `FROM campaign WHERE segments.date DURING ${during} AND metrics.impressions > 0`,
    );
    const byDev = new Map();
    for (const r of devRows) {
      const dev = deviceLabel(r.segments?.device);
      const m = r.metrics ?? {};
      const row = byDev.get(dev) ?? { device: dev, cost: 0, conv: 0, clicks: 0 };
      row.cost += micros(m.costMicros);
      row.conv += num(m.conversions);
      row.clicks += num(m.clicks);
      byDev.set(dev, row);
    }
    for (const d of [...byDev.values()].sort((a, b) => b.clicks - a.clicks)) {
      const dcpl = d.conv > 0 ? baht(d.cost / d.conv) : "—";
      console.log(`• ${d.device}: ${d.clicks} clicks (${pct(d.clicks, totalClicks)}) · ${baht(d.cost)} · CPL ${dcpl}`);
    }
  } catch (e) {
    console.log(`(device ดึงไม่ได้: ${e.message})`);
  }

  // ── Network (Search vs Partners) ─────────────────────────────────────────
  console.log(sep("🌐 Network"));
  try {
    const netRows = await searchGaql(
      token,
      customerId,
      `SELECT segments.ad_network_type, metrics.cost_micros, metrics.conversions, metrics.clicks ` +
        `FROM campaign WHERE segments.date DURING ${during} AND metrics.impressions > 0`,
    );
    const byNet = new Map();
    for (const r of netRows) {
      const net = r.segments?.adNetworkType ?? "UNKNOWN";
      const m = r.metrics ?? {};
      const row = byNet.get(net) ?? { network: net, cost: 0, conv: 0, clicks: 0 };
      row.cost += micros(m.costMicros);
      row.conv += num(m.conversions);
      row.clicks += num(m.clicks);
      byNet.set(net, row);
    }
    for (const n of [...byNet.values()].sort((a, b) => b.cost - a.cost)) {
      const ncpl = n.conv > 0 ? baht(n.cost / n.conv) : "—";
      const flag = n.network === "SEARCH_PARTNERS" && n.conv === 0 && n.cost > 50 ? "  ⚠️ ปิด Search Partners" : "";
      console.log(`• ${networkLabel(n.network)}: ${baht(n.cost)} · ${n.clicks} clicks · CPL ${ncpl}${flag}`);
    }
  } catch (e) {
    console.log(`(network ดึงไม่ได้: ${e.message})`);
  }

  // ── Hour of day ─────────────────────────────────────────────────────────
  console.log(sep("⏰ Hour of Day (Bangkok)"));
  try {
    const hourRows = await searchGaql(
      token,
      customerId,
      `SELECT segments.hour, metrics.clicks, metrics.conversions, metrics.cost_micros ` +
        `FROM campaign WHERE segments.date DURING ${during} AND metrics.impressions > 0`,
    );
    const byHour = new Map();
    for (const r of hourRows) {
      const h = num(r.segments?.hour);
      const m = r.metrics ?? {};
      const row = byHour.get(h) ?? { hour: h, clicks: 0, conv: 0, cost: 0 };
      row.clicks += num(m.clicks);
      row.conv += num(m.conversions);
      row.cost += micros(m.costMicros);
      byHour.set(h, row);
    }
    const hours = [...byHour.values()].sort((a, b) => a.hour - b.hour);
    const offClicks = hours.filter((h) => isOffHour(h.hour)).reduce((s, h) => s + h.clicks, 0);
    const offCost = hours.filter((h) => isOffHour(h.hour)).reduce((s, h) => s + h.cost, 0);
    console.log(`Traffic กลางดึก (23:00-06:00): ${offClicks} clicks (${pct(offClicks, totalClicks)}) · ${baht(offCost)}`);
    const topOff = hours.filter((h) => isOffHour(h.hour) && h.clicks > 0).sort((a, b) => b.clicks - a.clicks).slice(0, 5);
    if (topOff.length) {
      console.log("ชั่วโมงที่แย่สุด:");
      for (const h of topOff) {
        console.log(`  ${hourRange(h.hour)}: ${h.clicks} clicks · ${baht(h.cost)} · ${h.conv.toFixed(1)} conv`);
      }
    }
    if (offClicks > 0 && (offClicks / totalClicks) >= 0.15) {
      console.log("→ แนะนำ: ตั้ง Ad Schedule ปิดช่วง 23:00-06:00 เพื่อลด wasted spend");
    }
  } catch (e) {
    console.log(`(hour-of-day ดึงไม่ได้: ${e.message})`);
  }

  // ── Top Search Terms (negative keyword mining) ───────────────────────────
  console.log(sep("🔍 Search Terms (negative keyword candidates)"));
  try {
    const termRows = await searchGaql(
      token,
      customerId,
      `SELECT search_term_view.search_term, metrics.cost_micros, metrics.conversions, metrics.clicks ` +
        `FROM search_term_view WHERE segments.date DURING ${during} ORDER BY metrics.cost_micros DESC LIMIT 20`,
    );
    if (termRows.length) {
      for (const r of termRows) {
        const m = r.metrics ?? {};
        const flag = num(m.conversions) === 0 && micros(m.costMicros) > 20 ? "  ⚠️ ใส่ negative" : "";
        console.log(
          `  "${r.searchTermView?.searchTerm}" — ${baht(micros(m.costMicros))} · ${num(m.conversions).toFixed(1)} conv · ${num(m.clicks)} clicks${flag}`,
        );
      }
    } else {
      console.log("  (ยังไม่มีข้อมูล search terms)");
    }
  } catch (e) {
    console.log(`(search terms ดึงไม่ได้: ${e.message})`);
  }

  // ── Keyword Quality Score ───────────────────────────────────────────────
  console.log(sep("🎯 Keyword Quality Score"));
  try {
    const kwRows = await searchGaql(
      token,
      customerId,
      `SELECT ad_group_criterion.keyword.text, ad_group.name, ` +
        `ad_group_criterion.quality_info.quality_score, ad_group_criterion.status, ` +
        `metrics.cost_micros, metrics.clicks ` +
        `FROM keyword_view ` +
        `WHERE segments.date DURING ${during} ` +
        `AND campaign.status = 'ENABLED' ` +
        `AND ad_group_criterion.status != 'REMOVED' ` +
        `ORDER BY metrics.cost_micros DESC LIMIT 20`,
    );
    if (kwRows.length) {
      for (const r of kwRows) {
        const kw = r.adGroupCriterion?.keyword?.text ?? "(unknown)";
        const qs = r.adGroupCriterion?.qualityInfo?.qualityScore;
        const m = r.metrics ?? {};
        const qsLabel = qs != null ? `QS=${qs}` : "QS=?";
        const flag = qs != null && qs <= 5 ? "  ⚠️ QS ต่ำ" : "";
        console.log(`  "${kw}" ${qsLabel} · ${baht(micros(m.costMicros))} · ${num(m.clicks)} clicks${flag}`);
      }
    } else {
      console.log("  (ยังไม่มี keyword data)");
    }
  } catch (e) {
    console.log(`(quality score ดึงไม่ได้: ${e.message})`);
  }

  // ── Round-2 Decision ─────────────────────────────────────────────────────
  console.log(`\n${"═".repeat(56)}`);
  console.log(`🧭 คำตัดสินรอบ 2:`);
  if (cpl == null) {
    console.log("   ยังไม่มี conversion → อย่าเพิ่งเพิ่มงบ");
    console.log("   เช็ค: Google Ads → Tools → Conversions → ยืนยัน Lead Form Submit = primary");
  } else if (cpl <= GOOD_CPL) {
    const targetCpa = Math.round(cpl * 1.2);
    const newBudget = Math.round(CURRENT_DAILY_BUDGET * 1.2);
    console.log(`   ✅ CPL ${baht(cpl)} ≤ ฿${GOOD_CPL} (ดี) → Scale!`);
    console.log(`   • ตั้ง Target CPA = ${baht(targetCpa)}`);
    console.log(`   • เพิ่มงบ +20% → ${baht(newBudget)}/วัน`);
    console.log(`   • Scale keyword ที่ดี / เพิ่ม Brand campaign`);
    console.log(`   • เพิ่ม Remarketing / Performance Max`);
  } else if (cpl <= BAD_CPL) {
    console.log(`   ⚠️ CPL ${baht(cpl)} อยู่กลาง ฿${GOOD_CPL}-฿${BAD_CPL} → คงงบ เก็บ data ต่อ`);
    console.log("   • ปรับ ad copy + เพิ่ม negative keyword");
    console.log("   • รีวิว landing page conversion rate");
  } else {
    console.log(`   ❌ CPL ${baht(cpl)} > ฿${BAD_CPL} (แย่) → ห้ามเพิ่มงบ`);
    console.log("   • ใส่ negative keyword จาก ⚠️ ด้านบน");
    console.log("   • ปรับ ad copy / headline ใหม่");
    console.log("   • รีวิว landing page (form submit rate)");
    console.log("   • ลด bid keyword ที่ CPC สูงแต่ไม่ convert");
  }

  console.log(`\n📋 Manual checklist (ทำใน Google Ads UI):`);
  console.log("   • Auction Insights → เช็คส่วนแบ่งกับคู่แข่ง");
  console.log("   • Demographics → Age/Gender → bid adjust กลุ่มที่ convert");
  console.log("   • Segment → Conversions → เช็ค primary vs secondary");
  console.log("");
}

main().catch((e) => {
  console.error(`\n❌ ${e.message}\n`);
  process.exit(1);
});
