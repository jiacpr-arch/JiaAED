import { describe, it, expect } from "vitest";
import {
  daysUntil,
  checkLicenseExpiries,
  formatLicenseExpiryReport,
} from "./license-expiry";

// Displaying an expired อย./ฆพ. number publicly is an advertising-law violation
// from the moment it lapses (Amoul i7 precedent — see regulatory.ts). This is
// the alarm for that, so pin the exact day-count math and the urgency cutoff.

describe("daysUntil", () => {
  it("counts whole days to a future date", () => {
    expect(daysUntil("2026-09-01", new Date("2026-08-01T00:00:00Z"))).toBe(31);
  });

  it("returns 0 on the expiry date itself", () => {
    expect(daysUntil("2026-08-13", new Date("2026-08-13T15:00:00Z"))).toBe(0);
  });

  it("returns a negative number once the date has passed", () => {
    expect(daysUntil("2026-08-01", new Date("2026-08-10T00:00:00Z"))).toBe(-9);
  });

  it("ignores time-of-day on `now` — only the calendar date matters", () => {
    const morning = daysUntil("2026-09-01", new Date("2026-08-01T02:00:00Z"));
    const night = daysUntil("2026-09-01", new Date("2026-08-01T23:59:00Z"));
    expect(morning).toBe(night);
  });
});

describe("checkLicenseExpiries", () => {
  const now = new Date("2026-08-13T00:00:00Z");

  it("marks a license expiring in 61 days as not urgent", () => {
    const [status] = checkLicenseExpiries([{ label: "x", validUntil: "2026-10-13" }], now);
    expect(status.urgent).toBe(false);
  });

  it("marks a license expiring in exactly 60 days as urgent (boundary is inclusive)", () => {
    const [status] = checkLicenseExpiries([{ label: "x", validUntil: "2026-10-12" }], now);
    expect(status.daysLeft).toBe(60);
    expect(status.urgent).toBe(true);
  });

  it("marks an already-expired license as urgent", () => {
    const [status] = checkLicenseExpiries([{ label: "x", validUntil: "2026-01-01" }], now);
    expect(status.daysLeft).toBeLessThan(0);
    expect(status.urgent).toBe(true);
  });

  it("sorts soonest-expiring first regardless of input order", () => {
    const results = checkLicenseExpiries(
      [
        { label: "far", validUntil: "2029-01-01" },
        { label: "near", validUntil: "2026-09-01" },
        { label: "mid", validUntil: "2027-01-01" },
      ],
      now,
    );
    expect(results.map((r) => r.label)).toEqual(["near", "mid", "far"]);
  });

  it("returns empty for no licenses (e.g. brand not yet published)", () => {
    expect(checkLicenseExpiries([], now)).toEqual([]);
  });
});

describe("formatLicenseExpiryReport", () => {
  it("uses a calm ✅ header when nothing is urgent", () => {
    const text = formatLicenseExpiryReport([
      { label: "อย. 123", validUntil: "2030-01-01", daysLeft: 999, urgent: false },
    ]);
    expect(text).toContain("✅");
    expect(text).not.toContain("🚨");
  });

  it("uses 🚨 and calls out the count when something is urgent", () => {
    const text = formatLicenseExpiryReport([
      { label: "ฆพ.287/2567 (HeartSave Y8)", validUntil: "2026-09-01", daysLeft: 20, urgent: true },
      { label: "อย. 123", validUntil: "2030-01-01", daysLeft: 999, urgent: false },
    ]);
    expect(text).toContain("🚨");
    expect(text).toContain("1 ใบ");
    expect(text).toContain("ฆพ.287/2567 (HeartSave Y8)");
    expect(text).toContain("เหลือ 20 วัน");
  });

  it("flags an already-expired license with an explicit takedown instruction", () => {
    const text = formatLicenseExpiryReport([
      { label: "อย. 123", validUntil: "2026-01-01", daysLeft: -5, urgent: true },
    ]);
    expect(text).toContain("หมดอายุแล้ว 5 วัน");
    expect(text).toContain("ถอดเลขนี้ออกจากเว็บทันที");
  });
});
