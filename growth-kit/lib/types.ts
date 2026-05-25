// Growth Kit — shared types.
// A config-driven distillation of the JiaAED analytics → AI insight → chat-alert
// system, made brand-agnostic so it can be cloned onto another project.

export type ChannelConfig =
  | { kind: "line"; accessToken: string; to: string }
  | { kind: "telegram"; botToken: string; chatId: string };

export type StoreConfig = {
  kind: "supabase";
  url: string;
  serviceRoleKey: string;
  table: string;
};

export type ScoringConfig = {
  // event name -> points. e.g. { line_click: 5, lead_form_start: 3 }
  weights: Record<string, number>;
  // only these events run a hot-lead check (keeps writes cheap)
  triggerEvents: string[];
  hotThreshold: number;
  lookbackMinutes: number;
};

export type DigestConfig = {
  // events counted as a conversion (e.g. ["line_click", "lead_form_submit"])
  conversionEvents: string[];
  // ordered funnel steps (event names) for step-to-step drop-off
  funnel: string[];
  // emit a "no conversions" alert once visits cross this in the window
  minVisitsForAlert: number;
};

export type LlmConfig = {
  apiKey: string;
  model: string;
  systemPrompt: string;
  maxTokens: number;
};

export type GrowthConfig = {
  brand: string;
  locale: string; // e.g. "th-TH"
  timezone: string; // e.g. "Asia/Bangkok"
  channels: ChannelConfig[];
  store: StoreConfig;
  scoring: ScoringConfig;
  digest: DigestConfig;
  llm: LlmConfig;
};

export type EventInput = {
  eventName: string;
  sessionId: string | null;
  pageUrl?: string | null;
  properties?: Record<string, unknown>;
  utmSource?: string | null;
  utmCampaign?: string | null;
  gclid?: string | null;
};

export type StoredEvent = {
  event_name: string;
  properties: Record<string, unknown> | null;
  session_id: string | null;
  page_url: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  gclid: string | null;
  created_at: string;
};

export type SessionScore = {
  score: number;
  reasons: string[];
  events: number;
  utmSource: string | null;
  utmCampaign: string | null;
};

export const HOT_LEAD_ALERT_EVENT = "hot_lead_alert_fired";
