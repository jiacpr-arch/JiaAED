// ─── Ops backlog: stale bot PRs + recently auto-published news ────────────────
// article-gap / auto-optimize / auto-optimize-headline all open GitHub PRs on
// branches prefixed "claude/" (see those routes' `branch = \`claude/...\`` lines)
// but nothing ever reminded the owner if one sat unreviewed. Separately,
// news-feed auto-publishes items (hidden=false by default — no review queue
// exists), so a wrong/irrelevant item can sit live for days unnoticed. This
// module surfaces both as one weekly nudge, reusing the pure-helpers/I/O split
// from ai-seo-health.ts so the logic is unit-testable without a network or DB.

import { listOpenPullRequests, type GhOpts, type OpenPullRequest } from "./github-client";
import { createAdminClient } from "@/lib/supabase/admin";

const BOT_BRANCH_PREFIX = "claude/";
const STALE_DAYS = 7;
const RECENT_NEWS_DAYS = 3;

export type StalePr = {
  number: number;
  title: string;
  url: string;
  ageDays: number;
};

/** Bot-opened PRs (branch prefix "claude/") older than thresholdDays, oldest first. */
export function findStalePRs(
  prs: OpenPullRequest[],
  now: Date,
  thresholdDays = STALE_DAYS,
): StalePr[] {
  return prs
    .filter((pr) => pr.head.ref.startsWith(BOT_BRANCH_PREFIX))
    .map((pr) => ({
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      ageDays: Math.floor((now.getTime() - new Date(pr.created_at).getTime()) / 86_400_000),
    }))
    .filter((pr) => pr.ageDays >= thresholdDays)
    .sort((a, b) => b.ageDays - a.ageDays);
}

/** Minimal Supabase surface this module touches (injectable for tests). */
export type NewsCountClient = {
  from: (table: string) => {
    select: (
      columns: string,
      opts: { count: "exact"; head: true },
    ) => {
      eq: (col: string, val: unknown) => {
        gte: (col: string, val: string) => PromiseLike<{ count: number | null }>;
      };
    };
  };
};

/** News items auto-published (hidden=false) in the last `days` — a skim reminder. */
export async function countRecentNews(
  client: NewsCountClient,
  days = RECENT_NEWS_DAYS,
): Promise<number> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { count } = await client
    .from("aed_news_items")
    .select("*", { count: "exact", head: true })
    .eq("hidden", false)
    .gte("created_at", since);
  return count ?? 0;
}

export type OpsBacklogReport = {
  ok: boolean;
  stalePrs: StalePr[];
  recentNewsCount: number;
};

export function formatOpsBacklogReport(report: OpsBacklogReport): string {
  const icon = report.ok ? "✅" : "🔔";
  const header = report.ok
    ? `${icon} Ops รายสัปดาห์: ไม่มี PR ค้างรีวิว`
    : `${icon} Ops รายสัปดาห์: มี PR ค้างรีวิว ${report.stalePrs.length} รายการ`;

  const prLines = report.stalePrs.map(
    (pr) => `#${pr.number} "${pr.title}" — ค้าง ${pr.ageDays} วัน\n${pr.url}`,
  );

  const newsLine =
    report.recentNewsCount > 0
      ? `📰 ข่าวขึ้นเว็บอัตโนมัติ ${report.recentNewsCount} เรื่องใน ${RECENT_NEWS_DAYS} วันที่ผ่านมา — ลองแวะดู /admin/news`
      : `📰 ไม่มีข่าวใหม่ขึ้นเว็บใน ${RECENT_NEWS_DAYS} วันที่ผ่านมา`;

  return [header, "", ...prLines, newsLine].filter(Boolean).join("\n");
}

/** Fetch live state and assemble the report. Injectable GH client + Supabase client for tests. */
export async function runOpsBacklogCheck(
  gh: GhOpts,
  supabaseClient: NewsCountClient = createAdminClient() as unknown as NewsCountClient,
  now: Date = new Date(),
): Promise<OpsBacklogReport> {
  const [prs, recentNewsCount] = await Promise.all([
    listOpenPullRequests(gh),
    countRecentNews(supabaseClient),
  ]);

  const stalePrs = findStalePRs(prs, now);
  return { ok: stalePrs.length === 0, stalePrs, recentNewsCount };
}
