import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAnalyticsAlert, notifyAnalyticsDigest } from "@/lib/aed/notify-owner";
import {
  buildNewHeroHeadlineFile,
  extractHeadline,
  proposeNewHeadline,
  readHeadlineAbState,
} from "@/lib/aed/auto-optimizer-headline";
import {
  createBranch,
  createPullRequest,
  getFile,
  getMainSha,
  listCheckRuns,
  mergePullRequest,
  updateFile,
} from "@/lib/aed/github-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FILE_PATH = "app/components/HeroHeadline.tsx";
const SITE_URL = "https://www.jiaaed.com";
const HEALTH_PATHS = ["/", "/docs", "/articles"];

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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
      { digest_date: today, kind: "auto_optimize_headline", payload },
      { onConflict: "digest_date,kind" },
    );
  } catch (e) {
    console.error("[auto-optimize-headline] logRun failed:", e);
  }
}

async function waitForChecks(
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

async function healthCheck(): Promise<{ ok: boolean; detail: string }> {
  await sleep(45000);
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

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const ghToken = process.env.GITHUB_TOKEN;
  const ghRepo = process.env.GITHUB_REPO ?? "jiacpr-arch/JiaAED";
  if (!ghToken) {
    await notifyAnalyticsAlert("🚨 Auto-optimizer-headline: ไม่มี GITHUB_TOKEN");
    return NextResponse.json({ ok: false, reason: "no_github_token" }, { status: 500 });
  }
  const [owner, repo] = ghRepo.split("/");
  const gh = { token: ghToken, owner, repo };

  const result: Record<string, unknown> = { steps: [] as string[] };
  const steps = result.steps as string[];

  try {
    await notifyAnalyticsDigest("🤖 Auto-optimizer-headline เริ่ม — วิเคราะห์ A/B headline");
    steps.push("start");

    const ab = await readHeadlineAbState(7);
    result.ab = ab;

    if (ab.sample_too_small) {
      const msg = `⏸️ Headline skip: A/B sample เล็กเกิน (A=${ab.a_views} / B=${ab.b_views}) ต้อง ≥ 30 ต่อ variant`;
      await notifyAnalyticsDigest(msg);
      steps.push("skip_small");
      await logRun(result);
      return NextResponse.json({ ok: true, skipped: "small_sample", ab });
    }
    if (Math.abs(ab.a_ctr - ab.b_ctr) < 0.5) {
      const msg = `⏸️ Headline skip: CTR ใกล้กัน A=${ab.a_ctr}% B=${ab.b_ctr}%`;
      await notifyAnalyticsDigest(msg);
      steps.push("skip_tie");
      await logRun(result);
      return NextResponse.json({ ok: true, skipped: "tie", ab });
    }

    steps.push("read_file");
    const file = await getFile(gh, FILE_PATH, "main");
    const loserHeadline = extractHeadline(file.content, ab.loser);
    const winnerHeadline = extractHeadline(file.content, ab.winner);
    result.loser_headline = loserHeadline;
    result.winner_headline = winnerHeadline;

    await notifyAnalyticsDigest(
      `📊 Loser ${ab.loser.toUpperCase()}: "${loserHeadline.line1} | ${loserHeadline.accent} | ${loserHeadline.line2}" (CTR ${ab.loser_ctr.toFixed(1)}%)\n🧠 ขอ headline ใหม่จาก Claude...`,
    );

    steps.push("propose");
    const proposed = await proposeNewHeadline({
      ab,
      current_loser: loserHeadline,
      current_winner: winnerHeadline,
    });
    result.proposed = proposed;

    const sig = `${proposed.line1}|${proposed.accent}|${proposed.line2}`;
    const loserSig = `${loserHeadline.line1}|${loserHeadline.accent}|${loserHeadline.line2}`;
    const winnerSig = `${winnerHeadline.line1}|${winnerHeadline.accent}|${winnerHeadline.line2}`;
    if (sig === loserSig || sig === winnerSig) {
      await notifyAnalyticsDigest(`⏸️ AI proposed headline ซ้ำ ข้ามรอบนี้`);
      steps.push("skip_duplicate");
      await logRun(result);
      return NextResponse.json({ ok: true, skipped: "duplicate" });
    }

    steps.push("build_diff");
    const newContent = buildNewHeroHeadlineFile(file.content, {
      loser: ab.loser,
      newHeadline: proposed,
    });

    const ts = Date.now().toString(36);
    const branch = `claude/auto-headline-${ts}`;
    const commitMessage = `auto: swap hero headline variant ${ab.loser.toUpperCase()}

Variant ${ab.loser.toUpperCase()} CTR was ${ab.loser_ctr.toFixed(1)}% over the
last 7 days (vs ${ab.winner_ctr.toFixed(1)}% for variant ${ab.winner.toUpperCase()}).
Replacing the loser with a new headline proposed by Claude.

New: "${proposed.line1} | ${proposed.accent} | ${proposed.line2}"
Rationale: ${proposed.rationale}

[auto-optimizer-headline]`;

    steps.push("create_branch");
    const baseSha = await getMainSha(gh);
    await createBranch(gh, branch, baseSha);

    steps.push("commit");
    await updateFile(gh, {
      path: FILE_PATH,
      content: newContent,
      sha: file.sha,
      branch,
      message: commitMessage,
    });

    steps.push("open_pr");
    const pr = await createPullRequest(gh, {
      title: `auto: swap hero headline variant ${ab.loser.toUpperCase()}`,
      body: [
        `## Auto-generated by weekly headline optimizer`,
        ``,
        `**Loser:** variant ${ab.loser.toUpperCase()} (CTR ${ab.loser_ctr.toFixed(1)}%)`,
        `\`${loserHeadline.line1} | ${loserHeadline.accent} | ${loserHeadline.line2}\``,
        ``,
        `**Winner:** variant ${ab.winner.toUpperCase()} (CTR ${ab.winner_ctr.toFixed(1)}%)`,
        `\`${winnerHeadline.line1} | ${winnerHeadline.accent} | ${winnerHeadline.line2}\``,
        ``,
        `**New headline (replacing loser):**`,
        `\`${proposed.line1} | ${proposed.accent} | ${proposed.line2}\``,
        ``,
        `**AI rationale:** ${proposed.rationale}`,
        ``,
        `---`,
        `Auto-merge after checks pass. Revert on health failure. Same safety as the CTA optimizer.`,
      ].join("\n"),
      head: branch,
      base: "main",
      draft: false,
    });
    result.pr_number = pr.number;
    result.pr_url = pr.html_url;

    await notifyAnalyticsDigest(
      `🔀 PR #${pr.number} เปิดแล้ว (headline)\n${pr.html_url}`,
    );

    steps.push("wait_checks");
    const checks = await waitForChecks(gh, pr.head.sha);
    result.checks = checks;
    if (!checks.ok) {
      await notifyAnalyticsAlert(
        `🚨 Headline optimizer: checks ไม่ผ่าน (${checks.detail}) PR #${pr.number} ค้างไว้`,
      );
      steps.push("aborted_checks");
      await logRun(result);
      return NextResponse.json({ ok: false, stage: "checks_failed", ...result });
    }

    await notifyAnalyticsDigest(`✅ Checks ผ่าน — กำลัง merge headline PR`);

    steps.push("merge");
    const mergeRes = await mergePullRequest(gh, pr.number, "squash");
    result.merge = mergeRes;

    await notifyAnalyticsDigest(`🚀 Headline merged — รอ deploy + health check`);

    steps.push("health_check");
    const health = await healthCheck();
    result.health = health;

    if (!health.ok) {
      steps.push("revert_attempt");
      await notifyAnalyticsAlert(
        `🚨🚨 Headline merge → health fail: ${health.detail}\nพยายาม revert...`,
      );
      try {
        const latest = await getFile(gh, FILE_PATH, "main");
        const revertBranch = `claude/auto-headline-revert-${ts}`;
        const mainSha = await getMainSha(gh);
        await createBranch(gh, revertBranch, mainSha);
        await updateFile(gh, {
          path: FILE_PATH,
          content: file.content,
          sha: latest.sha,
          branch: revertBranch,
          message: `auto-revert: restore HeroHeadline variant ${ab.loser.toUpperCase()} after health failure\n\n${health.detail}\n\n[auto-optimizer-headline-revert]`,
        });
        const revertPr = await createPullRequest(gh, {
          title: `auto-revert: HeroHeadline after health failure`,
          body: `Health failed after #${pr.number}: ${health.detail}`,
          head: revertBranch,
          base: "main",
        });
        const revertMerge = await mergePullRequest(gh, revertPr.number, "squash");
        result.revert = { pr: revertPr.number, sha: revertMerge.sha };
        await notifyAnalyticsDigest(`✅ Revert merged (PR #${revertPr.number})`);
        steps.push("reverted");
      } catch (revertErr) {
        await notifyAnalyticsAlert(`💀 Revert headline ล้มเหลว: ${String(revertErr).slice(0, 200)}`);
        steps.push("revert_failed");
      }
      await logRun(result);
      return NextResponse.json({ ok: false, stage: "health_failed", ...result });
    }

    await notifyAnalyticsDigest(
      `🟢 Headline เสร็จสมบูรณ์!\nVariant ${ab.loser.toUpperCase()} ตอนนี้คือ:\n"${proposed.line1} | ${proposed.accent} | ${proposed.line2}"`,
    );
    steps.push("done");
    await logRun(result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = String(err).slice(0, 300);
    console.error("[auto-optimize-headline] failed:", err);
    await notifyAnalyticsAlert(
      `🚨 Auto-optimizer-headline error:\n${msg}\nSteps: ${steps.join(" → ")}`,
    );
    result.error = msg;
    await logRun(result);
    return NextResponse.json({ ok: false, error: msg, ...result }, { status: 500 });
  }
}
