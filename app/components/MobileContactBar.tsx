import { lineOaUrl } from "@/lib/aed/line";
import { PHONE_HREF } from "@/lib/aed/contact";

const LINE_URL = lineOaUrl("สนใจ AED สอบถามราคา");

/**
 * Mobile-only sticky bottom bar: LINE (primary) + phone, one tap away on every
 * page. On mobile it replaces FloatingLineButton (hidden md:block there); the
 * WebChat bubble is lifted above this bar via bottom-20 md:bottom-5.
 */
export function MobileContactBar() {
  return (
    <>
      {/* Spacer so page content (footer) isn't hidden behind the fixed bar */}
      <div className="h-16 md:hidden" aria-hidden="true" />
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-gray-950/95 backdrop-blur border-t border-gray-800 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-2 gap-2 px-3 py-2.5">
          <a
            href={LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-line-cta="mobile_sticky_bar"
            className="flex items-center justify-center gap-1.5 bg-[#06C755] text-white font-bold text-sm px-3 py-3 rounded-full hover:bg-[#05a847] transition-colors"
          >
            💬 ทัก LINE ตอบทันที
          </a>
          <a
            href={PHONE_HREF}
            data-cta="tel_mobile_sticky_bar"
            className="flex items-center justify-center gap-1.5 border border-gray-600 text-white font-bold text-sm px-3 py-3 rounded-full hover:border-yellow-400 transition-colors"
          >
            📞 โทรเลย
          </a>
        </div>
      </div>
    </>
  );
}
