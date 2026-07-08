import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAnalyticsAlert, notifyAnalyticsDigest } from "@/lib/aed/notify-owner";
import { claimDailyCronRun } from "@/lib/aed/cron-once";
import {
  hasEnoughSignal,
  insertArticleIntoSource,
  proposeArticle,
  readRecentChatQuestions,
} from "@/lib/aed/article-gap";
import {
  createBranch,
  createPullRequest,
  getFile,
  getMainSha,
  updateFile,
} from "@/lib/aed/github-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FILE_PATH = "lib/aed/articles.ts";

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
      { digest_date: today, kind: "article_gap", payload },
      { onConflict: "digest_date,kind" },
    );
  } catch (e) {
    console.error("[article-gap] logRun failed:", e);
  }
}

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  // At-least-once cron gate: bail out if a twin invocation already claimed today,
  // so the article-gap LINE messages (and its PR flow) run at most once.
  if (!(await claimDailyCronRun("article_gap"))) {
    return NextResponse.json({ ok: true, skipped: "already_ran_today" });
  }

  const ghToken = process.env.GITHUB_TOKEN;
  const ghRepo = process.env.GITHUB_REPO ?? "jiacpr-arch/JiaAED";
  if (!ghToken) {
    await notifyAnalyticsAlert("🚨 Article-gap: ไม่มี GITHUB_TOKEN");
    return NextResponse.json({ ok: false, reason: "no_github_token" }, { status: 500 });
  }
  const [owner, repo] = ghRepo.split("/");
  const gh = { token: ghToken, owner, repo };

  const result: Record<string, unknown> = {};

  try {
    const sample = await readRecentChatQuestions();
    result.sample_size = sample.sample.length;
    result.total_messages = sample.total_messages;

    if (!hasEnoughSignal(sample)) {
      await notifyAnalyticsDigest(
        `⏸️ Article-gap skip: คำถามจากแชทใน 2 สัปดาห์น้อยเกิน (${sample.sample.length})`,
      );
      await logRun({ ...result, skipped: "small_sample" });
      return NextResponse.json({ ok: true, skipped: "small_sample" });
    }

    await notifyAnalyticsDigest(
      `📚 Article-gap: วิเคราะห์ ${sample.sample.length} คำถาม กำลังให้ Claude หาช่องว่างความรู้...`,
    );

    const proposal = await proposeArticle(sample);
    result.proposal = {
      slug: proposal.slug,
      title: proposal.title,
      tags: proposal.tags,
      length: proposal.content.length,
    };

    const file = await getFile(gh, FILE_PATH, "main");
    const newContent = insertArticleIntoSource(file.content, proposal);

    if (newContent === file.content) {
      await notifyAnalyticsAlert("🚨 Article-gap: insert ไม่เปลี่ยน source");
      await logRun({ ...result, error: "no_change" });
      return NextResponse.json({ ok: false, error: "no_change" });
    }

    const ts = Date.now().toString(36);
    const branch = `claude/article-${proposal.slug}-${ts}`;
    const baseSha = await getMainSha(gh);
    await createBranch(gh, branch, baseSha);

    await updateFile(gh, {
      path: FILE_PATH,
      content: newContent,
      sha: file.sha,
      branch,
      message: `auto: propose article "${proposal.title}"

Generated from ${sample.sample.length} recent chat questions.
Slug: ${proposal.slug}
Tags: ${proposal.tags.join(", ")}

[article-gap]`,
    });

    const pr = await createPullRequest(gh, {
      title: `auto: บทความใหม่ "${proposal.title}"`,
      body: [
        `## Auto-generated article proposal`,
        ``,
        `**Slug:** \`${proposal.slug}\``,
        `**Title:** ${proposal.title}`,
        `**Description:** ${proposal.description}`,
        `**Read time:** ${proposal.read_minutes} min`,
        `**Tags:** ${proposal.tags.join(", ")}`,
        ``,
        `**Generated from:** ${sample.sample.length} questions in the past 14 days`,
        ``,
        `---`,
        ``,
        `⚠️ **Not auto-merged.** Article content needs human review for brand voice, accuracy, and regulatory compliance (no medical claims, no อย./ฆพ. mentions).`,
        `Review the diff in \`lib/aed/articles.ts\` and merge if it looks good.`,
      ].join("\n"),
      head: branch,
      base: "main",
      draft: true,
    });
    result.pr = { number: pr.number, url: pr.html_url };

    await notifyAnalyticsDigest(
      `📚 บทความใหม่เสนอแล้ว (draft):\n"${proposal.title}"\nREVIEW: ${pr.html_url}`,
    );

    await logRun(result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = String(err).slice(0, 300);
    console.error("[article-gap] failed:", err);
    await notifyAnalyticsAlert(`🚨 Article-gap error:\n${msg}`);
    await logRun({ ...result, error: msg });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
