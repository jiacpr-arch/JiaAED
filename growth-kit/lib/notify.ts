import type { ChannelConfig, GrowthConfig } from "./types";

async function pushLine(ch: Extract<ChannelConfig, { kind: "line" }>, text: string): Promise<void> {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { Authorization: `Bearer ${ch.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to: ch.to, messages: [{ type: "text", text }] }),
  });
  if (!res.ok) console.error("[growth-kit] LINE push failed:", res.status, await res.text());
}

async function pushTelegram(
  ch: Extract<ChannelConfig, { kind: "telegram" }>,
  text: string,
): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${ch.botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: ch.chatId, text, disable_web_page_preview: true }),
  });
  if (!res.ok) console.error("[growth-kit] Telegram push failed:", res.status, await res.text());
}

// Fan a plain-text message out to every configured channel. Channels with
// missing credentials are skipped with a warning rather than throwing, so a
// misconfigured channel never blocks the others.
export async function notify(cfg: GrowthConfig, text: string): Promise<void> {
  await Promise.all(
    cfg.channels.map((ch) => {
      if (ch.kind === "line") {
        if (!ch.accessToken || !ch.to) {
          console.warn("[growth-kit] LINE channel skipped — missing credentials");
          return Promise.resolve();
        }
        return pushLine(ch, text);
      }
      if (!ch.botToken || !ch.chatId) {
        console.warn("[growth-kit] Telegram channel skipped — missing credentials");
        return Promise.resolve();
      }
      return pushTelegram(ch, text);
    }),
  );
}
