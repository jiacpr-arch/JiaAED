// ─── AI SEO weekly health check ────────────────────────────────────────────────
// The in-house version of the "AI SEO readiness" service agencies sell: every
// week a cron fetches the PRODUCTION site and verifies the machine-readable
// surface AI search engines depend on (llms.txt, robots, sitemap, JSON-LD),
// then pushes a pass/fail summary to the owner's LINE. Checks compare the live
// site against lib/aed data, so a deploy that silently drops a price or a
// JSON-LD block gets caught within a week instead of never.
//
// Pure helpers (parseSitemapLocs / checkPageSignals / formatHealthReport) are
// separated from I/O so they're unit-testable without a network.

import { primedicModels, yuwellGpsAed } from "./primedic";
import { PRIMEDIC_REGULATORY } from "./regulatory";
import { articles } from "./articles";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com";

const thb = (n: number) => `฿${n.toLocaleString("th-TH")}`;

/** AI crawlers whose absence from robots.txt should page the owner. */
export const REQUIRED_AI_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
];

export type HealthCheck = {
  name: string;
  ok: boolean;
  detail: string;
};

export type HealthReport = {
  ok: boolean;
  checks: HealthCheck[];
};

/** Extract <loc> URLs from a sitemap.xml body. */
export function parseSitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

/**
 * Verify one page's AI/SEO signals from its raw HTML: required JSON-LD @types,
 * a canonical link, and an og:image. Returns the list of missing signals
 * (empty = page healthy).
 */
export function checkPageSignals(
  html: string,
  expectedJsonLdTypes: string[],
): string[] {
  const missing: string[] = [];

  for (const type of expectedJsonLdTypes) {
    // JSON.stringify emits "@type":"X" with no spaces — match that exactly.
    if (!html.includes(`"@type":"${type}"`)) missing.push(`JSON-LD ${type}`);
  }
  if (!html.includes('rel="canonical"')) missing.push("canonical");
  if (!html.includes('property="og:image"')) missing.push("og:image");

  return missing;
}

/** Pages whose structured data the weekly check asserts, with expected @types. */
export function pagesToCheck(): { path: string; jsonLd: string[] }[] {
  return [
    { path: "/", jsonLd: ["Organization", "Product", "FAQPage"] },
    { path: "/aed/yuwell-y2", jsonLd: ["Product", "BreadcrumbList"] },
    { path: "/aed/rental", jsonLd: ["FAQPage", "BreadcrumbList"] },
    // First article stands in for the whole /articles/[slug] template.
    { path: `/articles/${articles[0].slug}`, jsonLd: ["Article", "BreadcrumbList"] },
  ];
}

/** Strings that must appear in the live llms.txt (current prices + อย. number). */
export function requiredLlmsTxtStrings(): { label: string; needle: string }[] {
  return [
    ...primedicModels.map((m) => ({
      label: `ราคา ${m.name}`,
      needle: thb(m.price),
    })),
    { label: `ราคา ${yuwellGpsAed.name}`, needle: thb(yuwellGpsAed.price) },
    ...(PRIMEDIC_REGULATORY.published && PRIMEDIC_REGULATORY.fda
      ? [{ label: "ทะเบียน อย.", needle: PRIMEDIC_REGULATORY.fda }]
      : []),
  ];
}

async function fetchText(
  url: string,
  fetchImpl: typeof fetch,
): Promise<{ status: number; body: string }> {
  try {
    const res = await fetchImpl(url, {
      headers: { "User-Agent": "JiaAED-ai-seo-health/1.0" },
      cache: "no-store",
    });
    return { status: res.status, body: res.ok ? await res.text() : "" };
  } catch {
    return { status: 0, body: "" };
  }
}

/** Run every check against the live site. Injectable fetch for tests. */
export async function runAiSeoHealthCheck(
  fetchImpl: typeof fetch = fetch,
): Promise<HealthReport> {
  const checks: HealthCheck[] = [];

  // 1) llms.txt reachable + prices/อย. in sync with lib data
  const llms = await fetchText(`${SITE}/llms.txt`, fetchImpl);
  if (llms.status !== 200) {
    checks.push({ name: "llms.txt", ok: false, detail: `HTTP ${llms.status}` });
  } else {
    const stale = requiredLlmsTxtStrings().filter((r) => !llms.body.includes(r.needle));
    checks.push({
      name: "llms.txt",
      ok: stale.length === 0,
      detail:
        stale.length === 0
          ? "ราคา/อย. ตรงกับข้อมูลจริง"
          : `ข้อมูลหาย: ${stale.map((s) => s.label).join(", ")}`,
    });
  }

  // 2) robots.txt reachable + still welcomes the key AI crawlers
  const robots = await fetchText(`${SITE}/robots.txt`, fetchImpl);
  if (robots.status !== 200) {
    checks.push({ name: "robots.txt", ok: false, detail: `HTTP ${robots.status}` });
  } else {
    const missingBots = REQUIRED_AI_BOTS.filter((b) => !robots.body.includes(b));
    checks.push({
      name: "robots.txt",
      ok: missingBots.length === 0,
      detail:
        missingBots.length === 0
          ? "AI crawlers ครบ"
          : `bot หาย: ${missingBots.join(", ")}`,
    });
  }

  // 3) sitemap.xml reachable + every listed URL responds 200
  const sitemap = await fetchText(`${SITE}/sitemap.xml`, fetchImpl);
  if (sitemap.status !== 200) {
    checks.push({ name: "sitemap.xml", ok: false, detail: `HTTP ${sitemap.status}` });
  } else {
    const locs = parseSitemapLocs(sitemap.body);
    const results = await Promise.all(
      locs.map(async (u) => ({ url: u, status: (await fetchText(u, fetchImpl)).status })),
    );
    const broken = results.filter((r) => r.status !== 200);
    checks.push({
      name: "sitemap.xml",
      ok: locs.length > 0 && broken.length === 0,
      detail:
        locs.length === 0
          ? "sitemap ว่างเปล่า"
          : broken.length === 0
            ? `${locs.length} URLs ตอบ 200 ครบ`
            : `${broken.length}/${locs.length} URLs พัง: ${broken
                .slice(0, 3)
                .map((b) => `${b.url.replace(SITE, "")} (${b.status})`)
                .join(", ")}`,
    });
  }

  // 4) key pages still carry their JSON-LD / canonical / og:image
  for (const page of pagesToCheck()) {
    const res = await fetchText(`${SITE}${page.path}`, fetchImpl);
    if (res.status !== 200) {
      checks.push({ name: page.path, ok: false, detail: `HTTP ${res.status}` });
      continue;
    }
    const missing = checkPageSignals(res.body, page.jsonLd);
    checks.push({
      name: page.path,
      ok: missing.length === 0,
      detail: missing.length === 0 ? "JSON-LD/canonical/OG ครบ" : `หาย: ${missing.join(", ")}`,
    });
  }

  return { ok: checks.every((c) => c.ok), checks };
}

/** LINE-ready Thai summary of a report (short — it lands on a phone). */
export function formatHealthReport(report: HealthReport): string {
  const icon = report.ok ? "✅" : "🚨";
  const header = report.ok
    ? `${icon} AI SEO รายสัปดาห์: ผ่านทุกข้อ (${report.checks.length} รายการ)`
    : `${icon} AI SEO รายสัปดาห์: พบปัญหา ${report.checks.filter((c) => !c.ok).length} รายการ`;

  const lines = report.checks.map(
    (c) => `${c.ok ? "✓" : "✗"} ${c.name} — ${c.detail}`,
  );

  return [header, "", ...lines].join("\n");
}
