import type { Promotion } from "@/lib/aed/promotion";

import { LINE_OA } from "@/lib/aed/line";

// Highlighted promo callout. Reused on the homepage, /aed/primedic and
// /aed/packages. Yellow-on-dark to match the existing accent system.
export function PromoBanner({ promo }: { promo: Promotion }) {
  const [titleBefore, titleAfter = ""] = promo.title.split("฿10,000");

  return (
    <aside className="promo-banner relative overflow-hidden rounded-2xl border border-yellow-400/40 bg-gradient-to-br from-yellow-400/10 via-gray-900 to-gray-900 p-6 sm:p-8" aria-labelledby={`${promo.id}-title`}>
      <div className="promo-banner-glow" aria-hidden="true" />
      <div className="promo-banner-grid relative">
        <div className="promo-banner-copy">
          <span className="promo-banner-badge inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
            {promo.badge} · สำหรับลูกค้า JIA CPR
          </span>
          <h3 id={`${promo.id}-title`} className="promo-banner-title mt-3 text-2xl sm:text-3xl font-black text-white">
            <span>{titleBefore}</span>
            <strong>฿10,000</strong>
            <span>{titleAfter}</span>
          </h3>
          <p className="promo-banner-subtitle mt-2 text-gray-300 text-sm sm:text-base max-w-2xl">{promo.subtitle}</p>

          <ul className="promo-banner-points mt-4 space-y-1.5">
            {promo.points.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-gray-200">
                <span className="text-yellow-400 flex-shrink-0 mt-0.5" aria-hidden="true">✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <div className="promo-banner-action mt-5 flex flex-wrap items-center gap-3">
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="promo_banner"
              data-product={promo.id}
              className="inline-block bg-[#06C755] text-white font-bold px-6 py-3 rounded-full hover:bg-[#05a847] shadow-lg shadow-[#06C755]/30"
            >
              💬 รับสิทธิ์และสอบถามทาง LINE
            </a>
            <p className="text-xs text-gray-500 max-w-xs">{promo.conditionNote}</p>
          </div>
        </div>

        <div className="promo-banner-prize" aria-hidden="true">
          <span>รางวัล</span>
          <strong><small>฿</small>10,000</strong>
          <em>เมื่อช่วยชีวิตสำเร็จ</em>
        </div>
      </div>
    </aside>
  );
}
