// ─── Web chat transcript logging ──────────────────────────────────────────────
// The website chat widget (/api/aed/web-chat) used to keep its transcript only
// in the visitor's localStorage, so when the Claude API hit its usage limit
// (26–28 ก.ย. 2569) there was no way to tell whether anyone had been left
// without an answer. Each browser now sends a random session id and every turn
// is written to the same aed_conversations / aed_messages tables LINE uses,
// with channel = "web" and no customer row (web visitors are anonymous).
//
// The inbound message is saved BEFORE the model is called — same order as the
// LINE webhook — so an outage shows up as inbound rows with no reply.

import { bumpConversation, getOrCreateConversation, saveMessage } from "./db-queries";

export const WEB_CHAT_CHANNEL = "web";

const SESSION_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Accept only a UUID from the client — it becomes a DB key, so no free text. */
export function parseSessionId(value: unknown): string | null {
  return typeof value === "string" && SESSION_ID_RE.test(value) ? value.toLowerCase() : null;
}

/**
 * Best-effort: a logging failure must never cost the visitor their answer, so
 * errors are swallowed (and logged) rather than thrown.
 */
export async function logWebChatMessage(
  sessionId: string | null,
  direction: "inbound" | "outbound",
  text: string,
): Promise<void> {
  if (!sessionId) return;
  try {
    const conversation = await getOrCreateConversation(null, WEB_CHAT_CHANNEL, sessionId);
    await saveMessage(conversation.id, direction, direction === "inbound" ? "customer" : "ai", text);
    await bumpConversation(conversation.id);
  } catch (err) {
    console.error("[web-chat] transcript log failed:", err);
  }
}
