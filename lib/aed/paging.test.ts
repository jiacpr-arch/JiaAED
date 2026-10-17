import { describe, expect, it } from "vitest";
import { PAGE_SIZE, fetchAllRows } from "./paging";

describe("fetchAllRows", () => {
  it("keeps requesting pages until a short page", async () => {
    const total = PAGE_SIZE * 2 + 5;
    const calls: Array<[number, number]> = [];
    const rows = await fetchAllRows<number>(async (from, to) => {
      calls.push([from, to]);
      const data = Array.from({ length: Math.max(0, Math.min(to, total - 1) - from + 1) }, (_, i) => from + i);
      return { data, error: null };
    });
    expect(rows).toHaveLength(total);
    expect(calls).toEqual([
      [0, PAGE_SIZE - 1],
      [PAGE_SIZE, 2 * PAGE_SIZE - 1],
      [2 * PAGE_SIZE, 3 * PAGE_SIZE - 1],
    ]);
  });

  it("surfaces query errors instead of returning a partial count", async () => {
    await expect(fetchAllRows(async () => ({ data: null, error: { message: "boom" } }))).rejects.toThrow("boom");
  });
});
