import { describe, it, expect } from "vitest";
import { rentToOwnBreakdowns, rentToOwnTotal, rentalFaqCategories } from "./rental";
import { acquisitionPackages } from "./packages";

describe("rentToOwnBreakdowns", () => {
  it("every breakdown maps to a rent-to-own acquisition package", () => {
    for (const b of rentToOwnBreakdowns) {
      const pkg = acquisitionPackages.find((p) => p.id === b.packageId);
      expect(pkg, `missing package ${b.packageId}`).toBeDefined();
      expect(pkg!.kind).toBe("rent-to-own");
    }
  });

  it("derived totals match the owner-approved contract values", () => {
    // ยอดรวมที่เจ้าของอนุมัติ: Y8 = 62,800 · Y2 = 83,200 — ถ้าแก้ deposit/monthly
    // ต้องได้รับอนุมัติใหม่และอัปเดตที่นี่พร้อม priceNote ใน packages.ts
    const totals = Object.fromEntries(
      rentToOwnBreakdowns.map((b) => [b.packageId, rentToOwnTotal(b)]),
    );
    expect(totals["pkg-start-y8"]).toBe(62_800);
    expect(totals["pkg-start-y2"]).toBe(83_200);
  });

  it("breakdown numbers appear verbatim in the package priceNote", () => {
    for (const b of rentToOwnBreakdowns) {
      const pkg = acquisitionPackages.find((p) => p.id === b.packageId)!;
      expect(pkg.priceNote).toContain(`฿${b.deposit.toLocaleString()}`);
      expect(pkg.priceNote).toContain(`฿${b.monthly.toLocaleString()}`);
      expect(pkg.priceNote).toContain(`${b.months} เดือน`);
    }
  });
});

describe("rentalFaqCategories", () => {
  it("has both a rental and a rent-to-own category with items", () => {
    expect(rentalFaqCategories).toHaveLength(2);
    for (const c of rentalFaqCategories) {
      expect(c.items.length).toBeGreaterThan(0);
    }
    expect(rentalFaqCategories[1].category).toContain("เช่าซื้อ");
  });
});
