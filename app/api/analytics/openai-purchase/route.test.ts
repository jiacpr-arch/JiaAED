import { afterEach, expect, it, vi } from "vitest";

const { retrieve } = vi.hoisted(() => ({ retrieve: vi.fn() }));
vi.mock("@/lib/aed/stripe", () => ({ getStripe: () => ({ checkout: { sessions: { retrieve } } }) }));
import { POST } from "./route";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const sessionId = "cs_live_Synthetic123";
const request = (consent: boolean, host = "jiaaed.com") => new Request("https://" + host, {
  method: "POST",
  headers: { origin: "https://" + host, host, cookie: "__oppref=opaque%2F+token" },
  body: JSON.stringify({ consent, sessionId }),
});

it("blocks preview and unconsented calls, then posts only a verified minimal event", async () => {
  vi.stubEnv("OPENAI_ADS_CAPI_ENABLED", "true");
  vi.stubEnv("OPENAI_ADS_CAPI_KEY", "synthetic-test-only");
  const fetcher = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetcher);
  expect((await POST(request(true, "preview.example"))).status).toBe(403);
  expect((await POST(request(false))).status).toBe(400);
  expect(retrieve).not.toHaveBeenCalled();
  expect(fetcher).not.toHaveBeenCalled();

  retrieve.mockResolvedValue({
    id: sessionId, livemode: true, mode: "payment", payment_status: "paid", currency: "thb", amount_total: 100000,
    payment_intent: { status: "succeeded", amount_received: 100000, latest_charge: { created: Math.floor(Date.now() / 1000), amount_refunded: 0 } },
    metadata: { openai_storefront: "1", product_id: "primedic-y2" }, customer_details: { email: "private@example.test" },
  });
  expect((await POST(request(true))).status).toBe(204);
  const event = JSON.parse(fetcher.mock.calls[0][1].body).events[0];
  expect(event).toMatchObject({ type: "order_created", oppref: "opaque%2F+token", data: { amount: 100000, currency: "THB" } });
  expect(JSON.stringify(event)).not.toMatch(/private|cs_live|primedic/);
});
