"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/aed/analytics-client";
import { readHeadlineVariant, readHeroVariant } from "@/lib/aed/ab-variant";

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

      const lineAnchor = target.closest("a[data-line-cta]") as HTMLAnchorElement | null;
      if (lineAnchor) {
        const location = lineAnchor.dataset.lineCta || "unknown";
        const productId = lineAnchor.dataset.product || null;
        const heroVariant = readHeroVariant();
        const headlineVariant = readHeadlineVariant();

        trackEvent("line_click", {
          location,
          product_id: productId ?? "none",
          hero_variant: heroVariant ?? "none",
          headline_variant: headlineVariant ?? "none",
        });

        const gtag = window.gtag;
        if (typeof gtag === "function") {
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
        }
        return;
      }

      const docAnchor = target.closest("a[data-doc-download]") as HTMLAnchorElement | null;
      if (docAnchor) {
        const docId = docAnchor.dataset.docDownload || "unknown";
        const docCategory = docAnchor.dataset.docCategory || "unknown";

        trackEvent("doc_download", {
          doc_id: docId,
          category: docCategory,
        });

        const gtag = window.gtag;
        if (typeof gtag === "function") {
          gtag("event", "doc_download", {
            doc_id: docId,
            doc_category: docCategory,
          });
        }
        return;
      }

      const ctaAnchor = target.closest("a[data-cta]") as HTMLAnchorElement | null;
      if (ctaAnchor) {
        trackEvent("cta_click", { name: ctaAnchor.dataset.cta || "unknown" });
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return null;
}
