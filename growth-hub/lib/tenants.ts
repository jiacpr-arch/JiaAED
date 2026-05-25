import { createClient } from "@supabase/supabase-js";
import { createPostHogDigestSource, createStore, type DigestSource } from "../../growth-kit/lib";
import type { GrowthConfig } from "../../growth-kit/lib/types";

// Non-secret tenant config, stored as JSONB in the control-plane registry.
// Secrets (API keys, tokens) are NEVER stored in the table — they are resolved
// from env by tenant-id convention (see resolveGrowthConfig).
export type TenantConfig = {
  brand: string;
  locale: string;
  timezone: string;
  channels: Array<{ kind: "line"; to: string } | { kind: "telegram"; chatId: string }>;
  // Where the hub reads metrics from for digests. Defaults to "supabase".
  source?: "supabase" | "posthog";
  // PostHog-only: restrict the digest query to these event names. Set this when
  // the PostHog project is shared with unrelated events so digests stay clean.
  eventAllowlist?: string[];
  storeTable: string;
  scoring: GrowthConfig["scoring"];
  digest: GrowthConfig["digest"];
  llm: { model: string; maxTokens: number; systemPrompt: string };
};

export type Tenant = { id: string; enabled: boolean; config: TenantConfig };

function controlPlane() {
  return createClient(
    process.env.HUB_SUPABASE_URL ?? "",
    process.env.HUB_SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function loadTenants(): Promise<Tenant[]> {
  const { data, error } = await controlPlane()
    .from("growth_tenants")
    .select("id, enabled, config")
    .eq("enabled", true);
  if (error) {
    console.error("[growth-hub] loadTenants failed:", error);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    enabled: r.enabled as boolean,
    config: r.config as TenantConfig,
  }));
}

function envKey(id: string, suffix: string): string {
  const safe = id.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  return process.env[`HUB_${safe}_${suffix}`] ?? "";
}

// Merge the stored (non-secret) tenant config with per-tenant secrets pulled
// from env, producing a full GrowthConfig the kit can run.
export function resolveGrowthConfig(t: Tenant): GrowthConfig {
  const c = t.config;
  return {
    brand: c.brand,
    locale: c.locale,
    timezone: c.timezone,
    channels: c.channels.map((ch) =>
      ch.kind === "line"
        ? { kind: "line", accessToken: envKey(t.id, "LINE_TOKEN"), to: ch.to }
        : { kind: "telegram", botToken: envKey(t.id, "TELEGRAM_BOT_TOKEN"), chatId: ch.chatId },
    ),
    store: {
      kind: "supabase",
      url: envKey(t.id, "SUPABASE_URL"),
      serviceRoleKey: envKey(t.id, "SUPABASE_SERVICE_ROLE_KEY"),
      table: c.storeTable,
    },
    scoring: c.scoring,
    digest: c.digest,
    llm: {
      apiKey: process.env.ANTHROPIC_API_KEY ?? "",
      model: c.llm.model,
      maxTokens: c.llm.maxTokens,
      systemPrompt: c.llm.systemPrompt,
    },
  };
}

// Pick the read source for a tenant's digests. PostHog needs HUB_<ID>_POSTHOG_*
// env vars; Supabase reuses the tenant's full GrowthConfig store.
export function resolveDigestSource(t: Tenant): DigestSource {
  if (t.config.source === "posthog") {
    return createPostHogDigestSource({
      host: envKey(t.id, "POSTHOG_HOST"),
      projectId: envKey(t.id, "POSTHOG_PROJECT_ID"),
      apiKey: envKey(t.id, "POSTHOG_API_KEY"),
      eventAllowlist: t.config.eventAllowlist,
    });
  }
  return createStore(resolveGrowthConfig(t));
}
