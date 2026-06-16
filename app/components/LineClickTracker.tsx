"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/aed/analytics-client";
import { readHeadlineVariant, readHeroVariant } from "@/lib/aed/ab-variant";
import { readFbTracking, newEventId, fireMetaLead } from "@/lib/aed/fb-tracking";
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
        const heroVariant = readHeroVariant();
        const headlineVariant = readHeadlineVariant();

        trackEvent("line_click", {
          location,
          product_id: productId ?? "none",
          hero_variant: heroVariant ?? "none",
          headline_variant: headlineVariant ?? "none",
        });

        // Fire an analytics-only event (NOT a Google Ads conversion). A button
        // click is intent, not a confirmed friend-add — reporting it as a
        // conversion trains Google Ads to chase clickers who never add. Real
        // conversions are reported server-side from actual leads (lead form +
        // gclid) and quotations (enhanced match), so no signal is lost here.
        if (typeof window.gtag === "function") {
          window.gtag("event", "click_to_line", {
            cta_location: location,
            product_id: productId,
          });
        }

        // Meta, unlike Google, DOES count the LINE click as a `Lead`. Thai buyers
        // tap LINE ~15:1 over the web form, so the form alone gives Meta far too
        // few conversions to optimize on. The LINE click is the real contact
        // action here, so we report it as a Lead (browser pixel + server CAPI,
        // shared eventId for dedup) to give Meta a usable optimization signal.
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
          }),
          keepalive: true,
        }).catch(() => {});

        // On desktop, line.me add-friend links open a dead page (they only work
        // inside the LINE mobile app). Intercept and show a QR / copy-ID / form
        // fallback instead of letting the click bounce. Mobile proceeds normally.
        if (!isMobile()) {
          e.preventDefault();
          setShowLineHelp(true);
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

  return showLineHelp ? <LineFallbackModal onClose={() => setShowLineHelp(false)} /> : null;
}
