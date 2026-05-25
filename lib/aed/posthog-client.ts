import posthog from "posthog-js";

// PostHog is optional: if NEXT_PUBLIC_POSTHOG_KEY is unset (e.g. local dev or
// before the key is provisioned), every export here is a safe no-op and the
// site behaves exactly as before. Events still go to Supabase + Vercel.
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let started = false;

export function initPostHog(): void {
  if (started) return;
  if (typeof window === "undefined") return;
  if (!KEY) return;
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: "identified_only", // stay anonymous unless we ever identify — cheaper
    capture_pageview: false, // captured manually on App Router navigation
    capture_pageleave: true,
    autocapture: true,
  });
  started = true;
}

export function capturePostHog(name: string, properties: Record<string, unknown>): void {
  if (!started) return;
  try {
    posthog.capture(name, properties);
  } catch {
    // analytics must never break the page
  }
}

export function capturePageview(): void {
  if (!started) return;
  try {
    posthog.capture("$pageview");
  } catch {
    // ignore
  }
}
