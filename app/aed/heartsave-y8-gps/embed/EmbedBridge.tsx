"use client";

import { useEffect } from "react";
import { Y8_GPS_EMBED_PARENT_ORIGINS } from "@/lib/aed/y8-gps-landing";

// Talks to the jia1669.com page that frames /aed/heartsave-y8-gps/embed:
//   • jiaaed:height — the iframe has no scrollbar; the parent sizes it to this.
//   • jiaaed:scroll — in-page anchors (#rent / #org) can't scroll the parent
//     window from inside the frame, so ask the parent to scroll instead.
// Messages go only to the allow-listed parent origins.
function post(message: Record<string, unknown>) {
  if (window.parent === window) return;
  for (const origin of Y8_GPS_EMBED_PARENT_ORIGINS) {
    try {
      window.parent.postMessage(message, origin);
    } catch {
      // origin mismatch throws nothing in practice; ignore anything else
    }
  }
}

export function EmbedBridge() {
  useEffect(() => {
    const sendHeight = () => post({ type: "jiaaed:height", height: document.documentElement.scrollHeight });
    sendHeight();
    const ro = new ResizeObserver(sendHeight);
    ro.observe(document.body);
    window.addEventListener("load", sendHeight);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a || window.parent === window) return;
      const el = document.getElementById(a.hash.slice(1));
      if (!el) return;
      e.preventDefault();
      post({ type: "jiaaed:scroll", top: el.getBoundingClientRect().top + window.scrollY });
    };
    document.addEventListener("click", onClick);
    return () => {
      ro.disconnect();
      window.removeEventListener("load", sendHeight);
      document.removeEventListener("click", onClick);
    };
  }, []);
  return null;
}
