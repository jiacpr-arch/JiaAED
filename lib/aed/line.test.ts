import { describe, expect, it } from "vitest";

import { LINE_OA, LINE_OA_ID, lineOaUrl } from "./line";

// LINE URL scheme spec ("Sending a message to a LINE Official Account"):
// https://line.me/R/oaMessage/{OA_ID}/?{url-encoded message}
// The message is the raw query string — a `text=` key or `+` for spaces both
// end up as literal characters in the customer's chat box.
describe("lineOaUrl", () => {
  it("encodes the OA id and puts the message directly after ?", () => {
    expect(lineOaUrl("Hello world")).toBe(
      `https://line.me/R/oaMessage/${encodeURIComponent(LINE_OA_ID)}/?Hello%20world`,
    );
  });

  it("does not use a text= parameter or + for spaces", () => {
    const url = lineOaUrl("สนใจ AED ครับ");
    expect(url).not.toContain("?text=");
    expect(url).not.toContain("+");
  });

  it("percent-encodes Thai default message", () => {
    expect(LINE_OA).toBe(lineOaUrl());
    expect(LINE_OA).toContain(`/?${encodeURIComponent("สนใจ AED ครับ")}`);
  });
});
