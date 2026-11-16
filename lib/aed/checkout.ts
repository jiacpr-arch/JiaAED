// ─── Online checkout (Stripe) — what can be bought on the site and for how much ──
// Pure data + maths (no Stripe import) so pages, the API route and tests share
// one source. Only the single-unit price of the listed models is sold online;
// multi-unit, government, rent-to-own and GPS stay on LINE quotes.
import { listedPrimedicModels, type PrimedicModelId } from "./primedic";

export const VAT_RATE = 0.07;

export type CheckoutItem = {
  id: PrimedicModelId;
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

export const checkoutItems: CheckoutItem[] = listedPrimedicModels.map((m) => {
  const vat = vatOf(m.price);
  return {
    id: m.id,
    name: m.name,
    returnPath: RETURN_PATH[m.id] ?? "/aed/primedic",
    net: m.price,
    vat,
    gross: (toSatang(m.price) + toSatang(vat)) / 100,
  };
});

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
