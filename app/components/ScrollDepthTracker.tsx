"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/aed/analytics-client";

const SESSION_KEY_PREFIX = "jiaaed_scroll_";
const DEPTHS = [25, 50, 75, 100] as const;
const ENGAGED_DELAY_MS = 10_000;

function alreadyFired(key: string): boolean {
  try {
    if (window.sessionStorage.getItem(key) === "1") return true;
    window.sessionStorage.setItem(key, "1");
    return false;
  } catch {
    return false;
  }
}

export function ScrollDepthTracker() {
  useEffect(() => {
    const path = window.location.pathname;

    const engagedTimer = window.setTimeout(() => {
      if (alreadyFired(`${SESSION_KEY_PREFIX}engaged_${path}`)) return;
      trackEvent("engaged_session", { path });
    }, ENGAGED_DELAY_MS);

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - window.innerHeight;
        if (scrollable <= 0) return;
        const pct = (window.scrollY / scrollable) * 100;
        for (const d of DEPTHS) {
          if (pct < d) break;
          const key = `${SESSION_KEY_PREFIX}d${d}_${path}`;
          if (alreadyFired(key)) continue;
          trackEvent("scroll_depth", { depth: d, path });
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.clearTimeout(engagedTimer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
