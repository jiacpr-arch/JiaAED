import Image from "next/image";
import Link from "next/link";
import type { LineupCard } from "@/lib/aed/lineup";

import { LINE_OA } from "@/lib/aed/line";

// Brand chip accent — colours mirror each brand's physical AED casing:
// Amoul = yellow device, Yuwell/PRIMEDIC = red device (same Yuwell PRIMEDIC family).
const BRAND_CHIP: Record<LineupCard["brand"], string> = {
  Amoul: "border-yellow-400/30 text-yellow-300 bg-yellow-400/10",
  PRIMEDIC: "border-red-500/40 text-red-400 bg-red-500/10",
  Yuwell: "border-red-500/40 text-red-400 bg-red-500/10",
};

// Per-brand accent so each card glows in its real device colour (Amoul yellow,
// Yuwell/PRIMEDIC red) instead of a single global yellow. Full literal class
// strings so Tailwind v4's source scanner can detect them.
const BRAND_ACCENT: Record<
  LineupCard["brand"],
  { border: string; badge: string; price: string; check: string; button: string }
> = {
  Amoul: {
    border: "border-yellow-400/60 shadow-lg shadow-yellow-400/10",
    badge: "bg-yellow-400 text-yellow-900",
    price: "text-yellow-400",
    check: "text-yellow-400",
    button: "bg-yellow-400 text-yellow-900 hover:bg-yellow-300",
  },
  PRIMEDIC: {
    border: "border-red-500/60 shadow-lg shadow-red-500/10",
    badge: "bg-red-600 text-white",
    price: "text-red-400",
    check: "text-red-400",
    button: "bg-red-600 text-white hover:bg-red-500",
  },
  Yuwell: {
    border: "border-red-500/60 shadow-lg shadow-red-500/10",
    badge: "bg-red-600 text-white",
    price: "text-red-400",
    check: "text-red-400",
    button: "bg-red-600 text-white hover:bg-red-500",
  },
};

// Single product card shared by both brands so they render identically.
export function LineupProductCard({ card }: { card: LineupCard }) {
  const accent = BRAND_ACCENT[card.brand];
  return (
    <div
      className={`relative rounded-2xl border p-6 flex flex-col bg-gray-900 ${
        card.highlight ? accent.border : "border-gray-700"
      }`}
    >
      {card.badge && (
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full ${accent.badge}`}
        >
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
        <div className={`text-3xl font-bold ${accent.price}`}>฿{card.price.toLocaleString()}</div>
        <div className="text-gray-600 text-xs">ราคาเริ่มต้น (ยังไม่รวม VAT)</div>
      </div>
      <p className="text-gray-400 text-sm mb-4">{card.description}</p>
      <ul className="space-y-1 mb-6 flex-1">
        {card.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
            <span className={`flex-shrink-0 ${accent.check}`}>✓</span>
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
            ? accent.button
            : "bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700"
        }`}
      >
        สั่งซื้อ / ถามราคา
      </a>
      {card.detailHref && (
        <Link
          href={card.detailHref}
          data-cta="product_card_detail"
          data-product={card.dataProduct}
          className="mt-2 text-center text-sm text-gray-400 hover:text-yellow-400 transition-colors py-1"
        >
          ดูรายละเอียดรุ่นนี้ →
        </Link>
      )}
    </div>
  );
}
