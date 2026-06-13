import { createHash } from "crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ADS_BASE = "https://googleads.googleapis.com/v17";

export type ConversionInput = {
  conversionActionId: string;
  conversionDateTime?: string; // "YYYY-MM-DD HH:MM:SS+ZZ:ZZ" — defaults to now in BKK
  orderId?: string;
  valueThb?: number;
  // Attribution — provide at least one
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type ConversionResult =
  | { ok: true; matchStrategy: "gclid" | "gbraid" | "wbraid" | "enhanced" }
  | { ok: false; reason: string; status?: number };

export function isConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
      process.env.GOOGLE_ADS_CUSTOMER_ID &&
      process.env.GOOGLE_ADS_CLIENT_ID &&
      process.env.GOOGLE_ADS_CLIENT_SECRET &&
      process.env.GOOGLE_ADS_REFRESH_TOKEN,
  );
}

export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  // Google Ads expects E.164. Strip non-digits; if 9-10 digits assume Thailand.
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return `+66${digits.slice(1)}`;
  if (digits.length === 9) return `+66${digits}`;
  if (digits.length > 0 && !phone.trim().startsWith("+")) return `+${digits}`;
  return phone.trim();
}

function thbToMicros(thb: number): number {
  return Math.round(thb * 1_000_000);
}

function bangkokNow(): string {
  // "YYYY-MM-DD HH:MM:SS+07:00"
  const d = new Date();
  const offsetMinutes = 7 * 60;
  const local = new Date(d.getTime() + offsetMinutes * 60 * 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())} ${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}+07:00`;
}

export async function getAccessToken(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`oauth2 token failed: ${res.status} ${t.slice(0, 200)}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("oauth2 token missing access_token");
  return json.access_token;
}

export async function uploadConversion(input: ConversionInput): Promise<ConversionResult> {
  if (!isConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const conversionAction = `customers/${customerId}/conversionActions/${input.conversionActionId}`;
  const conversionDateTime = input.conversionDateTime ?? bangkokNow();

  let matchStrategy: "gclid" | "gbraid" | "wbraid" | "enhanced";
  const conversion: Record<string, unknown> = {
    conversionAction,
    conversionDateTime,
  };

  if (input.gclid) {
    conversion.gclid = input.gclid;
    matchStrategy = "gclid";
  } else if (input.gbraid) {
    conversion.gbraid = input.gbraid;
    matchStrategy = "gbraid";
  } else if (input.wbraid) {
    conversion.wbraid = input.wbraid;
    matchStrategy = "wbraid";
  } else if (input.email || input.phone) {
    const userIdentifiers: Array<Record<string, string>> = [];
    if (input.email) userIdentifiers.push({ hashedEmail: sha256(normalizeEmail(input.email)) });
    if (input.phone) userIdentifiers.push({ hashedPhoneNumber: sha256(normalizePhone(input.phone)) });
    conversion.userIdentifiers = userIdentifiers;
    matchStrategy = "enhanced";
  } else {
    return { ok: false, reason: "no_attribution" };
  }

  if (typeof input.valueThb === "number" && input.valueThb > 0) {
    conversion.conversionValue = input.valueThb;
    conversion.currencyCode = "THB";
  }
  if (input.orderId) conversion.orderId = input.orderId;

  let token: string;
  try {
    token = await getAccessToken();
  } catch (e) {
    return { ok: false, reason: `oauth_failed: ${(e as Error).message}` };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    "Content-Type": "application/json",
  };
  if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
    headers["login-customer-id"] = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, "");
  }

  const url = `${ADS_BASE}/customers/${customerId}:uploadClickConversions`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      conversions: [conversion],
      partialFailure: true,
    }),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    return { ok: false, reason: `ads_api_${res.status}: ${text.slice(0, 300)}`, status: res.status };
  }

  // partialFailureError can be returned with 200 OK
  try {
    const json = JSON.parse(text) as { partialFailureError?: { message?: string } };
    if (json.partialFailureError?.message) {
      return { ok: false, reason: `partial_failure: ${json.partialFailureError.message.slice(0, 300)}` };
    }
  } catch {
    /* ignore parse — body might be empty {} */
  }

  return { ok: true, matchStrategy };
}

export { thbToMicros };

// ---------------------------------------------------------------------------
// Reporting (GAQL) — pulls real spend / conversions / CPL / search terms so the
// week-2 budget decision can be made on numbers instead of guesses.
// ---------------------------------------------------------------------------

function reportHeaders(token: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    "Content-Type": "application/json",
  };
  if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
    headers["login-customer-id"] = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, "");
  }
  return headers;
}

