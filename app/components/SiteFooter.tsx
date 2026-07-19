import Link from "next/link";

import { LINE_OA } from "@/lib/aed/line";
import { FOOTER_GROUPS } from "@/lib/aed/nav";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/aed/contact";

export function SiteFooter({
  fda = "68-2-2-2-0005243",
  adLicense = "743/2569",
  regNote,
}: {
  fda?: string;
  adLicense?: string;
  // Override the whole registration line (e.g. PRIMEDIC pending disclaimer).
  regNote?: string;
}) {
  return (
    <footer className="border-t border-gray-800 bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-10 text-sm text-gray-400">
        {/* Grouped sitemap — every public page is reachable from any footer */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-8 mb-8">
          {FOOTER_GROUPS.map((g) => (
            <div key={g.title}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                {g.title}
              </h3>
              <ul className="space-y-2">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-yellow-400 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {regNote ?? `เจี่ยรักษา (JiaAED) — นำเข้าและจัดจำหน่ายเครื่องมือแพทย์โดยตรง · ทะเบียน อย. ${fda} · ฆพ.${adLicense}`}
        </p>
        <p className="text-xs text-gray-600 mt-2">
          © {new Date().getFullYear()} JiaAED ·{" "}
          <a href={LINE_OA} target="_blank" rel="noopener noreferrer" data-line-cta="footer" className="hover:text-yellow-400">
            ติดต่อทาง LINE @jiacpr
          </a>{" "}
          ·{" "}
          <a href={PHONE_HREF} data-cta="tel_footer" className="hover:text-yellow-400">
            โทร {PHONE_DISPLAY}
          </a>
        </p>
      </div>
    </footer>
  );
}
