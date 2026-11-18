"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { setPixelConsent } from "../openai-ads";
import { OpenAIAds } from "./OpenAIAds";
import { GoogleTags } from "./GoogleTags";
import { MetaPixel } from "./MetaPixel";
import { PostHogInit } from "./PostHogInit";
import {
  CONSENT_STORAGE_KEY,
  clearTrackingData,
  readConsent,
  writeConsent,
  type ConsentChoice,
} from "@/lib/aed/consent";

type JiaConsent = { marketing: boolean } | null;
const sharedConsent = (): JiaConsent => {
  try {
    return (window as Window & { JiaConsent?: { get: () => JiaConsent } }).JiaConsent?.get() ?? null;
  } catch {
    return null;
  }
};

/**
 * PDPA cookie-consent gate. The visitor now answers in the shared JIA consent
 * bar (public/jia-consent.js, same on every JIA site); this component mirrors
 * that one choice into `jia_cookie_consent` — still the single source of truth
 * for hasMarketingConsent() and the server-side ad reporting — and loads the
 * trackers (Google tag, Meta Pixel, PostHog, OpenAI) only after "ยอมรับ".
 * Withdrawing clears the trackers' cookies/ids and reloads so scripts unload.
 * Nothing loads on /admin.
 */
export function CookieConsent() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentChoice | null>(null);

  useEffect(() => {
    const sync = (c: JiaConsent) => {
      if (!c) {
        setPixelConsent(false);
        // No answer in the new bar yet: forget answers from the old banner.
        if (readConsent() !== null) {
          try { window.localStorage.removeItem(CONSENT_STORAGE_KEY); } catch { /* optional */ }
        }
        setConsent(null);
        return;
      }
      const value: ConsentChoice = c.marketing ? "granted" : "denied";
      const withdrawing = readConsent() === "granted" && value === "denied";
      writeConsent(value);
      if (value === "denied") setPixelConsent(false);
      if (withdrawing) {
        clearTrackingData();
        // Already-loaded tag scripts can't be unloaded in place.
        window.location.reload();
        return;
      }
      setConsent(value);
    };
    sync(sharedConsent());
    const onChange = (e: Event) => sync((e as CustomEvent<JiaConsent>).detail ?? null);
    window.addEventListener("jia-consent", onChange);
    return () => window.removeEventListener("jia-consent", onChange);
  }, []);

  // Admin pages handle lead PII; keep third-party scripts off them entirely.
  if (pathname?.startsWith("/admin")) return null;
  if (consent !== "granted") return null;

  return (
    <>
      <OpenAIAds />
      <GoogleTags />
      <MetaPixel />
      <PostHogInit />
    </>
  );
}
