import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Shared Stripe client, or null while STRIPE_SECRET_KEY is not set. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) client = new Stripe(key, { maxNetworkRetries: 2, timeout: 15_000 });
  return client;
}

let vatRateId: string | null = null;

/**
 * The 7% Thai VAT tax rate (exclusive) used on subscription invoices, so each
 * monthly invoice shows rent + VAT separately. Found by metadata, created once.
 */
export async function getVatTaxRateId(stripe: Stripe): Promise<string> {
  if (vatRateId) return vatRateId;
  for await (const r of stripe.taxRates.list({ active: true, limit: 100 })) {
    if (r.metadata?.jiaaed === "vat7" && !r.inclusive && r.percentage === 7) {
      vatRateId = r.id;
      return r.id;
    }
  }
  const created = await stripe.taxRates.create({
    display_name: "VAT",
    description: "ภาษีมูลค่าเพิ่ม 7%",
    percentage: 7,
    inclusive: false,
    country: "TH",
    jurisdiction: "TH",
    tax_type: "vat",
    metadata: { jiaaed: "vat7" },
  });
  vatRateId = created.id;
  return created.id;
}
