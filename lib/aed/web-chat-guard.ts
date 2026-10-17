// History limits for the public web chat (/api/aed/web-chat). The widget
// re-sends the whole transcript every turn and the server pays for every token
// of it, so the request is trimmed here before it reaches the model.

export type ChatRole = "user" | "assistant";
export type ChatMsg = { role: ChatRole; content: string };

export const MAX_TURNS = 20;
export const MAX_INPUT_CHARS = 2000;
// Whole-history budget, or one request could carry ~30×4k chars of tokens.
export const MAX_TOTAL_CHARS = 12_000;

export function sanitizeChatHistory(raw: unknown): ChatMsg[] {
  if (!Array.isArray(raw)) return [];
  const messages = raw
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

  // Keep the newest turns that fit the total budget, then make sure the
  // conversation still opens with a user turn.
  let total = 0;
  let start = messages.length;
  while (start > 0 && total + messages[start - 1].content.length <= MAX_TOTAL_CHARS) {
    total += messages[start - 1].content.length;
    start--;
  }
  const kept = messages.slice(start);
  while (kept.length > 0 && kept[0].role !== "user") kept.shift();
  return kept;
}
