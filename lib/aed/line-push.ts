export async function pushLineMessage(lineUserId: string, text: string): Promise<void> {
  const token = process.env.AED_LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.warn("[AED] line push skipped — AED_LINE_CHANNEL_ACCESS_TOKEN not set");
    return;
  }

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to: lineUserId, messages: [{ type: "text", text }] }),
  });

  if (!res.ok) console.error("[AED] line push failed:", res.status, await res.text());
}
