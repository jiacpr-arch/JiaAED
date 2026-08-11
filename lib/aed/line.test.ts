import { describe, expect, it } from "vitest";

import { LINE_ADD_FRIEND, LINE_OA, LINE_OA_ID, lineOaUrl } from "./line";

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

  it("percent-encodes the Thai default message", () => {
    expect(lineOaUrl()).toContain(`/?${encodeURIComponent("สนใจ AED ครับ")}`);
  });
});

// The follow webhook — greeting message, customer row, owner notification, and
// the paid-ad conversion itself — only fires from the add-friend link. A CTA
// pointing at oaMessage leaks the entire funnel (159 clicks → 1 follow in the
// 30 days before this was changed), so the site-wide CTA must stay on ti/p.
describe("LINE_ADD_FRIEND", () => {
  it("uses the ti/p add-friend scheme with the encoded OA id", () => {
    expect(LINE_ADD_FRIEND).toBe(`https://line.me/R/ti/p/${encodeURIComponent(LINE_OA_ID)}`);
  });

  it("carries no prefilled message — ti/p takes no query string", () => {
    expect(LINE_ADD_FRIEND).not.toContain("?");
  });

  it("is what the site-wide CTA constant resolves to", () => {
    expect(LINE_OA).toBe(LINE_ADD_FRIEND);
    expect(LINE_OA).not.toContain("oaMessage");
  });
});
