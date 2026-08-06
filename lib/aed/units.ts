// Shared type + constants for the unit registry (supabase/aed_units.sql).
// No I/O here — the admin route talks to Supabase directly (matches
// app/api/admin/documents/route.ts's style), and lib/aed/unit-expiry.ts holds
// the pure alerting logic. This file is just the shape both sides agree on.

export type AedUnit = {
  id: string;
  serial_number: string;
  status: string;
  customer_name: string | null;
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

export const UNIT_PLAN_TYPES = ["รายปี", "รายเดือน", "รายวัน", "ซื้อขาด"] as const;
