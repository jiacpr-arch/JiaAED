import Image from "next/image";
import type { LineupCard } from "@/lib/aed/lineup";

const LINE_OA = "https://line.me/R/ti/p/@273fzpzs";

// Brand chip accent so the two brands read as equals but stay distinguishable.
const BRAND_CHIP: Record<LineupCard["brand"], string> = {
  Amoul: "border-yellow-400/30 text-yellow-300 bg-yellow-400/10",
  PRIMEDIC: "border-sky-400/40 text-sky-300 bg-sky-400/10",
  Yuwell: "border-rose-400/40 text-rose-300 bg-rose-400/10",
};

// Single product card shared by both brands so they render identically.
export function LineupProductCard({ card }: { card: LineupCard }) {
  return (
    <div
      className={`relative rounded-2xl border p-6 flex flex-col bg-gray-900 ${
        card.highlight ? "border-yellow-400/60 shadow-lg shadow-yellow-400/10" : "border-gray-700"
      }`}
    >
      {card.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full">
          {card.badge}
        </div>
      )}
      <div
        className={`inline-block self-start rounded-full border px-2.5 py-0.5 text-[11px] font-semibold mb-3 ${BRAND_CHIP[card.brand]}`}
      >
        {card.brand}
      </div>
      <div className="relative w-full h-44 mb-4 rounded-xl overflow-hidden bg-gray-800">
        <Image src={card.image} alt={card.name} fill className="object-contain p-3" />
      </div>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{card.subtitle}</div>
      <h3 className="font-bold text-lg text-white mt-1 mb-3">{card.name}</h3>
      <div className="mb-3">
        {card.msrp != null && (
          <div className="text-gray-600 text-sm line-through">฿{card.msrp.toLocaleString()}</div>
        )}
        <div className="text-3xl font-bold text-yellow-400">฿{card.price.toLocaleString()}</div>
        <div className="text-gray-600 text-xs">ราคาเริ่มต้น (ยังไม่รวม VAT)</div>
      </div>
      <p className="text-gray-400 text-sm mb-4">{card.description}</p>
      <ul className="space-y-1 mb-6 flex-1">
        {card.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
            <span className="text-yellow-400 flex-shrink-0">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <a
        href={LINE_OA}
        target="_blank"
        rel="noopener noreferrer"
        data-line-cta="product_card"
        data-product={card.dataProduct}
        className={`text-center font-semibold py-3 rounded-full transition-colors ${
          card.highlight
            ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-300"
            : "bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700"
        }`}
      >
        สั่งซื้อ / ถามราคา
      </a>
    </div>
  );
}
