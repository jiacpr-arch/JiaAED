import { analyze } from "./analyze";
import { buildDigest, formatDigest, type DigestData } from "./digest";
import { notify } from "./notify";
import { formatHotLeadMessage, isHot, scoreEvents } from "./scoring";
import { createSupabaseStore, type DigestSource, type Store } from "./store";
import type { EventInput, GrowthConfig } from "./types";

export type { GrowthConfig, EventInput } from "./types";
export type { Store, DigestSource } from "./store";
export type { DigestData } from "./digest";
export type { PostHogSourceOptions } from "./posthog-store";
export { createSupabaseStore } from "./store";
export { createPostHogDigestSource } from "./posthog-store";

export function createStore(cfg: GrowthConfig): Store {
  return createSupabaseStore(cfg);
}

function minutesAgoISO(min: number): string {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

// Record an event and, if it's a hot-lead trigger, run the scoring → dedup →
// alert flow. The recordAlert insert is the atomic dedup gate, so a session is
// alerted at most once even under concurrent requests.
export async function ingestEvent(
  cfg: GrowthConfig,
  store: Store,
  event: EventInput,
): Promise<void> {
  await store.insertEvent(event);

  const { sessionId, eventName } = event;
  if (!sessionId) return;
  if (!cfg.scoring.triggerEvents.includes(eventName)) return;

  try {
    const since = minutesAgoISO(cfg.scoring.lookbackMinutes);
    if (await store.alreadyAlerted(sessionId, minutesAgoISO(60 * 24))) return;

    const events = await store.sessionEvents(sessionId, since);
    if (events.length === 0) return;

    const score = scoreEvents(events, cfg);
    if (!isHot(score, cfg)) return;

    const won = await store.recordAlert(sessionId, score);
    if (!won) return; // lost the race or already alerted

    await notify(
      cfg,
      formatHotLeadMessage(cfg, { score, pageUrl: event.pageUrl ?? null, triggerEvent: eventName }),
    );
  } catch (e) {
    console.error("[growth-kit] hot lead check failed:", e);
  }
}

function todayRangeISO(): { fromISO: string; toISO: string } {
  const now = Date.now();
  return { fromISO: new Date(now - 24 * 60 * 60 * 1000).toISOString(), toISO: new Date(now).toISOString() };
}

// Build yesterday→now digest and push it to chat. Returns the structured data
// so the caller can log it. Accepts any DigestSource (Supabase or PostHog).
export async function runDailyDigest(cfg: GrowthConfig, source: DigestSource): Promise<DigestData> {
  const range = todayRangeISO();
  const events = await source.rangeEvents(range.fromISO, range.toISO);
  const digest = buildDigest(events, range, cfg);
  await notify(cfg, formatDigest(digest));
  return digest;
}

// Build a 7-day digest, ask Claude to analyse it, and push the narrative review.
export async function runWeeklyReview(cfg: GrowthConfig, source: DigestSource): Promise<string> {
  const now = Date.now();
  const range = {
    fromISO: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
    toISO: new Date(now).toISOString(),
  };
  const events = await source.rangeEvents(range.fromISO, range.toISO);
  const digest = buildDigest(events, range, cfg);
  const review = await analyze(digest, cfg);
  await notify(cfg, review);
  return review;
}
