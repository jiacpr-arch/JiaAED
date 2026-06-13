#!/usr/bin/env node
// Week-2 Google Ads report for JiaAED.
//
// Pulls real 14-day spend / conversions / CPL per campaign + top search terms,
// then applies the week-2 decision rule (CPL <= 200 good / > 300 bad) so the
// budget call is made on numbers, not guesses.
//
// Usage (Node 20+, no extra deps):
//   node --env-file=.env.local scripts/google-ads-report.mjs
//   node --env-file=.env.local scripts/google-ads-report.mjs --days 30
//
// Requires env: GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID,
//   GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN
//   (optional) GOOGLE_ADS_LOGIN_CUSTOMER_ID

const ADS_BASE = "https://googleads.googleapis.com/v17";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

const GOOD_CPL = 200;
const BAD_CPL = 300;

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

async function main() {
  requireEnv();
  const days = Number(arg("days", "14"));
  const during = days === 30 ? "LAST_30_DAYS" : days === 7 ? "LAST_7_DAYS" : "LAST_14_DAYS";
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");
  const token = await getAccessToken();

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

  console.log(`\n📊 JiaAED Google Ads — ${days} วันล่าสุด (${during})\n${"=".repeat(56)}`);
  for (const c of campaigns) {
    const ccpl = c.conv > 0 ? baht(c.cost / c.conv) : "—";
    console.log(
      `• ${c.campaign}\n    spend ${baht(c.cost)} · conv ${c.conv.toFixed(1)} · CPL ${ccpl} · ` +
        `clicks ${c.clicks} · impr ${c.impr}`,
    );
  }
  console.log("-".repeat(56));
  console.log(
    `รวม: spend ${baht(totalCost)} · conv ${totalConv.toFixed(1)} · clicks ${totalClicks} · ` +
      `CPL ${cpl != null ? baht(cpl) : "— (ยังไม่มี conversion)"}`,
  );

  // Top search terms (for negative-keyword mining).
  try {
    const termRows = await searchGaql(
      token,
      customerId,
      `SELECT search_term_view.search_term, metrics.cost_micros, metrics.conversions, metrics.clicks ` +
        `FROM search_term_view WHERE segments.date DURING ${during} ORDER BY metrics.cost_micros DESC LIMIT 15`,
    );
    if (termRows.length) {
      console.log(`\n🔍 Search terms ที่ใช้งบมากสุด (เช็คหา negative keyword):`);
      for (const r of termRows) {
        const m = r.metrics ?? {};
        const flag = num(m.conversions) === 0 && micros(m.costMicros) > 0 ? "  ⚠️ 0 conv" : "";
        console.log(
          `    "${r.searchTermView?.searchTerm}" — ${baht(micros(m.costMicros))} · ` +
            `${num(m.conversions).toFixed(1)} conv · ${num(m.clicks)} clicks${flag}`,
        );
      }
    }
  } catch (e) {
    console.log(`\n(ดึง search terms ไม่ได้: ${e.message})`);
  }

  // Week-2 decision rule.
  console.log(`\n🧭 คำตัดสินรอบ 2:`);
  if (cpl == null) {
    console.log("   ยังไม่มี conversion → อย่าเพิ่งเพิ่มงบ. เช็ค conversion tracking + search terms ก่อน");
  } else if (cpl <= GOOD_CPL) {
    console.log(`   ✅ CPL ${baht(cpl)} ≤ ฿${GOOD_CPL} (ดี) → ตั้ง Target CPA ≈ ${baht(cpl * 1.2)}, เพิ่มงบ +20%, scale keyword ดี`);
  } else if (cpl > BAD_CPL) {
    console.log(`   ❌ CPL ${baht(cpl)} > ฿${BAD_CPL} (แย่) → ห้ามเพิ่มงบ. ใส่ negative keyword, ปรับ ad copy, รีวิว landing, ลด bid`);
  } else {
    console.log(`   ⚠️ CPL ${baht(cpl)} อยู่ระหว่าง ฿${GOOD_CPL}-฿${BAD_CPL} (กลางๆ) → คงงบเดิม, เก็บ data ต่อ, เก็บ conversion rate หน้าเว็บ`);
  }
  console.log("");
}

main().catch((e) => {
  console.error(`\n❌ ${e.message}\n`);
  process.exit(1);
});
