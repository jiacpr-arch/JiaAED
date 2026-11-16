// ─── Online checkout (Stripe) — what can be bought on the site and for how much ──
// Pure data + maths (no Stripe import) so pages, the API route and tests share
// one source. Only the single-unit price of the listed models is sold online;
// multi-unit, government, rent-to-own and GPS stay on LINE quotes. The
// ready-to-use sets (./bundles.ts) are sold the same way.
import { listedPrimedicModels, type PrimedicModelId } from "./primedic";
import { bundles, type Bundle } from "./bundles";

export const VAT_RATE = 0.07;

/** How both bots (LINE + web chat) word prices — the site labels prices "ex VAT". */
export const PRICE_VAT_RULE =
  'ทุกครั้งที่บอกราคา ให้ต่อท้ายว่า "ex VAT" (เช่น ฿49,900 ex VAT) — ห้ามใช้คำว่า "ก่อน VAT" หรือ "ยังไม่รวม VAT" · ถ้าลูกค้าถามยอดรวม หรือออกใบเสนอราคา ให้บอกยอดรวม VAT 7% ด้วย (เช่น ฿53,393 รวม VAT) · ถ้าลูกค้าไม่เข้าใจ อธิบายว่า ex VAT = ยังไม่รวมภาษีมูลค่าเพิ่ม 7%';

export type CheckoutItem = {
  id: PrimedicModelId | Bundle["id"];
  name: string;
  /** Path the buyer returns to if they cancel on the Stripe page. */
  returnPath: string;
  net: number; // THB before VAT (= the price shown on the site)
  vat: number; // THB, rounded to satang
  gross: number; // THB the card / PromptPay is charged
};

const RETURN_PATH: Record<string, string> = {
  "primedic-y2": "/aed/yuwell-y2",
  "primedic-y0": "/aed/primedic",
};

/** Round to 2 decimals (satang) without float drift. */
const toSatang = (thb: number) => Math.round(thb * 100);

export function vatOf(net: number): number {
  return toSatang(net * VAT_RATE) / 100;
}

const item = (id: CheckoutItem["id"], name: string, net: number, returnPath: string): CheckoutItem => {
  const vat = vatOf(net);
  return { id, name, returnPath, net, vat, gross: (toSatang(net) + toSatang(vat)) / 100 };
};

export const checkoutItems: CheckoutItem[] = [
  ...listedPrimedicModels.map((m) => item(m.id, m.name, m.price, RETURN_PATH[m.id] ?? "/aed/primedic")),
  ...bundles.map((b) => item(b.id, b.name, b.price, "/aed/sets")),
];

export function findCheckoutItem(id: unknown): CheckoutItem | null {
  return checkoutItems.find((i) => i.id === id) ?? null;
}

/** Stripe wants integer satang. */
export const satang = toSatang;

/** "฿53,393" / "฿42,798.93" */
export function thbExact(n: number): string {
  return `฿${n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/**
 * Online checkout is on only once the Stripe secret key is set (server env),
 * so the "pay online" buttons never show before payments can work.
 * CHECKOUT_DISABLED=1 is a kill switch that keeps the key but hides checkout.
 */
export function checkoutEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && process.env.CHECKOUT_DISABLED !== "1";
}

/**
 * Payment methods offered on the Stripe page. Default card + PromptPay; set
 * STRIPE_PAYMENT_METHODS=promptpay to drop cards (≈3.65% fee). Each method
 * must also be switched on in the Stripe Dashboard.
 */
export function paymentMethods(env: string | undefined = process.env.STRIPE_PAYMENT_METHODS): ("card" | "promptpay")[] {
  const allowed = new Set(["card", "promptpay"] as const);
  const picked = (env ?? "card,promptpay")
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is "card" | "promptpay" => allowed.has(s as "card" | "promptpay"));
  return picked.length ? [...new Set(picked)] : ["card", "promptpay"];
}

export function paymentMethodsLabel(methods = paymentMethods()): string {
  return methods.map((m) => (m === "card" ? "บัตรเครดิต/เดบิต" : "PromptPay")).join(" / ");
}
