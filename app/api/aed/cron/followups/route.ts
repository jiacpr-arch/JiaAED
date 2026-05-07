/**
 * Cron — ส่ง follow-up messages ที่ถึงกำหนด
 * GET /api/aed/cron/followups
 *
 * Vercel Cron ส่ง Authorization: Bearer $CRON_SECRET ทุกชั่วโมง
 */

import { NextRequest, NextResponse } from "next/server";
import { getPendingFollowups, markFollowupSent } from "@/lib/aed/db-queries";
import { pushLineMessage } from "@/lib/aed/line-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AedCustomer } from "@/lib/aed/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[AED cron] CRON_SECRET not configured");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const followups = await getPendingFollowups();
  if (followups.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "no pending followups" });
  }

  const supabase = createAdminClient();
  const results: { id: string; status: "sent" | "skipped"; reason?: string }[] = [];

  for (const followup of followups) {
    if (!followup.customer_id) {
      await markFollowupSent(followup.id);
      results.push({ id: followup.id, status: "skipped", reason: "no customer_id" });
      continue;
    }

    const { data: customerRow } = await supabase
      .from("aed_customers")
      .select("*")
      .eq("id", followup.customer_id)
      .maybeSingle();

    const customer = customerRow as AedCustomer | null;
    if (!customer?.line_user_id) {
      await markFollowupSent(followup.id);
      results.push({ id: followup.id, status: "skipped", reason: "no line_user_id" });
      continue;
    }

    try {
      await pushLineMessage(customer.line_user_id, followup.message_template);
      await markFollowupSent(followup.id);
      results.push({ id: followup.id, status: "sent" });
    } catch (err) {
      console.error("[AED cron] failed to send followup", followup.id, err);
      results.push({ id: followup.id, status: "skipped", reason: String(err) });
    }
  }

  const sentCount = results.filter((r) => r.status === "sent").length;
  console.log("[AED cron] followups processed:", results.length, "sent:", sentCount);

  return NextResponse.json({ ok: true, sent: sentCount, total: results.length, results });
}
