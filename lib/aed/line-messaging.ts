// Customer-facing LINE Messaging API calls for the JiaAED OA (the admin
// alerts live in notify-owner.ts). Every call has a timeout and reports
// success, so callers can fall back instead of silently losing a reply.

import { chunkForLine } from "./notify-owner";

const LINE_API = "https://api.line.me/v2/bot/message";
const MAX_MESSAGES_PER_CALL = 5; // LINE's limit for reply and push

function textMessages(text: string) {
  return chunkForLine(text)
    .slice(0, MAX_MESSAGES_PER_CALL)
    .map((t) => ({ type: "text", text: t }));
}

async function post(
  path: "reply" | "push",
  body: Record<string, unknown>,
  retryKey?: string,
): Promise<boolean> {
  const token = process.env.AED_LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`${LINE_API}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(retryKey ? { "X-Line-Retry-Key": retryKey } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    // 409 with a retry key = LINE already accepted this exact request earlier
    // (our previous attempt timed out after it went through): delivered.
    if (retryKey && res.status === 409) return true;
    if (!res.ok) {
      console.error(`[AED] LINE ${path} failed:`, res.status, await res.text().catch(() => ""));
    }
    return res.ok;
  } catch (e) {
    console.error(`[AED] LINE ${path} threw:`, e);
    return false;
  }
}

/**
 * Push API — counts against the OA's monthly message quota. Pass a stable
 * UUID as `retryKey` when the same push may be retried (LINE dedupes it for
 * 24h), so a timeout that hid a successful send can't deliver it twice.
 */
export function pushText(to: string, text: string, opts: { retryKey?: string } = {}): Promise<boolean> {
  return post("push", { to, messages: textMessages(text) }, opts.retryKey);
}

/**
 * Answer an inbound event. The reply API is free (doesn't use the monthly
 * push quota) but each token works once and expires after about a minute,
 * so fall back to a push when there's no token or the reply is refused.
 */
export async function replyOrPush(
  target: { replyToken?: string | null; userId: string },
  text: string,
): Promise<boolean> {
  if (target.replyToken && (await post("reply", { replyToken: target.replyToken, messages: textMessages(text) }))) {
    return true;
  }
  return pushText(target.userId, text);
}
