// ─── Per-customer pad/battery expiry watchdog ──────────────────────────────────
// lib/aed/subscription.ts's PRO/ELITE tiers already market "แจ้งเตือนแบต /
// แผ่นแปะหมดอายุ" as an included feature — this is what actually implements
// it. Before this, the only place that data lived was the owner's private
// Google Sheet (docs/rental-ops-kit.md), tracked by hand with no alerting.
//
// Same split as lib/aed/license-expiry.ts (whose `daysUntil` this reuses):
// pure date math here, I/O in the cron route, so it's unit-testable without a
// network or DB.

import { daysUntil } from "./license-expiry";
import type { AedUnit } from "./units";

const URGENT_THRESHOLD_DAYS = 60; // same cutoff as license-expiry.ts and the
// <60-day red flag docs/rental-ops-kit.md already uses by hand

// Only the fields the expiry check reads — narrower than the full AedUnit row
// so the cron's partial `select()` satisfies this without an unsafe cast.
export type UnitExpiryInput = Pick<
  AedUnit,
  "serial_number" | "customer_name" | "pad_expiry_date" | "battery_expiry_date"
>;

export type UnitExpiryKind = "pad" | "battery";

export type UnitExpiryStatus = {
  serialNumber: string;
  customerName: string | null;
  kind: UnitExpiryKind;
  expiryDate: string;
  daysLeft: number;
  urgent: boolean;
};

/**
 * Pad/battery expiry status for every unit that has at least one of those
 * dates set — units with neither (e.g. spares still in the office with no
 * assigned electrode set yet) are skipped rather than reported as N/A.
 * Soonest-expiring first.
 */
export function checkUnitExpiries(units: UnitExpiryInput[], now: Date): UnitExpiryStatus[] {
  const results: UnitExpiryStatus[] = [];

  for (const unit of units) {
    const dates: [UnitExpiryKind, string | null][] = [
      ["pad", unit.pad_expiry_date],
      ["battery", unit.battery_expiry_date],
    ];
    for (const [kind, expiryDate] of dates) {
      if (!expiryDate) continue;
      const daysLeft = daysUntil(expiryDate, now);
      results.push({
        serialNumber: unit.serial_number,
        customerName: unit.customer_name,
        kind,
        expiryDate,
        daysLeft,
        urgent: daysLeft <= URGENT_THRESHOLD_DAYS,
      });
    }
  }

  return results.sort((a, b) => a.daysLeft - b.daysLeft);
}

const KIND_LABEL: Record<UnitExpiryKind, string> = { pad: "แผ่นอิเล็กโทรด", battery: "แบตเตอรี่" };

export function formatUnitExpiryReport(results: UnitExpiryStatus[]): string {
  const urgentResults = results.filter((r) => r.urgent);
  const icon = urgentResults.length > 0 ? "🚨" : "✅";

  const header =
    urgentResults.length > 0
      ? `${icon} เครื่องลูกค้า: มีแผ่น/แบตใกล้หมดอายุ (≤${URGENT_THRESHOLD_DAYS} วัน) ${urgentResults.length} รายการ`
      : `${icon} เครื่องลูกค้า: ยังไม่มีแผ่น/แบตใกล้หมดอายุ`;

  const lines = results.map((r) => {
    const who = r.customerName ? `${r.serialNumber} (${r.customerName})` : r.serialNumber;
    const daysLabel =
      r.daysLeft < 0
        ? `หมดอายุแล้ว ${Math.abs(r.daysLeft)} วัน — เปลี่ยนด่วน!`
        : `เหลือ ${r.daysLeft} วัน (ถึง ${r.expiryDate})`;
    return `${r.urgent ? "🔴" : "✓"} ${who} — ${KIND_LABEL[r.kind]} ${daysLabel}`;
  });

  return [header, "", ...lines].join("\n");
}
