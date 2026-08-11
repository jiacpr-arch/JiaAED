"use client";

import { useState } from "react";
import Link from "next/link";

import { LINE_OA } from "@/lib/aed/line";
import { HEADER_LINKS } from "@/lib/aed/nav";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/aed/contact";

// Hamburger + dropdown panel for the header on <lg screens. Replaces the old
// horizontally-scrollable link row, which most visitors never noticed was
// scrollable — mobile is the main traffic source here (LINE/Facebook ads).
export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
        className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-700 text-gray-300 hover:text-yellow-400 hover:border-yellow-400/50 transition-colors"
      >
        {/* hamburger ⇄ close, drawn inline so no icon dependency */}
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          {open ? (
            <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open && (
        <>
          {/* scrim closes the menu on outside tap */}
          <div
            className="fixed inset-0 z-30 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav className="absolute left-0 right-0 top-full z-50 border-b border-gray-800 bg-gray-950 shadow-2xl">
            <div className="max-w-6xl mx-auto px-4 py-2">
              {HEADER_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-[15px] font-medium text-gray-200 border-b border-gray-800/60 last:border-0 hover:text-yellow-400 transition-colors"
                >
                  {l.label}
                </Link>
              ))}
              <div className="flex gap-3 py-4">
                <a
                  href={LINE_OA}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-line-cta="mobile_menu"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center bg-[#06C755] text-white text-sm font-bold px-4 py-3 rounded-full hover:bg-[#05a847] transition-colors"
                >
                  💬 ถามราคาทาง LINE
                </a>
                <a
                  href={PHONE_HREF}
                  data-cta="tel_mobile_menu"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center bg-white/5 text-gray-200 text-sm font-bold px-4 py-3 rounded-full border border-gray-700 hover:bg-white/10 transition-colors"
                >
                  📞 {PHONE_DISPLAY}
                </a>
              </div>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
