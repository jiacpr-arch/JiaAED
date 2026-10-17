import { describe, expect, it } from "vitest";
import { packRows } from "./notify-queue";

const row = (id: number, n: number) => ({ id, text: "x".repeat(n) });

describe("packRows", () => {
  it("keeps rows whole and in order, filling each message up to the limit", () => {
    const groups = packRows([row(1, 40), row(2, 40), row(3, 40)], 100);
    expect(groups.map((g) => g.map((r) => r.id))).toEqual([[1, 2], [3]]);
  });

  it("gives an oversized row a group of its own", () => {
    const groups = packRows([row(1, 10), row(2, 500), row(3, 10)], 100);
    expect(groups.map((g) => g.map((r) => r.id))).toEqual([[1], [2], [3]]);
  });

  it("returns nothing for an empty queue", () => {
    expect(packRows([], 100)).toEqual([]);
  });
});
