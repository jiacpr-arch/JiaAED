"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/aed/analytics-client";
import { hasMarketingConsent } from "@/lib/aed/consent";

// Funnel events named in the landing-page brief. Site analytics always; GA4
// (gtag) only with marketing consent. None of these is a conversion — the lead
// conversion fires from the form only after the server accepts the lead, and
// LINE clicks keep their own line_click tracking (LineClickTracker).
function ga(name: string, params: Record<string, string> = {}) {
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (hasMarketingConsent() && typeof gtag === "function") gtag("event", name, params);
}

export function GpsRentalPageTracker() {
  useEffect(() => {
    trackEvent("view_rental_page", { page: "gps_rental" });
    // On a first visit there is no consent yet, so gtag doesn't exist when the
    // page opens. Send the GA4 copy once the visitor accepts and the Google tag
    // has loaded (CookieConsent mounts it right after "ยอมรับ").
    let viewSent = false;
    const sendView = () => {
      if (viewSent || !hasMarketingConsent()) return;
      const g = (window as unknown as { gtag?: unknown }).gtag;
      if (typeof g !== "function") return;
      viewSent = true;
      ga("view_rental_page", { page: "gps_rental" });
    };
    sendView();
    let tries = 0;
    const waitTag = () => {
      sendView();
      if (!viewSent && tries++ < 20) timer = window.setTimeout(waitTag, 500);
    };
    let timer = 0;
    const onConsent = () => waitTag();
    window.addEventListener("jia-consent", onConsent);

    let pricingSeen = false;
    const pricing = document.getElementById("pricing");
    const obs = pricing
      ? new IntersectionObserver(
          (entries) => {
            if (!pricingSeen && entries.some((e) => e.isIntersecting)) {
              pricingSeen = true;
              trackEvent("view_pricing", { page: "gps_rental" });
              ga("view_pricing", { page: "gps_rental" });
              obs?.disconnect();
            }
          },
          { threshold: 0.3 },
        )
      : null;
    if (pricing) obs?.observe(pricing);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest("a[data-line-cta]") as HTMLAnchorElement | null;
      if (a) ga("click_line", { location: a.dataset.lineCta ?? "unknown" });
    };
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("jia-consent", onConsent);
      window.clearTimeout(timer);
      obs?.disconnect();
      document.removeEventListener("click", onClick);
    };
  }, []);
  return null;
}
