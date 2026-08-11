import Image from "next/image";
import { primedicModels, yuwellGpsAed } from "@/lib/aed/primedic";

import { LINE_OA } from "@/lib/aed/line";

// Owner-supplied marketing flyers per model (Y0 / Y8 / GPS), shown as the card
// visual so each option carries its own branded artwork.
const imgById: Record<string, string> = {
  "primedic-y0": "/images/primedic-y0-flyer-b.png",
  "primedic-y8": "/images/primedic-y8-flyer.png",
  "primedic-y2": "/images/primedic-y2-open.jpg",
  "yuwell-gps": "/images/yuwell-gps-flyer.png",
};

type Card = {
  id: string;
  name: string;
  price: number;
  keyDiff: string;
  bestFor: string;
  accent: string; // tailwind border/text accent
  tag: string;
};

// Three side-by-side options with their ONE distinguishing feature called out,
// each in a distinct accent — so Y0 / Y8 / GPS no longer blur together.
const cards: Card[] = [
  {
    id: primedicModels[0].id,
    name: primedicModels[0].name,
    price: primedicModels[0].price,
    keyDiff: primedicModels[0].keyDiff,
    bestFor: primedicModels[0].bestFor,
    accent: "border-red-500/50 text-red-400",
    tag: "เริ่มต้น",
  },
  {
    id: primedicModels[1].id,
    name: primedicModels[1].name,
    price: primedicModels[1].price,
    keyDiff: primedicModels[1].keyDiff,
    bestFor: primedicModels[1].bestFor,
    accent: "border-red-400/70 text-red-300",
    tag: "มี CPR feedback",
  },
  {
    // รุ่นเรือธงที่ดัน — accent สีเหลืองให้เด่นกว่าตัวอื่น
    id: primedicModels[2].id,
    name: primedicModels[2].name,
    price: primedicModels[2].price,
    keyDiff: primedicModels[2].keyDiff,
    bestFor: primedicModels[2].bestFor,
    accent: "border-yellow-400/70 text-yellow-300",
    tag: "🚩 เรือธง · จอ EKG + ดู CPR สด",
  },
  {
    id: yuwellGpsAed.id,
    name: yuwellGpsAed.name,
    price: yuwellGpsAed.price,
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
        งบจำกัด → <span className="text-red-400 font-semibold">Y0</span> · อยากได้ CPR feedback →{" "}
        <span className="text-red-300 font-semibold">Y8</span> · อยากเห็นคุณภาพ CPR บนจอ →{" "}
        <span className="text-yellow-300 font-semibold">Y2</span> · หลายสาขา/ติดตามออนไลน์ →{" "}
        <span className="text-red-400 font-semibold">GPS</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="text-3xl font-black text-yellow-400 mt-1">
              ฿{c.price.toLocaleString()}
            </div>

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
    </div>
  );
}