/** Run a GAQL query and return all result rows (follows pagination). */
export async function searchGaql(query: string): Promise<Array<Record<string, unknown>>> {
  if (!isConfigured()) throw new Error("not_configured");
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const token = await getAccessToken();
  const url = `${ADS_BASE}/customers/${customerId}/googleAds:search`;

  const rows: Array<Record<string, unknown>> = [];
  let pageToken: string | undefined;
  do {
    const res = await fetch(url, {
      method: "POST",
      headers: reportHeaders(token),
      body: JSON.stringify({ query, pageSize: 1000, ...(pageToken ? { pageToken } : {}) }),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) throw new Error(`ads_api_${res.status}: ${text.slice(0, 300)}`);
    const json = JSON.parse(text) as {
      results?: Array<Record<string, unknown>>;
      nextPageToken?: string;
    };
    if (json.results) rows.push(...json.results);
    pageToken = json.nextPageToken;
  } while (pageToken);

  return rows;
}

export type CampaignRow = {
  campaign: string;
  costThb: number;
  conversions: number;
  clicks: number;
  impressions: number;
  cplThb: number | null;
};

export type SearchTermRow = {
  term: string;
  status: string;
  costThb: number;
  conversions: number;
  clicks: number;
};

export type AdsReport = {
  rangeDays: number;
  totals: { costThb: number; conversions: number; clicks: number; cplThb: number | null };
  campaigns: CampaignRow[];
  topSearchTerms: SearchTermRow[];
};

const micros = (v: unknown): number => Number(v ?? 0) / 1_000_000;
const num = (v: unknown): number => Number(v ?? 0);

/** 14-day account report: spend, conversions, CPL per campaign + top search terms. */
export async function fetchAdsReport(rangeDays = 14): Promise<AdsReport> {
  const during = rangeDays === 14 ? "LAST_14_DAYS" : rangeDays === 30 ? "LAST_30_DAYS" : "LAST_7_DAYS";

  const campRows = await searchGaql(
    `SELECT campaign.name, metrics.cost_micros, metrics.conversions, metrics.clicks, metrics.impressions ` +
      `FROM campaign WHERE segments.date DURING ${during} AND metrics.impressions > 0`,
  );

  const byCampaign = new Map<string, CampaignRow>();
  for (const r of campRows) {
    const c = r.campaign as { name?: string } | undefined;
    const m = r.metrics as Record<string, unknown> | undefined;
    const name = c?.name ?? "(unknown)";
    const row = byCampaign.get(name) ?? {
      campaign: name,
      costThb: 0,
      conversions: 0,
      clicks: 0,
      impressions: 0,
      cplThb: null,
    };
    row.costThb += micros(m?.costMicros);
    row.conversions += num(m?.conversions);
    row.clicks += num(m?.clicks);
    row.impressions += num(m?.impressions);
    byCampaign.set(name, row);
  }
  const campaigns = [...byCampaign.values()]
    .map((c) => ({ ...c, cplThb: c.conversions > 0 ? c.costThb / c.conversions : null }))
    .sort((a, b) => b.costThb - a.costThb);

  let termRows: Array<Record<string, unknown>> = [];
  try {
    termRows = await searchGaql(
      `SELECT search_term_view.search_term, search_term_view.status, metrics.cost_micros, ` +
        `metrics.conversions, metrics.clicks FROM search_term_view ` +
        `WHERE segments.date DURING ${during} ORDER BY metrics.cost_micros DESC LIMIT 50`,
    );
  } catch {
    // search_term_view can be unavailable on brand-new accounts — non-fatal.
    termRows = [];
  }
  const topSearchTerms: SearchTermRow[] = termRows.map((r) => {
    const v = r.searchTermView as { searchTerm?: string; status?: string } | undefined;
    const m = r.metrics as Record<string, unknown> | undefined;
    return {
      term: v?.searchTerm ?? "(unknown)",
      status: v?.status ?? "UNKNOWN",
      costThb: micros(m?.costMicros),
      conversions: num(m?.conversions),
      clicks: num(m?.clicks),
    };
  });

  const totalCost = campaigns.reduce((s, c) => s + c.costThb, 0);
  const totalConv = campaigns.reduce((s, c) => s + c.conversions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);

  return {
    rangeDays,
    totals: {
      costThb: totalCost,
      conversions: totalConv,
      clicks: totalClicks,
      cplThb: totalConv > 0 ? totalCost / totalConv : null,
    },
    campaigns,
    topSearchTerms,
  };
}
