import { describe, expect, it } from "vitest";
import { retryKeyFor } from "./customer-notify";

describe("retryKeyFor", () => {
  it("is a stable v4-shaped UUID per row", () => {
    const k = retryKeyFor(42);
    expect(k).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(retryKeyFor(42)).toBe(k);
    expect(retryKeyFor(43)).not.toBe(k);
  });
});
