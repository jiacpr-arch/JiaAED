import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { WEB_CHAT_SYSTEM_PROMPT } from "@/lib/aed/web-chat-prompt";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-4-6";
const MAX_TURNS = 30;
const MAX_INPUT_CHARS = 4000;

// ---- abuse guards -----------------------------------------------------------
// This endpoint spends real money per call (Anthropic tokens), so it must not
// be an open proxy. Two layers, both best-effort but cheap:
//  1. Browser origin allow-list — blocks other sites calling us cross-origin
//     and naive scripts that don't bother forging an Origin header.
//  2. Per-IP sliding-window rate limit — in-memory per serverless instance,
//     which still throttles any sustained single-source abuse.

const SITE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com").host;
  } catch {
    return "jiaaed.com";
  }
})();

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
      host.endsWith(".vercel.app") // preview deployments
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

type Role = "user" | "assistant";
type ChatMsg = { role: Role; content: string };

type Body = {
  messages?: ChatMsg[];
};

function sanitize(messages: ChatMsg[]): ChatMsg[] {
  return messages
    .filter(
      (m): m is ChatMsg =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_TURNS)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_INPUT_CHARS),
    }));
}

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

  const messages = sanitize(body.messages ?? []);
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

  const client = new Anthropic({ apiKey });

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
