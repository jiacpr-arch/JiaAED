import type { Promotion } from "@/lib/aed/promotion";

const LINE_OA = "https://line.me/R/ti/p/@273fzpzs";

// Highlighted promo callout. Reused on the homepage, /aed/primedic and
// /aed/packages. Yellow-on-dark to match the existing accent system.
export function PromoBanner({ promo }: { promo: Promotion }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-yellow-400/40 bg-gradient-to-br from-yellow-400/10 via-gray-900 to-gray-900 p-6 sm:p-8">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-yellow-400/10 blur-2xl" />
      <div className="relative">
        <span className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
          {promo.badge}
        </span>
        <h3 className="mt-3 text-2xl sm:text-3xl font-black text-white">
          {promo.title.split("฿10,000")[0]}
          <span className="text-yellow-400">฿10,000</span>
          {promo.title.split("฿10,000")[1] ?? ""}
        </h3>
        <p className="mt-2 text-gray-300 text-sm sm:text-base max-w-2xl">{promo.subtitle}</p>

        <ul className="mt-4 space-y-1.5">
          {promo.points.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm text-gray-200">
              <span className="text-yellow-400 flex-shrink-0 mt-0.5">✓</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href={LINE_OA}
            target="_blank"
            rel="noopener noreferrer"
            data-line-cta="promo_banner"
            data-product={promo.id}
            className="inline-block bg-[#06C755] text-white font-bold px-6 py-3 rounded-full hover:bg-[#05a847] shadow-lg shadow-[#06C755]/30"
          >
            💬 สอบถามโปรโมชั่นทาง LINE
          </a>
          <p className="text-xs text-gray-500 max-w-xs">{promo.conditionNote}</p>
        </div>
      </div>
    </div>
  );
}
