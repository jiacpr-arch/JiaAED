import { describe, expect, it } from "vitest";
import { parseSessionId } from "./web-chat-log";

describe("parseSessionId", () => {
  it("accepts a crypto.randomUUID() value and normalises case", () => {
    expect(parseSessionId("3F2B8C1E-9A4D-4E6B-8C2A-1D5E7F9A0B3C")).toBe(
      "3f2b8c1e-9a4d-4e6b-8c2a-1d5e7f9a0b3c",
    );
  });

  it("rejects anything that isn't a UUID", () => {
    for (const bad of [undefined, null, 42, "", "abc", "' OR 1=1 --", "3f2b8c1e-9a4d-4e6b-8c2a-1d5e7f9a0b3c-extra"]) {
      expect(parseSessionId(bad)).toBeNull();
    }
  });
});
