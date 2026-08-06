import { describe, it, expect } from "vitest";
import {
  parseSitemapLocs,
  checkPageSignals,
  requiredLlmsTxtStrings,
  runAiSeoHealthCheck,
  formatHealthReport,
} from "./ai-seo-health";
import { primedicModels } from "./primedic";

// The weekly health check is the alarm that tells the owner a deploy silently
// broke the AI-facing surface (llms.txt prices, JSON-LD, sitemap). A false
// "ผ่านทุกข้อ" hides a real regression, so pin the pass/fail mapping for each
// signal the checker reads.

describe("parseSitemapLocs", () => {
  it("extracts every <loc> URL", () => {
    const xml = `<?xml version="1.0"?><urlset>
      <url><loc>https://jiaaed.com/</loc></url>
      <url><loc>https://jiaaed.com/aed/rental</loc></url>
    </urlset>`;
    expect(parseSitemapLocs(xml)).toEqual([
      "https://jiaaed.com/",
      "https://jiaaed.com/aed/rental",
    ]);
  });

  it("returns empty for a body with no locs", () => {
    expect(parseSitemapLocs("<urlset></urlset>")).toEqual([]);
  });
});

describe("checkPageSignals", () => {
  const healthy =
    '<link rel="canonical" href="x"/><meta property="og:image" content="y"/>' +
    '<script type="application/ld+json">{"@type":"Product","x":1}</script>';

  it("passes a page with JSON-LD type, canonical and og:image", () => {
    expect(checkPageSignals(healthy, ["Product"])).toEqual([]);
  });

  it("reports each missing signal by name", () => {
    const missing = checkPageSignals("<html></html>", ["Product", "FAQPage"]);
    expect(missing).toEqual([
      "JSON-LD Product",
      "JSON-LD FAQPage",
      "canonical",
      "og:image",
    ]);
  });
});

describe("requiredLlmsTxtStrings", () => {
  it("demands the current price of every model (Thai-formatted)", () => {
    const needles = requiredLlmsTxtStrings().map((r) => r.needle);
    for (const m of primedicModels) {
      expect(needles).toContain(`฿${m.price.toLocaleString("th-TH")}`);
    }
  });
});

// Fake fetch serving a fully healthy site, so the end-to-end runner can be
// exercised without a network. Individual tests then break one URL at a time.
function healthySite(): Record<string, string> {
  const pageHtml =
    '<link rel="canonical" href="x"/><meta property="og:image" content="y"/>' +
    '<script type="application/ld+json">' +
    JSON.stringify([
      { "@type": "Organization" },
      { "@type": "Product" },
      { "@type": "FAQPage" },
      { "@type": "Article" },
      { "@type": "BreadcrumbList" },
    ]).replace(/\[|\]/g, "") +
    "</script>";

  const llms = requiredLlmsTxtStrings()
    .map((r) => r.needle)
    .join("\n");

  return {
    "/llms.txt": llms,
    "/robots.txt": "GPTBot ClaudeBot PerplexityBot Google-Extended",
    "/sitemap.xml": "<urlset><url><loc>https://jiaaed.com/</loc></url></urlset>",
    __page__: pageHtml,
  };
}

function fakeFetch(site: Record<string, string>, downPaths: string[] = []) {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const path = url.replace(/^https?:\/\/[^/]+/, "") || "/";
    if (downPaths.includes(path)) {
      return new Response("", { status: 500 });
    }
    const body = site[path] ?? site.__page__;
    return new Response(body, { status: 200 });
  }) as typeof fetch;
}

describe("runAiSeoHealthCheck", () => {
  it("passes on a fully healthy site", async () => {
    const report = await runAiSeoHealthCheck(fakeFetch(healthySite()));
    expect(report.ok).toBe(true);
    expect(report.checks.every((c) => c.ok)).toBe(true);
  });

  it("fails llms.txt when a live price no longer matches lib data", async () => {
    const site = healthySite();
    site["/llms.txt"] = site["/llms.txt"].replace(
      `฿${primedicModels[0].price.toLocaleString("th-TH")}`,
      "฿99,999",
    );
    const report = await runAiSeoHealthCheck(fakeFetch(site));
    const llmsCheck = report.checks.find((c) => c.name === "llms.txt");
    expect(report.ok).toBe(false);
    expect(llmsCheck?.ok).toBe(false);
    expect(llmsCheck?.detail).toContain(primedicModels[0].name);
  });

  it("fails robots.txt when an AI bot disappears", async () => {
    const site = healthySite();
    site["/robots.txt"] = "GPTBot only";
    const report = await runAiSeoHealthCheck(fakeFetch(site));
    const robots = report.checks.find((c) => c.name === "robots.txt");
    expect(robots?.ok).toBe(false);
    expect(robots?.detail).toContain("ClaudeBot");
  });

  it("fails sitemap when a listed URL is broken", async () => {
    const report = await runAiSeoHealthCheck(
      fakeFetch(healthySite(), ["/"]),
    );
    const sitemap = report.checks.find((c) => c.name === "sitemap.xml");
    expect(sitemap?.ok).toBe(false);
    expect(sitemap?.detail).toContain("พัง");
  });
});

describe("formatHealthReport", () => {
  it("labels an all-pass report ✅ and a failing one 🚨", () => {
    const pass = formatHealthReport({
      ok: true,
      checks: [{ name: "llms.txt", ok: true, detail: "ok" }],
    });
    expect(pass).toContain("✅");

    const fail = formatHealthReport({
      ok: false,
      checks: [{ name: "llms.txt", ok: false, detail: "HTTP 500" }],
    });
    expect(fail).toContain("🚨");
    expect(fail).toContain("✗ llms.txt — HTTP 500");
  });
});
