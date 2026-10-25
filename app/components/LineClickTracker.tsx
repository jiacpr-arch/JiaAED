"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/aed/analytics-client";
import { readFbTracking, newEventId, fireMetaLead } from "@/lib/aed/fb-tracking";
import { hasMarketingConsent } from "@/lib/aed/consent";
import {
  GADS_CALL_CLICK_CONVERSION_LABEL,
  GADS_LINE_CLICK_CONVERSION_LABEL,
  gadsConversionParams,
} from "@/lib/aed/google-ads-tag";
import { LineFallbackModal } from "./LineFallbackModal";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function LineClickTracker() {
  const [showLineHelp, setShowLineHelp] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const lineAnchor = target.closest("a[data-line-cta]") as HTMLAnchorElement | null;
      if (lineAnchor) {
        const location = lineAnchor.dataset.lineCta || "unknown";
        const productId = lineAnchor.dataset.product || null;
        trackEvent("line_click", {
          location,
          product_id: productId ?? "none",
        });

        // Report to Google as the shared "ไลน์" conversion (AW-10780588709) —
        // the same action jia1669.com uses, so AED campaigns see these clicks.
        if (typeof window.gtag === "function") {
          window.gtag("event", "click_to_line", {
            cta_location: location,
            product_id: productId,
          });
          const conv = gadsConversionParams(GADS_LINE_CLICK_CONVERSION_LABEL);
          if (conv) {
            window.gtag("event", "conversion", conv);
          }
        }

        // Meta, unlike Google, DOES count the LINE click as a `Lead`. Thai buyers
        // tap LINE ~15:1 over the web form, so the form alone gives Meta far too
        // few conversions to optimize on. The LINE click is the real contact
        // action here, so we report it as a Lead (browser pixel + server CAPI,
        // shared eventId for dedup) to give Meta a usable optimization signal.
        // Both only with marketing consent — the server call sends the
        // visitor's IP/UA to Meta, so it follows the banner choice too.
        if (hasMarketingConsent()) {
          const fb = readFbTracking();
          const eventId = newEventId();
          fireMetaLead(eventId);
          fetch("/api/aed/meta-lead", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              source: "line_click",
              location,
              eventId,
              fbc: fb.fbc,
              fbp: fb.fbp,
              pageUrl: typeof window !== "undefined" ? window.location.href : null,
              marketingConsent: true,
            }),
            keepalive: true,
          }).catch(() => {});
        }

        // On desktop, line.me add-friend links open a dead page (they only work
        // inside the LINE mobile app). Intercept and show a QR / copy-ID / form
        // fallback instead of letting the click bounce. Mobile proceeds normally.
        if (!isMobile()) {
          e.preventDefault();
          setShowLineHelp(true);
        }
        return;
      }

      // Phone taps → shared "โทร" conversion. No return: a tel link may also
      // carry data-cta, which the cta_click tracking below still records.
      const telAnchor = target.closest('a[href^="tel:"]') as HTMLAnchorElement | null;
      if (telAnchor) {
        trackEvent("call_click", { location: telAnchor.dataset.cta || "unknown" });
        if (typeof window.gtag === "function") {
          const conv = gadsConversionParams(GADS_CALL_CLICK_CONVERSION_LABEL);
          if (conv) window.gtag("event", "conversion", conv);
        }
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

  return showLineHelp ? <LineFallbackModal onClose={() => setShowLineHelp(false)} /> : null;
}
