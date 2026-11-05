import {describe, expect, it} from "vitest";
import {
  GADS_CALL_CLICK_CONVERSION_LABEL,
  GADS_ID,
  GADS_LEAD_CONVERSION_LABEL,
  GADS_LINE_CLICK_CONVERSION_LABEL,
  GADS_VERIFIED_LEAD_ID,
  gadsConversionParams,
  gadsSendTo,
} from "./google-ads-tag";

describe("Google Ads destination routing", () => {
  it("uses the verified Jia1669.com actions for LINE and phone clicks", () => {
    expect(GADS_VERIFIED_LEAD_ID).toBe("AW-873507669");
    expect(gadsSendTo(GADS_LINE_CLICK_CONVERSION_LABEL)).toBe("AW-873507669/nOwLCPvsjdgYENXWwqAD");
    expect(gadsSendTo(GADS_CALL_CLICK_CONVERSION_LABEL)).toBe("AW-873507669/n5asCPjsjdgYENXWwqAD");
    expect(gadsConversionParams(GADS_LINE_CLICK_CONVERSION_LABEL)).toEqual({
      send_to: "AW-873507669/nOwLCPvsjdgYENXWwqAD", value: 494.8, currency: "THB",
    });
    expect(gadsConversionParams(GADS_CALL_CLICK_CONVERSION_LABEL)).toEqual({
      send_to: "AW-873507669/n5asCPjsjdgYENXWwqAD", value: 494.8, currency: "THB",
    });
  });

  it("routes successful forms to Lead Form Submit without an assigned monetary value", () => {
    expect(gadsSendTo(GADS_LEAD_CONVERSION_LABEL)).toBe("AW-873507669/-UU0CKTs79gcENXWwqAD");
    expect(gadsConversionParams(GADS_LEAD_CONVERSION_LABEL)).toEqual({
      send_to: "AW-873507669/-UU0CKTs79gcENXWwqAD", value: 0, currency: "THB",
    });
  });

  it("preserves the loader configuration and skips missing labels", () => {
    expect(GADS_ID).toBe("AW-10780588709");
    expect(gadsSendTo(null)).toBeNull();
    expect(gadsSendTo(undefined)).toBeNull();
    expect(gadsConversionParams("")).toBeNull();
  });
});
