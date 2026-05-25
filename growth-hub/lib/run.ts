import {
  runDailyDigest,
  runWeeklyReview,
  type DigestSource,
  type GrowthConfig,
} from "../../growth-kit/lib";
import { loadTenants, resolveDigestSource, resolveGrowthConfig } from "./tenants";

export type RunResult = { id: string; ok: boolean; detail?: string };

// One tenant failing must not stop the others — each is isolated in try/catch.
async function forEachTenant(
  fn: (cfg: GrowthConfig, source: DigestSource) => Promise<string>,
): Promise<RunResult[]> {
  const tenants = await loadTenants();
  const results: RunResult[] = [];
  for (const t of tenants) {
    try {
      const detail = await fn(resolveGrowthConfig(t), resolveDigestSource(t));
      results.push({ id: t.id, ok: true, detail });
    } catch (e) {
      console.error(`[growth-hub] tenant ${t.id} failed:`, e);
      results.push({ id: t.id, ok: false, detail: String(e) });
    }
  }
  return results;
}

export function runAllDailyDigests(): Promise<RunResult[]> {
  return forEachTenant(async (cfg, source) => {
    const d = await runDailyDigest(cfg, source);
    return `visits=${d.visits} alerts=${d.alerts.length}`;
  });
}

export function runAllWeeklyReviews(): Promise<RunResult[]> {
  return forEachTenant(async (cfg, source) => {
    const review = await runWeeklyReview(cfg, source);
    return `review_len=${review.length}`;
  });
}
