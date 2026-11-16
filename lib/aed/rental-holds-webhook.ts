// Stripe webhook side of event-rental card holds (see ./rental-holds.ts).
import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { pushToOwner } from "./notify-owner";
import { holdAuthorizedText, holdExpiredText, type HoldRow } from "./rental-holds";

type Result = { handled: boolean; note?: string };

const isHold = (md: Stripe.Metadata | null | undefined) => md?.kind === "rental_hold";

/** checkout.session.completed for a hold link (payment_status is "unpaid": nothing captured yet). */
export async function handleHoldCheckout(stripe: Stripe, db: SupabaseClient, session: Stripe.Checkout.Session): Promise<Result> {
  if (session.mode !== "payment" || !isHold(session.metadata)) return { handled: false };
  const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!piId) return { handled: true, note: "no payment intent" };

  const pi = await stripe.paymentIntents.retrieve(piId, { expand: ["latest_charge"] });
  if (pi.status !== "requires_capture") return { handled: true, note: `payment intent ${pi.status}` };
  const charge = typeof pi.latest_charge === "object" ? pi.latest_charge : null;
  const captureBefore = charge?.payment_method_details?.card?.capture_before ?? null;

  const md = session.metadata!;
  const row = {
    payment_intent_id: pi.id,
    checkout_session_id: session.id,
    package_id: md.package_id,
    days: Number(md.days) || 1,
    units: Number(md.units) || 1,
    status: "authorized",
    rent_thb: Number(md.rent_thb),
    hold_thb: Number(md.hold_thb),
    authorized_thb: pi.amount_capturable / 100,
    capture_before: captureBefore ? new Date(captureBefore * 1000).toISOString() : null,
    return_date: md.return_date || null,
    event_name: md.event_name || null,
    customer_name: md.customer_name || session.customer_details?.name || null,
    company_name: md.company_name || null,
    customer_email: session.customer_details?.email ?? null,
    customer_phone: md.phone || session.customer_details?.phone || null,
    updated_at: new Date().toISOString(),
  };
  const { data: inserted, error } = await db
    .from("aed_rental_holds")
    .upsert(row, { onConflict: "payment_intent_id", ignoreDuplicates: true })
    .select("*");
  if (error) throw new Error(`aed_rental_holds upsert: ${error.message}`);
  if (inserted && inserted.length > 0) await pushToOwner(holdAuthorizedText(inserted[0] as HoldRow));
  return { handled: true };
}

/** payment_intent.canceled: a hold the team didn't release expired uncaptured. */
export async function handleHoldCanceled(db: SupabaseClient, pi: Stripe.PaymentIntent): Promise<Result> {
  if (!isHold(pi.metadata)) return { handled: false };
  const { data } = await db.from("aed_rental_holds").select("*").eq("payment_intent_id", pi.id).maybeSingle();
  if (!data || data.status !== "authorized") return { handled: true };
  await db
    .from("aed_rental_holds")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("payment_intent_id", pi.id);
  await pushToOwner(holdExpiredText(data as HoldRow));
  return { handled: true };
}
