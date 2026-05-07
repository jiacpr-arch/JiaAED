import type { AedProduct, PriceCalcResult } from "./types";

// ─── Product catalog ──────────────────────────────────────────────────────────

export const AED_PRODUCTS: Record<string, AedProduct> = {
  i7: {
    id: "i7",
    name: "AED Amoul i7",
    nameTh: "เครื่อง AED Amoul i7",
    description: "เครื่อง AED Amoul i7 พร้อมแผ่น Pad + แบตเตอรี่",
    msrp: 41_900,
    startingPrice: 39_999,
    bestPrice: 38_500,
    minPrice: 37_000,
    vatRate: 0.07,
    faProductCode: "AED-I7",
  },
  "i7-cabinet": {
    id: "i7-cabinet",
    name: "AED Amoul i7 + ตู้แขวนผนัง",
    nameTh: "เครื่อง AED Amoul i7 พร้อมตู้แขวนผนัง",
    description: "เครื่อง AED Amoul i7 + ตู้ติดผนังมาตรฐาน พร้อมสัญญาณเตือน",
    msrp: 46_900,
    startingPrice: 44_999,
    bestPrice: 43_500,
    minPrice: 42_000,
    vatRate: 0.07,
    faProductCode: "AED-I7-CAB",
  },
  "i7-floor": {
    id: "i7-floor",
    name: "AED Amoul i7 + ตู้ตั้งพื้น",
    nameTh: "เครื่อง AED Amoul i7 พร้อมตู้ตั้งพื้น",
    description: "เครื่อง AED Amoul i7 + ตู้ตั้งพื้น Stainless สำหรับพื้นที่เปิดโล่ง",
    msrp: 51_900,
    startingPrice: 49_000,
    bestPrice: 47_500,
    minPrice: 46_000,
    vatRate: 0.07,
    faProductCode: "AED-I7-FLR",
  },
};

export function getProduct(productId: string): AedProduct | null {
  return AED_PRODUCTS[productId] ?? null;
}

export function listProducts(): AedProduct[] {
  return Object.values(AED_PRODUCTS);
}

// ─── Pricing engine ───────────────────────────────────────────────────────────

export function calculatePrice(
  productId: string,
  quantity: number,
  customerType: "individual" | "corporate" | "government" = "individual",
): PriceCalcResult | null {
  const product = getProduct(productId);
  if (!product) return null;

  let unitPrice: number;
  let priceLevel: PriceCalcResult["priceLevel"];
  let canDiscount: boolean;

  if (customerType === "government" || quantity >= 5) {
    unitPrice = product.bestPrice;
    priceLevel = "best";
    canDiscount = false; // must escalate below best
  } else if (quantity >= 2) {
    unitPrice = Math.round((product.startingPrice + product.bestPrice) / 2);
    priceLevel = "standard";
    canDiscount = true;
  } else {
    unitPrice = product.startingPrice;
    priceLevel = "standard";
    canDiscount = true;
  }

  return buildResult(product, unitPrice, quantity, priceLevel, canDiscount);
}

export function evaluateNegotiation(
  productId: string,
  quantity: number,
  requestedUnitPrice: number,
): { approved: boolean; counterOffer: number | null; needsEscalation: boolean } {
  const product = getProduct(productId);
  if (!product) return { approved: false, counterOffer: null, needsEscalation: false };

  if (requestedUnitPrice >= product.bestPrice) {
    return { approved: true, counterOffer: null, needsEscalation: false };
  }
  if (requestedUnitPrice >= product.minPrice) {
    return { approved: true, counterOffer: product.minPrice, needsEscalation: false };
  }
  return { approved: false, counterOffer: product.minPrice, needsEscalation: true };
}

function buildResult(
  product: AedProduct,
  unitPrice: number,
  quantity: number,
  priceLevel: PriceCalcResult["priceLevel"],
  canDiscount: boolean,
): PriceCalcResult {
  const subtotal = unitPrice * quantity;
  const vatAmount = Math.round(subtotal * product.vatRate * 100) / 100;
  const grandTotal = subtotal + vatAmount;
  return { productId: product.id, quantity, unitPrice, subtotal, vatAmount, grandTotal, priceLevel, canDiscount };
}

export function formatThaiPrice(amount: number): string {
  return amount.toLocaleString("th-TH") + " บาท";
}
