import Link from "next/link";

const LINE_OA = "https://line.me/R/ti/p/@273fzpzs";

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
          <span className="text-2xl">❤️</span>
          <span className="font-bold text-xl text-yellow-400">JiaAED</span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm text-gray-300">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-yellow-400 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

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
