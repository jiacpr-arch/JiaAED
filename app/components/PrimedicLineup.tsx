import Image from "next/image";
import { BuyOnlineButton, WasPrice } from "@/app/components/BuyOnlineButton";
import { PRICE_ON_REQUEST, activePreviousPrice, listedPrimedicModels, Y8_ON_REQUEST_NOTE, yuwellGpsAed } from "@/lib/aed/primedic";

import { LINE_OA } from "@/lib/aed/line";

// Clean product photos per model; the approved (ฆพ.) flyers are shown in their
// own section on /aed/primedic.
const imgById: Record<string, string> = {
  "primedic-y0": "/images/primedic-y-series.png",
  "primedic-y8": "/images/primedic-y8-open.png",
  "primedic-y2": "/images/primedic-y2-open.jpg",
  "yuwell-gps": "/images/yuwell-gps-aed.webp",
};

type Card = {
  id: string;
  name: string;
  price: number | null; // null = price on request
  wasPrice: number | null; // real former price, struck through
  warrantyYears: number;
  keyDiff: string;
  bestFor: string;
  accent: string; // tailwind border/text accent
  tag: string;
};

// Three side-by-side options with their ONE distinguishing feature called out,
// each in a distinct accent — so Y0 / Y8 / GPS no longer blur together.
// Listed models (Y2 recommended, then Y0) + the GPS unit — Y8 is quote-only
// (owner, 15 พ.ย. 2026; see LISTED_MODEL_IDS).
const modelAccent: Record<string, { accent: string; tag: string }> = {
  "primedic-y2": { accent: "border-yellow-400/70 text-yellow-300", tag: "⭐ แนะนำ · แผ่น feedback + จอ CPR สด" },
  "primedic-y0": { accent: "border-red-500/50 text-red-400", tag: "รุ่นประหยัด" },
};
const cards: Card[] = [
  ...listedPrimedicModels.map((m) => ({
    id: m.id,
    name: m.name,
    price: m.price,
    wasPrice: activePreviousPrice(m),
    warrantyYears: m.warrantyYears,
    keyDiff: m.keyDiff,
    bestFor: m.bestFor,
    ...modelAccent[m.id],
  })),
  {
    id: yuwellGpsAed.id,
    name: yuwellGpsAed.name,
    price: yuwellGpsAed.price,
    wasPrice: null,
    warrantyYears: yuwellGpsAed.warrantyYears,
    keyDiff: yuwellGpsAed.keyDiff,
    bestFor: yuwellGpsAed.bestFor,
    accent: "border-red-500/50 text-red-400",
    tag: "มี GPS ในตัว",
  },
];

export function PrimedicLineup() {
  return (
    <div>
      {/* One-line decision guide so the difference is obvious at a glance */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-300 mb-5">
        <span className="text-gray-500">เลือกรุ่นไหนดี?</span>{" "}
        อยากรู้ว่าปั๊มหัวใจถูกไหม (แผ่น feedback + จอ) →{" "}
        <span className="text-yellow-300 font-semibold">Y2</span> · งบจำกัด →{" "}
        <span className="text-red-400 font-semibold">Y0</span> · หลายสาขา/ติดตามออนไลน์ →{" "}
        <span className="text-red-400 font-semibold">GPS</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div
            key={c.id}
            className={`flex flex-col rounded-2xl border bg-gray-900 p-5 ${c.accent.split(" ")[0]}`}
          >
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white mb-3">
              <Image
                src={imgById[c.id]}
                alt={c.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div
              className={`inline-block self-start rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${c.accent}`}
            >
              {c.tag}
            </div>
            <div className="mt-2 font-bold text-lg text-white">{c.name}</div>
            {c.wasPrice != null && (
              <div className="text-xs text-gray-400 mt-1">
                ราคาเดิม <WasPrice amount={c.wasPrice} />
              </div>
            )}
            <div className="text-3xl font-black text-yellow-400 mt-1">
              {c.price === null ? <span className="text-2xl">{PRICE_ON_REQUEST}</span> : `฿${c.price.toLocaleString()}`}
            </div>
            <div className="text-xs text-gray-400 mt-1">รับประกันตัวเครื่อง {c.warrantyYears} ปี</div>

            {/* The single distinguishing feature, made loud */}
            <div className="mt-3 rounded-lg bg-gray-950 border border-gray-800 px-3 py-2.5">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">ต่างกันตรงนี้</div>
              <div className={`text-sm font-semibold mt-0.5 ${c.accent.split(" ")[1]}`}>
                {c.keyDiff}
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-400 flex-1">
              <span className="text-gray-500">เหมาะกับ:</span> {c.bestFor}
            </div>

            <BuyOnlineButton
              productId={c.id}
              className="mt-4 w-full text-center bg-yellow-400 text-gray-950 font-bold py-2.5 rounded-full hover:bg-yellow-300"
              noteClassName="text-center text-[11px] text-gray-500 mt-1"
            />
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="primedic_lineup"
              data-product={c.id}
              className="mt-4 text-center bg-[#06C755] text-white font-semibold py-2.5 rounded-full hover:bg-[#05a847]"
            >
              💬 สอบถามรุ่นนี้
            </a>
          </div>
        ))}
      </div>
      <p className="text-center text-gray-600 text-xs mt-3">ราคายังไม่รวม VAT</p>
      <p className="text-center text-gray-400 text-xs mt-1">{Y8_ON_REQUEST_NOTE}</p>
    </div>
  );
}
