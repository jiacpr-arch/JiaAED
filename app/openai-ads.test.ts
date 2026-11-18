import { afterEach, expect, it, vi } from "vitest";
import { pixelLeadCreated, pixelPageView, setPixelConsent } from "./openai-ads";

afterEach(() => vi.unstubAllGlobals());

it("requires consent and queues a stable ID only for a verified lead ID", () => {
  const browser: { location: { hostname: string; pathname: string }; oaiq?: { q: IArguments[] } } = {
    location: { hostname: "jiaaed.com", pathname: "/" },
  };
  vi.stubGlobal("window", browser);
  vi.stubGlobal("document", {
    createElement: () => ({ dataset: {} }),
    head: { appendChild: vi.fn() },
  });
  const id = "123e4567-e89b-42d3-a456-426614174000";
  pixelLeadCreated(id);
  expect(browser.oaiq).toBeUndefined();

  browser.location.pathname = "/aed/checkout/success";
  setPixelConsent(true);
  pixelPageView(browser.location.pathname);
  expect(browser.oaiq).toBeUndefined();

  browser.location.pathname = "/";
  setPixelConsent(true);
  pixelLeadCreated(undefined);
  pixelLeadCreated("invalid");
  pixelLeadCreated(id);
  pixelLeadCreated(id.toUpperCase());
  setPixelConsent(false);
  pixelLeadCreated(id);

  const leads = browser.oaiq?.q.map(row => Array.from(row)).filter(row => row[1] === "lead_created");
  expect(leads).toEqual(Array.from({ length: 2 }, () => [
    "measure", "lead_created", { type: "customer_action" },
    { opt_out: true, event_id: "lead:" + id },
  ]));
});
