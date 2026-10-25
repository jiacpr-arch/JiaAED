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
    expect(totals["pkg-start-y8"]).toBe(52_000); // deposit cut to 2 งวด, owner 25 ต.ค. 2026
    expect(totals["pkg-start-y2"]).toBe(68_000);
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

describe("rental price ladder (owner, 25 ต.ค. 2026)", () => {
  it("a longer rental never costs less in total, and always less per day", async () => {
    const { RENTAL_PRICES: P } = await import("./rental-prices");
    const ladder: [string, number, number][] = [
      ["1 วัน", P.eventFirstDay, 1],
      ["3 วัน", P.eventWeekend, 3],
      ["7 วัน", P.eventWeekly, 7],
      ["14 วัน", P.eventFortnight, 14],
      ["1 เดือน", P.oneMonth, 30],
      [`FLEX ${P.flexMinMonths} เดือน`, P.flexMonthly * P.flexMinMonths, 30 * P.flexMinMonths],
      ["รายปี", P.annual, 365],
    ];
    for (let i = 1; i < ladder.length; i++) {
      const [prevName, prevTotal, prevDays] = ladder[i - 1];
      const [name, total, days] = ladder[i];
      expect(total, `${name} total vs ${prevName}`).toBeGreaterThan(prevTotal);
      expect(total / days, `${name} per day vs ${prevName}`).toBeLessThan(prevTotal / prevDays);
    }
  });
});
