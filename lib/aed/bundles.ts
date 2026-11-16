// ─── Ready-to-use sets (ชุด AED พร้อมใช้) — sold online at /aed/sets ──────────
// Each set's struck-through "ซื้อแยก" is the sum of the parts' own site prices
// (model + accessories in ./products.ts), so the comparison is real. Parts
// without a published standalone price — the online CPR course seats and the
// location sign — are listed as free extras and NOT counted in that sum.
// Prices are before VAT; checkout adds 7% VAT (./checkout.ts).
import { primedicModels, type PrimedicModelId } from "./primedic";
import { accessories } from "./products";
import { AED_PRODUCTS } from "./pricing";

export type BundlePart = { label: string; price: number | null }; // null = free extra
export type Bundle = {
  id: "set-y0-start" | "set-y2-ready" | "set-y2-org";
  name: string;
  kicker: string;
  model: PrimedicModelId;
  price: number; // before VAT
  parts: BundlePart[];
  bestFor: string;
  note: string | null;
  featured: boolean;
  image: string;
};

const model = (id: PrimedicModelId) => primedicModels.find((m) => m.id === id)!;
const acc = (id: string) => {
  const a = accessories.find((x) => x.id === id);
  if (!a || a.price == null) throw new Error(`accessory ${id} has no price`);
  return { label: a.name, price: a.price };
};
const machine = (id: PrimedicModelId) => ({ label: `เครื่อง AED ${model(id).name} (แผ่น + แบตเตอรี่)`, price: model(id).price });
const onlineSeats = (n: number) => ({ label: `คอร์ส CPR & AED ออนไลน์ ${n} คน (cpr.morroo.com)`, price: null });

export const bundles: Bundle[] = [
  {
    id: "set-y0-start",
    name: "ชุดเริ่มต้น Y0",
    kicker: "งบจำกัด",
    model: "primedic-y0",
    price: model("primedic-y0").price,
    parts: [machine("primedic-y0"), onlineSeats(10)],
    bestFor: "ร้านค้า · สำนักงานขนาดเล็ก ที่อยากมี AED พร้อมใช้",
    note: null,
    featured: false,
    image: "/images/primedic-y-series.png",
  },
  {
    id: "set-y2-ready",
    name: "ชุดพร้อมใช้ Y2",
    kicker: "แนะนำ",
    model: "primedic-y2",
    // Same price the quote catalog already uses for Y2 + wall cabinet.
    price: AED_PRODUCTS["i7-cabinet"].startingPrice,
    parts: [machine("primedic-y2"), acc("cabinet-wall"), onlineSeats(10)],
    bestFor: "สำนักงาน · โรงเรียน · ฟิตเนส · คอนโด — ติดผนัง หยิบใช้ได้ทันที",
    note: null,
    featured: true,
    image: "/images/primedic-y2-open.jpg",
  },
  {
    id: "set-y2-org",
    name: "ชุดองค์กร Y2",
    kicker: "ครบทั้งเครื่องและคน",
    model: "primedic-y2",
    price: 59_900,
    parts: [
      machine("primedic-y2"),
      acc("cabinet-wall"),
      acc("training-course"),
      onlineSeats(30),
      { label: "ป้ายบอกจุดติดตั้ง AED", price: null },
    ],
    bestFor: "โรงงาน · บริษัท · หน่วยงาน ที่ต้องให้พนักงานใช้เป็นจริง",
    note: "อบรมถึงที่ในกรุงเทพฯ และปริมณฑล · ต่างจังหวัดคิดค่าเดินทางเพิ่ม",
    featured: false,
    image: "/images/training-bls-1.jpg",
  },
];

/** Sum of the parts' own prices (free extras excluded). */
export function separatePrice(b: Bundle): number {
  return b.parts.reduce((s, p) => s + (p.price ?? 0), 0);
}

/** "ซื้อแยก" amount to strike through, or null when the set saves nothing. */
export function bundleCompareAt(b: Bundle): number | null {
  const sum = separatePrice(b);
  return sum > b.price ? sum : null;
}

export function findBundle(id: unknown): Bundle | null {
  return bundles.find((b) => b.id === id) ?? null;
}
