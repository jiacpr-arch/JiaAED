// Event-rental card holds about to lapse (09:00 และ 16:00 น. ไทย). A card
// authorisation lasts ~7 days; if it expires before the team captures, the rent
// is lost with it — see lib/aed/rental-holds.ts.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/aed/cron-auth";
import { pushToOwner } from "@/lib/aed/notify-owner";
import { holdExpiringText, type HoldRow } from "@/lib/aed/rental-holds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Remind when the hold lapses within this window (covers the next run + a margin). */
const WARN_WITHIN_MS = 36 * 3_600_000;

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }
  const { data, error } = await createAdminClient()
    .from("aed_rental_holds")
    .select("*")
    .eq("status", "authorized")
    .lt("capture_before", new Date(Date.now() + WARN_WITHIN_MS).toISOString())
    .order("capture_before", { ascending: true });
  if (error) {
    console.error("[cron/rental-holds]", error.message);
    return NextResponse.json({ ok: false, reason: "database_error" }, { status: 500 });
  }
  const holds = (data ?? []) as HoldRow[];
  if (holds.length > 0) await pushToOwner(holdExpiringText(holds));
  return NextResponse.json({ ok: true, expiring: holds.length });
}
