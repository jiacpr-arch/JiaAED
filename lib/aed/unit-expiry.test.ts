import { describe, it, expect } from "vitest";
import {
  checkUnitExpiries,
  formatUnitExpiryReport,
  type UnitExpiryInput,
} from "./unit-expiry";

// This is what actually implements the "แจ้งเตือนแบต / แผ่นแปะหมดอายุ" feature
// lib/aed/subscription.ts's PRO/ELITE tiers already market — pin the exact
// pad/battery split and urgency cutoff so the promise is kept for real.

function unit(overrides: Partial<UnitExpiryInput> = {}): UnitExpiryInput {
  return {
    serial_number: "AMI7-001",
    customer_name: "ร้านทดสอบ",
    pad_expiry_date: null,
    battery_expiry_date: null,
    ...overrides,
  };
}

const now = new Date("2026-08-13T00:00:00Z");

describe("checkUnitExpiries", () => {
  it("skips a unit with neither expiry date set", () => {
    expect(checkUnitExpiries([unit()], now)).toEqual([]);
  });

  it("reports pad and battery expiry as separate entries for the same unit", () => {
    const results = checkUnitExpiries(
      [unit({ pad_expiry_date: "2026-09-01", battery_expiry_date: "2027-01-01" })],
      now,
    );
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.kind).sort()).toEqual(["battery", "pad"]);
    expect(results.every((r) => r.serialNumber === "AMI7-001")).toBe(true);
  });

  it("only reports the one date that's actually set", () => {
    const results = checkUnitExpiries([unit({ pad_expiry_date: "2026-09-01" })], now);
    expect(results).toHaveLength(1);
    expect(results[0].kind).toBe("pad");
  });

  it("marks urgent at the same ≤60-day cutoff as license-expiry.ts", () => {
    const results = checkUnitExpiries([unit({ pad_expiry_date: "2026-10-12" })], now); // 60 days out
    expect(results[0].daysLeft).toBe(60);
    expect(results[0].urgent).toBe(true);
  });

  it("marks an already-expired pad/battery as urgent with a negative daysLeft", () => {
    const results = checkUnitExpiries([unit({ battery_expiry_date: "2026-01-01" })], now);
    expect(results[0].daysLeft).toBeLessThan(0);
    expect(results[0].urgent).toBe(true);
  });

  it("sorts soonest-expiring first across multiple units", () => {
    const results = checkUnitExpiries(
      [
        unit({ serial_number: "far", pad_expiry_date: "2029-01-01" }),
        unit({ serial_number: "near", pad_expiry_date: "2026-09-01" }),
      ],
      now,
    );
    expect(results.map((r) => r.serialNumber)).toEqual(["near", "far"]);
  });

  it("carries a null customerName through for a unit with none on file", () => {
    const results = checkUnitExpiries(
      [unit({ customer_name: null, pad_expiry_date: "2026-09-01" })],
      now,
    );
    expect(results[0].customerName).toBeNull();
  });

  it("returns empty for no units", () => {
    expect(checkUnitExpiries([], now)).toEqual([]);
  });

  it("carries a null serialNumber through for a unit with no serial on file", () => {
    // Real data imported from the owner's consumable-tracking sheet has no
    // serial number column at all — this must not throw or coerce to "null".
    const results = checkUnitExpiries(
      [unit({ serial_number: null, pad_expiry_date: "2026-09-01" })],
      now,
    );
    expect(results[0].serialNumber).toBeNull();
  });
});

describe("formatUnitExpiryReport", () => {
  it("uses a calm ✅ header when nothing is urgent", () => {
    const results = checkUnitExpiries([unit({ pad_expiry_date: "2030-01-01" })], now);
    const text = formatUnitExpiryReport(results);
    expect(text).toContain("✅");
    expect(text).not.toContain("🚨");
  });

  it("includes the serial number and customer name so staff know which unit to service", () => {
    const results = checkUnitExpiries(
      [unit({ serial_number: "AMI7-777", customer_name: "โรงเรียนตัวอย่าง", pad_expiry_date: "2026-09-01" })],
      now,
    );
    const text = formatUnitExpiryReport(results);
    expect(text).toContain("AMI7-777");
    expect(text).toContain("โรงเรียนตัวอย่าง");
    expect(text).toContain("แผ่นอิเล็กโทรด");
  });

  it("labels the battery entry distinctly from the pad entry", () => {
    const results = checkUnitExpiries(
      [unit({ pad_expiry_date: "2026-09-01", battery_expiry_date: "2026-09-02" })],
      now,
    );
    const text = formatUnitExpiryReport(results);
    expect(text).toContain("แผ่นอิเล็กโทรด");
    expect(text).toContain("แบตเตอรี่");
  });

  it("flags an expired one with an explicit replace-now instruction", () => {
    const results = checkUnitExpiries([unit({ battery_expiry_date: "2026-01-01" })], now);
    const text = formatUnitExpiryReport(results);
    expect(text).toContain("หมดอายุแล้ว");
    expect(text).toContain("เปลี่ยนด่วน");
  });

  it("falls back to customer name alone when there's no serial number", () => {
    const results = checkUnitExpiries(
      [unit({ serial_number: null, customer_name: "บริษัททดสอบ", pad_expiry_date: "2026-09-01" })],
      now,
    );
    const text = formatUnitExpiryReport(results);
    expect(text).toContain("บริษัททดสอบ");
    expect(text).not.toContain("null");
  });

  it("falls back to a placeholder when neither serial number nor customer name is on file", () => {
    const results = checkUnitExpiries(
      [unit({ serial_number: null, customer_name: null, pad_expiry_date: "2026-09-01" })],
      now,
    );
    const text = formatUnitExpiryReport(results);
    expect(text).toContain("ไม่ระบุเลขซีเรียล");
    expect(text).not.toContain("null");
  });

  it("counts urgent entries correctly in the header", () => {
    const results = checkUnitExpiries(
      [
        unit({ serial_number: "a", pad_expiry_date: "2026-09-01" }), // urgent
        unit({ serial_number: "b", pad_expiry_date: "2030-01-01" }), // not urgent
      ],
      now,
    );
    const text = formatUnitExpiryReport(results);
    expect(text).toContain("🚨");
    expect(text).toContain("1 รายการ");
  });
});
