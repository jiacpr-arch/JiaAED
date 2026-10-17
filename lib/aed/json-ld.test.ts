import { describe, expect, it } from "vitest";
import { jsonLd } from "./json-ld";

describe("jsonLd", () => {
  it("cannot close the surrounding <script> element", () => {
    const out = jsonLd({ name: "</script><script>alert(1)</script>", note: "a & b <!--" });
    expect(out).not.toMatch(/[<>&]/);
  });

  it("round-trips to the same data", () => {
    const data = { name: "</script>", x: [1, "a&b"], ls: "  " };
    expect(JSON.parse(jsonLd(data))).toEqual(data);
  });
});
