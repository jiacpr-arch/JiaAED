"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

const SESSION_KEY = "jiaaed_price_viewed";

export function PriceViewTracker({ targetId = "products" }: { targetId?: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      // ignore
    }

    const el = document.getElementById(targetId);
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            track("price_view");
            try {
              window.sessionStorage.setItem(SESSION_KEY, "1");
            } catch {
              // ignore
            }
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [targetId]);

  return null;
}
