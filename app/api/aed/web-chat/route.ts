import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { WEB_CHAT_SYSTEM_PROMPT } from "@/lib/aed/web-chat-prompt";
import { countWebChatInbound, logWebChatMessage, parseSessionId } from "@/lib/aed/web-chat-log";
import { DAY, MINUTE, overLimit } from "@/lib/aed/rate-limit";
import { sanitizeChatHistory } from "@/lib/aed/web-chat-guard";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-5-5";
// Per-visitor and site-wide budgets, counted from the server-written
// transcript (aed_messages) so they hold across serverless instances.
const SESSION_MAX_PER_10_MIN = 20;
const SITE_MAX_PER_DAY = 1_500;

// ---- abuse guards -----------------------------------------------------------
// This endpoint spends real money per call (Anthropic tokens), so it must not
// be an open proxy. Three layers, all best-effort but cheap:
//  1. Browser origin allow-list — blocks other sites calling us cross-origin
//     and naive scripts that don't bother forging an Origin header.
//  2. Per-IP sliding-window rate limit — in-memory per serverless instance,
//     which still throttles any sustained single-source abuse.
//  3. Per-session and site-wide daily caps backed by the DB transcript, plus
//     hard limits on how much history one request may carry.

const SITE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com").host;
  } catch {
    return "jiaaed.com";
  }
})();

// This project's own Vercel hosts (production alias, this deployment, and the
// branch preview) — not every *.vercel.app site, which anyone can deploy.
const DEPLOYMENT_HOSTS = new Set(
  [
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
  ].filter((h): h is string => !!h),
);

function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false; // browsers always send Origin on POST
  try {
    const host = new URL(origin).host;
    return (
      host === SITE_HOST ||
      host === `www.${SITE_HOST}` ||
      SITE_HOST === `www.${host}` ||
      host === "localhost:3000" ||
      DEPLOYMENT_HOSTS.has(host)
    );
  } catch {
    return false;
  }
}

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_WINDOW = 10;
const rateHits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (rateHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_PER_WINDOW) {
    rateHits.set(ip, recent);
    return true;
  }
  recent.push(now);
  rateHits.set(ip, recent);
  if (rateHits.size > 5000) {
    for (const [key, hits] of rateHits) {
      if (hits.every((t) => now - t >= RATE_WINDOW_MS)) rateHits.delete(key);
    }
  }
  return false;
}

function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
}
// -----------------------------------------------------------------------------

type Body = {
  messages?: unknown;
  /** Random per-browser UUID from WebChat.tsx; keys the transcript in the DB. */
  sessionId?: unknown;
};


export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (isRateLimited(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "retry-after": "60" } },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[web-chat] ANTHROPIC_API_KEY not set");
    return NextResponse.json(
      { ok: false, error: "service_unavailable" },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // The widget always sends its per-browser UUID; requiring it lets the
  // per-session budget below actually bind.
  const sessionId = parseSessionId(body.sessionId);
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "missing_session" }, { status: 400 });
  }

  const messages = sanitizeChatHistory(body.messages);
  if (messages.length === 0) {
    return NextResponse.json(
      { ok: false, error: "no_messages" },
      { status: 400 },
    );
  }
  if (messages[messages.length - 1].role !== "user") {
    return NextResponse.json(
      { ok: false, error: "last_must_be_user" },
      { status: 400 },
    );
  }

  const [sessionCount, siteCount] = await Promise.all([
    countWebChatInbound(10 * MINUTE, sessionId),
    countWebChatInbound(DAY),
  ]);
  if (overLimit(sessionCount, SESSION_MAX_PER_10_MIN)) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "retry-after": "600" } },
    );
  }
  if (overLimit(siteCount, SITE_MAX_PER_DAY)) {
    console.error("[web-chat] site-wide daily budget reached:", siteCount);
    return NextResponse.json({ ok: false, error: "busy" }, { status: 503 });
  }

  // Saved before the model call so a failed turn still leaves a record.
  await logWebChatMessage(sessionId, "inbound", messages[messages.length - 1].content);

  // Fail inside maxDuration (30s) instead of the SDK default 10-minute timeout,
  // so the visitor gets an error they can act on rather than a dead spinner.
  // No retry: a second 25s attempt would be killed by the platform mid-flight.
  const client = new Anthropic({ apiKey, timeout: 25_000, maxRetries: 0 });

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: [
        {
          type: "text",
          text: WEB_CHAT_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
    });

    const reply = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!reply) {
      return NextResponse.json(
        { ok: false, error: "empty_reply" },
        { status: 502 },
      );
    }

    await logWebChatMessage(sessionId, "outbound", reply);

    return NextResponse.json({
      ok: true,
      reply,
      stopReason: res.stop_reason,
    });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    console.error("[web-chat] anthropic error:", e.status, e.message);
    return NextResponse.json(
      { ok: false, error: "upstream_error" },
      { status: 502 },
    );
  }
}
