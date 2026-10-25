"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { LINE_OA, LINE_DISPLAY_ID } from "@/lib/aed/line";
import { WEB_CHAT_TOGGLE_EVENT } from "./WebChat";
const DISMISS_KEY = "jiaaed_floating_line_dismissed";

export function FloatingLineButton() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [inlineCtaVisible, setInlineCtaVisible] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // ignore
    }
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onToggle = (e: Event) => setChatOpen(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener(WEB_CHAT_TOGGLE_EVENT, onToggle);
    return () => window.removeEventListener(WEB_CHAT_TOGGLE_EVENT, onToggle);
  }, []);

  // Re-collect the page's inline LINE CTAs on every client-side navigation —
  // otherwise we'd keep observing the previous page's (now detached) buttons.
  useEffect(() => {
    setInlineCtaVisible(false);
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-line-cta]")
    ).filter((el) => el.getAttribute("data-line-cta") !== "floating_button");
    if (targets.length === 0) return;

    const visibleSet = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibleSet.add(entry.target);
          else visibleSet.delete(entry.target);
        }
        setInlineCtaVisible(visibleSet.size > 0);
      },
      { threshold: 0.4 }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [visible, pathname]);

  function dismiss() {
    setVisible(false);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (!visible || inlineCtaVisible || chatOpen) return null;

  // The ✕ is a sibling of the link, not inside it: LineClickTracker listens on
  // `document`, which stopPropagation() from a React handler can't reach in
  // time, so a nested ✕ counted every dismiss as a LINE click (Meta Lead +
  // Google conversion + the desktop QR modal). Sits above the JIA AI chat
  // launcher (bottom-5, 2.8rem tall) instead of on top of it.
  return (
    <div className="hidden md:flex fixed bottom-20 right-5 z-50 items-center rounded-full bg-[#06C755] text-white font-bold shadow-2xl shadow-[#06C755]/40 ring-4 ring-[#06C755]/20 hover:bg-[#05a847] hover:scale-105 transition-all">
      <a
        href={LINE_OA}
        target="_blank"
        rel="noopener noreferrer"
        data-line-cta="floating_button"
        className="flex items-center gap-2 py-3 pl-5 pr-2"
        aria-label={`คุยทาง LINE ${LINE_DISPLAY_ID}`}
      >
        <span className="text-xl leading-none">💬</span>
        <span className="hidden sm:inline">LINE {LINE_DISPLAY_ID}</span>
        <span className="sm:hidden">LINE</span>
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label="ปิดปุ่ม LINE"
        className="ml-1 mr-5 px-1 py-3 text-white/60 hover:text-white text-xs leading-none"
      >
        ✕
      </button>
    </div>
  );
}
