/**
 * /api/admin/orders — move a paid online order through fulfilment (admin only).
 *   POST { action: "stage", orderId, to, serials?, padExpiry?, batteryExpiry?, note? }
 *        → next stage (new → confirmed → delivered → invoiced). On "delivered"
 *          the serials are registered in aed_units so the weekly pad/battery
 *          expiry alert covers the customer's machine.
 *   POST { action: "followup_done", orderId, which: "d7" | "m11", note? }
 * Stages and nudges: lib/aed/order-fulfillment.ts. No Stripe calls here.
 */
import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/aed/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushToOwner } from "@/lib/aed/notify-owner";
import { findCheckoutItem } from "@/lib/aed/checkout";
import {
  FOLLOWUPS,
  nextStage,
  parseSerials,
  stageChangedText,
  stageOf,
  whoOfOrder,
  type FulfillmentRow,
  type FulfillmentStage,
} from "@/lib/aed/order-fulfillment";

export const runtime = "nodejs";

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });
const text = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isoDate = (v: unknown) => (typeof v === "string" && /^20\d\d-\d\d-\d\d$/.test(v) ? v : null);

export async function POST(req: Request) {
  if (!isAuthorized(req)) return bad("unauthorized", 401);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("invalid_json");
  }
  const orderId = Number(body.orderId);
  if (!Number.isInteger(orderId)) return bad("bad_order");

  const db = createAdminClient();
  const { data: o } = await db.from("aed_orders").select("*").eq("id", orderId).maybeSingle();
  if (!o) return bad("order_not_found", 404);
  if (o.status !== "paid") return bad("order_not_paid", 409);
  const order = o as FulfillmentRow & Record<string, unknown>;
  const now = new Date().toISOString();
  const note = text(body.note);

  if (body.action === "stage") {
    const from = stageOf(order);
    const to = body.to as FulfillmentStage;
    // Only the next step — two admins clicking at once can't skip or repeat one.
    if (nextStage(from) !== to) return bad("stage_changed", 409);

    const update: Record<string, unknown> = { fulfillment_status: to, stage_changed_at: now, updated_at: now };
    update[`${to}_at`] = now;
    if (note) update.fulfillment_note = [order.fulfillment_note, note].filter(Boolean).join("\n").slice(0, 2000);

    const serials = to === "delivered" ? parseSerials(body.serials) : [];
    if (serials.length) update.unit_serials = serials.join(", ");

    // Guard on the old stage so a double click can't apply twice.
    const { data: changed, error } = await db
      .from("aed_orders")
      .update(update)
      .eq("id", orderId)
      .eq("fulfillment_status", from)
      .select("id");
    if (error) {
      console.error("[admin/orders] update failed:", error.message);
      return bad("database_error", 500);
    }
    if (!changed?.length) return bad("stage_changed", 409);

    let unitsWarning: string | null = null;
    if (serials.length) {
      const model = findCheckoutItem(order.product_id)?.name ?? order.product_id;
      const { error: unitsError } = await db.from("aed_units").insert(
        serials.map((sn) => ({
          serial_number: sn,
          status: "ขายแล้ว",
          customer_name: whoOfOrder(order),
          product_model: model,
          plan_type: "ซื้อขาด",
          start_date: now.slice(0, 10),
          pad_expiry_date: isoDate(body.padExpiry),
          battery_expiry_date: isoDate(body.batteryExpiry),
          notes: `ออเดอร์ออนไลน์ #${order.id}${order.customer_phone ? ` · โทร ${order.customer_phone}` : ""}`,
        })),
      );
      if (unitsError) {
        console.error("[admin/orders] aed_units insert failed:", unitsError.message);
        unitsWarning = "units_insert_failed";
      }
    }
    await pushToOwner(stageChangedText(order, to, unitsWarning ? [] : serials));
    return NextResponse.json({ ok: true, stage: to, units: unitsWarning ? 0 : serials.length, warning: unitsWarning });
  }

  if (body.action === "followup_done") {
    const f = FOLLOWUPS.find((x) => x.id === body.which);
    if (!f) return bad("bad_followup");
    const update: Record<string, unknown> = { [`followup_${f.id}_at`]: now, updated_at: now };
    if (note) update.fulfillment_note = [order.fulfillment_note, `${f.label}: ${note}`].filter(Boolean).join("\n").slice(0, 2000);
    const { error } = await db.from("aed_orders").update(update).eq("id", orderId);
    if (error) return bad("database_error", 500);
    return NextResponse.json({ ok: true });
  }

  return bad("unknown_action");
}
