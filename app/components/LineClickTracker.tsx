"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function LineClickTracker() {
  useEffect(() => {
    const gAdsId = process.env.NEXT_PUBLIC_GADS_ID;
    const conversionLabel = process.env.NEXT_PUBLIC_GADS_CONVERSION_LABEL;

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a[data-line-cta]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const location = anchor.dataset.lineCta || "unknown";
      const productId = anchor.dataset.product || null;

      const gtag = window.gtag;
      if (typeof gtag !== "function") return;

      gtag("event", "click_to_line", {
        cta_location: location,
        product_id: productId,
      });

      if (gAdsId && conversionLabel) {
        gtag("event", "conversion", {
          send_to: `${gAdsId}/${conversionLabel}`,
          cta_location: location,
        });
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return null;
}
