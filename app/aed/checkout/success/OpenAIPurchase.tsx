"use client";

import { useEffect } from "react";

export function OpenAIPurchase({ sessionId }: { sessionId: string }) {
  useEffect(() => {
    const consent = (window as Window & { JiaConsent?: { get: () => { marketing: boolean } | null } }).JiaConsent;
    if (consent?.get()?.marketing !== true) return;
    void fetch("/api/analytics/openai-purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, consent: true }),
      referrerPolicy: "no-referrer",
    }).catch(() => {});
  }, [sessionId]);
  return null;
}
