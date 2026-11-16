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
