// Shared type + constants for the unit registry (supabase/aed_units.sql).
// No I/O here — the admin route talks to Supabase directly (matches
// app/api/admin/documents/route.ts's style), and lib/aed/unit-expiry.ts holds
// the pure alerting logic. This file is just the shape both sides agree on.

export type AedUnit = {
  id: string;
  // Optional — real device-registry data often has no serial number (see
  // supabase/aed_units.sql for why). Fill in later once known.
  serial_number: string | null;
  status: string;
  customer_name: string | null;
  // สินค้า — the consumable actually fitted, verbatim from the owner's sheet
  // ("pad zoll", "batt a15", …). Optional: a row added by hand may not know it
  // yet. See supabase/aed_units_product_model.sql for where the values came from.
  product_model: string | null;
  plan_type: string | null;
  start_date: string | null;
  end_date: string | null;
  rent_amount: number | null;
  deposit_amount: number | null;
  pad_expiry_date: string | null;
  battery_expiry_date: string | null;
  next_inspection_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// Matches the status values used by docs/rental-ops-kit.md's Google Sheet
// registry — keep these in sync if that convention ever changes.
export const UNIT_STATUSES = ["ว่าง", "ปล่อยเช่า", "ซ่อม", "สำรองอีเวนต์"] as const;

export const UNIT_PLAN_TYPES = ["รายปี", "รายเดือน", "รายวัน", "ซื้อขาด", "เช่าซื้อ", "Safety Care"] as const;

const DATE_FIELDS = ["start_date", "end_date", "pad_expiry_date", "battery_expiry_date", "next_inspection_date"];
const AMOUNT_FIELDS = ["rent_amount", "deposit_amount"];
const TEXT_LIMITS: Record<string, number> = {
  serial_number: 100,
  customer_name: 200,
  product_model: 100,
  notes: 2000,
};

/**
 * Validate the fields present in an admin create/update body. Returns an error
 * code, or null when everything present is acceptable ("" means "clear it").
 * Dates must be Gregorian ISO (YYYY-MM-DD): a Buddhist-era "2569-…" is a valid
 * Postgres date 543 years out, so that unit would silently never raise an
 * expiry alert.
 */
export function validateUnitInput(body: Record<string, unknown>): string | null {
  const present = (k: string) => k in body && body[k] !== "" && body[k] !== null && body[k] !== undefined;

  if (present("status") && !(UNIT_STATUSES as readonly unknown[]).includes(body.status)) return "invalid_status";
  if (present("plan_type") && !(UNIT_PLAN_TYPES as readonly unknown[]).includes(body.plan_type)) {
    return "invalid_plan_type";
  }
  for (const k of DATE_FIELDS) {
    if (!present(k)) continue;
    const v = body[k];
    const m = typeof v === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(v) : null;
    if (!m || Number(m[1]) < 2000 || Number(m[1]) > 2100 || Number.isNaN(Date.parse(v as string))) {
      return `invalid_${k}`;
    }
  }
  for (const k of AMOUNT_FIELDS) {
    if (!present(k)) continue;
    const n = Number(body[k]);
    if (!Number.isFinite(n) || n < 0) return `invalid_${k}`;
  }
  for (const [k, max] of Object.entries(TEXT_LIMITS)) {
    if (present(k) && (typeof body[k] !== "string" || (body[k] as string).length > max)) return `invalid_${k}`;
  }
  return null;
}
