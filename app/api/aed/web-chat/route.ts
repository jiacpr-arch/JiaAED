import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { WEB_CHAT_SYSTEM_PROMPT } from "@/lib/aed/web-chat-prompt";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-4-6";
const MAX_TURNS = 30;
const MAX_INPUT_CHARS = 4000;

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
