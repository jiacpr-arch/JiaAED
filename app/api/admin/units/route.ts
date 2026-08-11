import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorized } from "@/lib/aed/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

const COLUMNS =
  "id,serial_number,status,customer_name,plan_type,start_date,end_date,rent_amount,deposit_amount,pad_expiry_date,battery_expiry_date,next_inspection_date,notes,created_at,updated_at";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

// Nulls out any of these when the client sends an empty string — Postgres
// DATE/NUMERIC columns reject "" outright, and a cleared date field should
// mean "no expiry set", not "invalid input".
function emptyToNull(v: unknown): unknown {
  return v === "" ? null : v;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("aed_units")
    .select(COLUMNS)
    .order("pad_expiry_date", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("[admin/units][GET] supabase error:", error.message);
    return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, units: data ?? [] });
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const serialNumber = String(body.serial_number ?? "").trim();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("aed_units")
    .insert({
      serial_number: serialNumber || null,
      status: body.status || "ว่าง",
      customer_name: emptyToNull(body.customer_name),
      plan_type: emptyToNull(body.plan_type),
      start_date: emptyToNull(body.start_date),
      end_date: emptyToNull(body.end_date),
      rent_amount: emptyToNull(body.rent_amount),
      deposit_amount: emptyToNull(body.deposit_amount),
      pad_expiry_date: emptyToNull(body.pad_expiry_date),
      battery_expiry_date: emptyToNull(body.battery_expiry_date),
      next_inspection_date: emptyToNull(body.next_inspection_date),
      notes: emptyToNull(body.notes),
    })
    .select(COLUMNS)
    .single();

  if (error) {
    console.error("[admin/units][POST] supabase error:", error.message);
    return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, unit: data });
}

export async function PATCH(req: Request) {
  if (!isAuthorized(req)) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ ok: false, error: "no_id" }, { status: 400 });

  const updatable = [
    "serial_number",
    "status",
    "customer_name",
    "plan_type",
    "start_date",
    "end_date",
    "rent_amount",
    "deposit_amount",
    "pad_expiry_date",
    "battery_expiry_date",
    "next_inspection_date",
    "notes",
  ] as const;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of updatable) {
    if (key in body) patch[key] = emptyToNull(body[key]);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("aed_units")
    .update(patch)
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("[admin/units][PATCH] supabase error:", error.message);
    return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, unit: data });
}

export async function DELETE(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "no_id" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("aed_units").delete().eq("id", id);
  if (error) {
    console.error("[admin/units][DELETE] supabase error:", error.message);
    return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
