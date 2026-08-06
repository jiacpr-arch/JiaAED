import { describe, it, expect } from "vitest";
import {
  findStalePRs,
  countRecentNews,
  formatOpsBacklogReport,
  type NewsCountClient,
} from "./bot-backlog";
import type { OpenPullRequest } from "./github-client";

// article-gap/auto-optimize/auto-optimize-headline all open PRs on "claude/*"
// branches with zero follow-up if nobody reviews them. This is the alarm for
// that — pin exactly which PRs count as "stale" and which don't.

const NOW = new Date("2026-08-13T00:00:00Z"); // a Thursday, one week after the plan's Monday cron

function pr(overrides: Partial<OpenPullRequest> & { ref: string; daysOld: number }): OpenPullRequest {
  const created = new Date(NOW.getTime() - overrides.daysOld * 86_400_000);
  return {
    number: overrides.number ?? 1,
    title: overrides.title ?? "some PR",
    html_url: overrides.html_url ?? "https://github.com/x/y/pull/1",
    head: { ref: overrides.ref },
    created_at: created.toISOString(),
  };
}

describe("findStalePRs", () => {
  it("flags a bot PR older than the threshold", () => {
    const prs = [pr({ ref: "claude/article-x-123", daysOld: 10, number: 5 })];
    const stale = findStalePRs(prs, NOW);
    expect(stale).toHaveLength(1);
    expect(stale[0].number).toBe(5);
    expect(stale[0].ageDays).toBe(10);
  });

  it("does not flag a fresh bot PR", () => {
    const prs = [pr({ ref: "claude/article-x-123", daysOld: 2 })];
    expect(findStalePRs(prs, NOW)).toHaveLength(0);
  });

  it("ignores PRs not opened by a bot (no claude/ prefix)", () => {
    const prs = [pr({ ref: "feature/manual-fix", daysOld: 30 })];
    expect(findStalePRs(prs, NOW)).toHaveLength(0);
  });

  it("respects a custom threshold and sorts oldest-first", () => {
    const prs = [
      pr({ ref: "claude/a", daysOld: 8, number: 1 }),
      pr({ ref: "claude/b", daysOld: 20, number: 2 }),
    ];
    const stale = findStalePRs(prs, NOW, 5);
    expect(stale.map((p) => p.number)).toEqual([2, 1]);
  });

  it("returns empty for no open PRs", () => {
    expect(findStalePRs([], NOW)).toEqual([]);
  });
});

describe("countRecentNews", () => {
  function fakeClient(count: number | null): NewsCountClient {
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            gte: () => Promise.resolve({ count }),
          }),
        }),
      }),
    };
  }

  it("returns the count from the client", async () => {
    expect(await countRecentNews(fakeClient(4))).toBe(4);
  });

  it("treats a null count as zero", async () => {
    expect(await countRecentNews(fakeClient(null))).toBe(0);
  });
});

describe("formatOpsBacklogReport", () => {
  it("uses a calm ✅ header with no stale PRs", () => {
    const text = formatOpsBacklogReport({ ok: true, stalePrs: [], recentNewsCount: 0 });
    expect(text).toContain("✅");
    expect(text).not.toContain("🔔");
  });

  it("lists every stale PR with its age and link", () => {
    const text = formatOpsBacklogReport({
      ok: false,
      stalePrs: [{ number: 7, title: "auto: บทความใหม่", url: "https://x/pull/7", ageDays: 12 }],
      recentNewsCount: 0,
    });
    expect(text).toContain("🔔");
    expect(text).toContain("#7");
    expect(text).toContain("12 วัน");
    expect(text).toContain("https://x/pull/7");
  });

  it("mentions recent news count when nonzero", () => {
    const text = formatOpsBacklogReport({ ok: true, stalePrs: [], recentNewsCount: 3 });
    expect(text).toContain("3 เรื่อง");
  });
});
