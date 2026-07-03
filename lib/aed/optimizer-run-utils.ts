// Shared plumbing for the two auto-optimizer crons (HeroCta copy +
// HeroHeadline). Both follow the same commit → wait for CI → merge →
// health-check → maybe-revert loop; keeping the loop utilities here stops the
// two routes from drifting apart.

import { createAdminClient } from "@/lib/supabase/admin";
import { listCheckRuns } from "@/lib/aed/github-client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jiaaed.com";
const HEALTH_PATHS = ["/", "/docs", "/articles"];

export async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Upsert the run summary into the digest log under the given kind. */
export async function logOptimizerRun(
  kind: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    await supabase.from("aed_analytics_digest_log").upsert(
      { digest_date: today, kind, payload },
      { onConflict: "digest_date,kind" },
    );
  } catch (e) {
    console.error(`[${kind}] logRun failed:`, e);
  }
}

/** Poll the PR head's check runs until all pass, any fails, or 4 min elapse. */
export async function waitForChecks(
  gh: { token: string; owner: string; repo: string },
  sha: string,
): Promise<{ ok: boolean; detail: string }> {
  const deadline = Date.now() + 4 * 60 * 1000;
  let lastStatus = "no checks yet";
  while (Date.now() < deadline) {
    const runs = await listCheckRuns(gh, sha).catch(() => null);
    if (runs && runs.check_runs.length > 0) {
      const failed = runs.check_runs.find(
        (r) => r.conclusion === "failure" || r.conclusion === "cancelled",
      );
      if (failed) return { ok: false, detail: `${failed.name}: ${failed.conclusion}` };
      const allDone = runs.check_runs.every((r) => r.status === "completed");
      if (allDone) {
        const allPass = runs.check_runs.every(
          (r) =>
            r.conclusion === "success" ||
            r.conclusion === "neutral" ||
            r.conclusion === "skipped",
        );
        return allPass
          ? { ok: true, detail: `${runs.check_runs.length} checks passed` }
          : { ok: false, detail: `checks finished with non-success` };
      }
      lastStatus = `${runs.check_runs.length} checks, waiting…`;
    }
    await sleep(15000);
  }
  return { ok: false, detail: `timeout — last: ${lastStatus}` };
}

/** After merge+deploy, verify key production pages still return 2xx. */
export async function healthCheck(): Promise<{ ok: boolean; detail: string }> {
  await sleep(45000); // give production deploy time to roll out
  for (const path of HEALTH_PATHS) {
    try {
      const res = await fetch(`${SITE_URL}${path}`, { method: "GET", cache: "no-store" });
      if (!res.ok) return { ok: false, detail: `${path} → ${res.status}` };
    } catch (e) {
      return { ok: false, detail: `${path} → ${String(e).slice(0, 100)}` };
    }
  }
  return { ok: true, detail: `${HEALTH_PATHS.length} paths returned 2xx` };
}
