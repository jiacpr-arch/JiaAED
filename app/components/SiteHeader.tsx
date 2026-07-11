import Link from "next/link";

import { LINE_OA } from "@/lib/aed/line";
import { JiaAedLogo } from "./JiaAedLogo";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/aed/packages", label: "แพ็กเกจ" },
  { href: "/aed/subscription", label: "เช่า AED" },
  { href: "/aed/primedic", label: "PRIMEDIC" },
  { href: "/aed/rental", label: "เช่าระยะสั้น" },
  { href: "/training", label: "อบรม" },
  { href: "/about", label: "เกี่ยวกับเรา" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <JiaAedLogo className="h-8 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm text-gray-300">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-yellow-400 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Same เช่า/ซื้อ pair as the homepage nav — equal-weight offers everywhere */}
          <div className="hidden sm:flex items-center">
            <Link
              href="/#rent"
              data-cta="nav_rent"
              className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 text-sm font-semibold px-3 py-2 rounded-l-full hover:bg-yellow-400/20 transition-colors"
            >
              เช่า
            </Link>
            <Link
              href="/#how"
              data-cta="nav_buy"
              className="bg-white/5 text-gray-200 border border-l-0 border-gray-500/40 text-sm font-semibold px-3 py-2 rounded-r-full hover:bg-white/10 transition-colors"
            >
              ซื้อ
            </Link>
          </div>
          <a
            href={LINE_OA}
            target="_blank"
            rel="noopener noreferrer"
            data-line-cta="site_header"
            className="bg-[#06C755] text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-[#05a847] flex-shrink-0"
          >
            💬 LINE
          </a>
        </div>
      </div>

      {/* Mobile nav row */}
      <nav className="md:hidden flex items-center gap-4 overflow-x-auto px-4 pb-2 text-xs text-gray-400">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap hover:text-yellow-400 transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
