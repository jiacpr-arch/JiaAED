// Online-order nudges (09:17 น. ไทย daily): orders stuck in a stage > 24 h and
// follow-up calls due 7 days / 11 months after delivery. One LINE digest to
// every admin + an email backup to the owner. Logic: lib/aed/order-fulfillment.ts.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { claimDailyCronRun } from "@/lib/aed/cron-once";
import { pushToOwner } from "@/lib/aed/notify-owner";
import { sendOwnerTextEmail } from "@/lib/aed/email";
import { orderDigestText, orderTodos, type FulfillmentRow } from "@/lib/aed/order-fulfillment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }
  const { data, error } = await createAdminClient()
    .from("aed_orders")
    .select("id,status,product_id,units,total_thb,refunded_thb,customer_name,company_name,customer_phone,fulfillment_status,stage_changed_at,paid_at,created_at,delivered_at,followup_d7_at,followup_m11_at")
    .eq("status", "paid")
    .or("fulfillment_status.neq.invoiced,followup_d7_at.is.null,followup_m11_at.is.null")
    .order("paid_at", { ascending: true })
    .limit(500);
  if (error) {
    console.error("[cron/order-followups]", error.message);
    return NextResponse.json({ ok: false, reason: "database_error" }, { status: 500 });
  }
  const now = new Date();
  const orders = (data ?? []) as FulfillmentRow[];
  const text = orderDigestText(orders, now);
  if (!text) return NextResponse.json({ ok: true, due: 0 });
  if (!(await claimDailyCronRun("order_followups"))) {
    return NextResponse.json({ ok: true, skipped: "already_sent_today" });
  }
  await pushToOwner(text);
  await sendOwnerTextEmail(`📦 งานออเดอร์วันนี้ (${orderTodos(orders, now).length})`, text);
  return NextResponse.json({ ok: true, due: orderTodos(orders, now).length });
}
