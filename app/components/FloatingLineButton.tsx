"use client";

import { useEffect, useState } from "react";

const LINE_OA = "https://line.me/R/ti/p/@273fzpzs";
const DISMISS_KEY = "jiaaed_floating_line_dismissed";

export function FloatingLineButton() {
  const [visible, setVisible] = useState(false);
  const [inlineCtaVisible, setInlineCtaVisible] = useState(false);
  const [webChatOpen, setWebChatOpen] = useState(false);

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
    function onOpen() {
      setWebChatOpen(true);
    }
    function onClose() {
      setWebChatOpen(false);
    }
    window.addEventListener("webchat:open", onOpen);
    window.addEventListener("webchat:close", onClose);
    return () => {
      window.removeEventListener("webchat:open", onOpen);
      window.removeEventListener("webchat:close", onClose);
    };
  }, []);

  useEffect(() => {
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
  }, [visible]);

  function dismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setVisible(false);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (!visible || inlineCtaVisible || webChatOpen) return null;

  return (
    <div className="fixed bottom-20 right-5 z-50 sm:bottom-24 sm:right-6">
      <a
        href={LINE_OA}
        target="_blank"
        rel="noopener noreferrer"
        data-line-cta="floating_button"
        className="group flex items-center gap-2 bg-[#06C755] text-white font-bold px-5 py-3 rounded-full shadow-2xl shadow-[#06C755]/40 ring-4 ring-[#06C755]/20 hover:bg-[#05a847] hover:scale-105 transition-all"
        aria-label="คุยทาง LINE"
      >
        <span className="text-xl leading-none">💬</span>
        <span className="hidden sm:inline">ปรึกษาฟรี LINE</span>
        <span className="sm:hidden">LINE</span>
        <button
          onClick={dismiss}
          aria-label="ปิด"
          className="ml-1 text-white/60 hover:text-white text-xs px-1 leading-none"
        >
          ✕
        </button>
      </a>
    </div>
  );
}
