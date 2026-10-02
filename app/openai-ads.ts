// Public Pixel identifier confirmed in Ads Manager; never put CAPI keys here.
export const PIXEL_ID = "BdD4WtpgY9GTcdMr3mEhys";
// Keep disabled until automatic customer matching is resolved and activation is approved.
export const OPENAI_ADS_ENABLED = false;
const ALLOWED_HOSTS = ["jiaaed.com", "www.jiaaed.com"];

function allowedHost() {
  return ALLOWED_HOSTS.includes(window.location.hostname) ||
    ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}

type Queue = ((...args: unknown[]) => void) & { q?: IArguments[] };
type PixelWindow = Window & {
  oaiq?: Queue;
  jiaOpenAiAds?: { initialized: boolean; enabled: boolean; lastPath: string | null };
};

// This whole boundary is best effort: tracking must never interrupt a contact flow.
export function setPixelConsent(accepted: boolean) {
  try {
    if (!OPENAI_ADS_ENABLED || typeof window === "undefined") return;
    if (!allowedHost()) return;
    const w = window as PixelWindow;
    const state = w.jiaOpenAiAds ??= { initialized: false, enabled: false, lastPath: null };
    state.enabled = accepted;
    if (!accepted) {
      state.lastPath = null;
      w.oaiq?.("consent", false);
      return;
    }
    if (!state.initialized) {
      // An unknown initializer may belong to another integration. Do not duplicate it.
      if (w.oaiq) { state.enabled = false; return; }
      // The SDK requires queued Arguments objects.
      // eslint-disable-next-line prefer-rest-params
      const queue = function () { queue.q!.push(arguments); } as Queue;
      queue.q = [];
      w.oaiq = queue;
      queue("consent", false);
      queue("init", { pixelId: PIXEL_ID });
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://bzrcdn.openai.com/sdk/oaiq.min.js";
      script.dataset.jiaOpenaiPixel = "true";
      document.head.appendChild(script);
      state.initialized = true;
    }
    w.oaiq?.("consent", true);
  } catch { /* Business UI remains usable if storage, CSP or the SDK fails. */ }
}

function measure(name: string, type: string, customName?: string) {
  try {
    if (!OPENAI_ADS_ENABLED || typeof window === "undefined") return;
    if (!allowedHost()) return;
    const w = window as PixelWindow;
    if (!w.jiaOpenAiAds?.enabled || !w.jiaOpenAiAds.initialized) return;
    // No identity, form data, URL, product name or medical detail enters event data.
    const options = customName ? { opt_out: true, custom_event_name: customName } : { opt_out: true };
    w.oaiq?.("measure", name, { type }, options);
  } catch { /* Reporting errors never affect forms, navigation or calls. */ }
}

export function pixelPageView(path: string | null) {
  try {
    if (typeof window === "undefined" || !path || /^\/(admin|api|embed)(\/|$)/.test(path)) return;
    const state = (window as PixelWindow).jiaOpenAiAds;
    if (!state?.enabled || !state.initialized || state.lastPath === path) return;
    measure("page_viewed", "contents");
    state.lastPath = path;
  } catch { /* Best effort. */ }
}

export function pixelIntent(name: "contact_line" | "contact_phone" | "quote_email_intent" | "support_email_intent") {
  measure("custom", "custom", name);
}

// Only call after the server confirms a persisted, non-skipped lead.
export function pixelLeadCreated() { measure("lead_created", "customer_action"); }

export function trackPixelContact(event: MouseEvent) {
  try {
    if (!event.isTrusted) return;
    const link = event.target instanceof Element ? event.target.closest("a") : null;
    const href = link?.getAttribute("href") ?? "";
    if (/^https:\/\/(line\.me|lin\.ee)(\/|$)/i.test(href)) pixelIntent("contact_line");
    else if (/^tel:/i.test(href)) pixelIntent("contact_phone");
  } catch { /* Never prevent the original navigation. */ }
}
