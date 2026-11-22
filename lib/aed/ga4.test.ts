import { afterEach, describe, expect, it, vi } from "vitest";
import { gaClientIdFromCookie, isGaClientId, sendGa4Events } from "./ga4";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GA client id", () => {
  it("reads the client id from the _ga cookie", () => {
    expect(gaClientIdFromCookie("a=1; _ga=GA1.1.123456789.1700000000; _ga_X=GS1.1.x")).toBe("123456789.1700000000");
    expect(gaClientIdFromCookie("_ga=GA1.2.5.6")).toBe("5.6");
  });

  it("ignores missing or malformed cookies", () => {
    expect(gaClientIdFromCookie(null)).toBeNull();
    expect(gaClientIdFromCookie("_ga_ABC=GS1.1.1.1")).toBeNull();
    expect(gaClientIdFromCookie("_ga=garbage")).toBeNull();
  });

  it("only accepts digits.digits from a form body", () => {
    expect(isGaClientId("123.456")).toBe(true);
    expect(isGaClientId("123")).toBe(false);
    expect(isGaClientId("1.2<script>")).toBe(false);
    expect(isGaClientId(42)).toBe(false);
  });
});

describe("sendGa4Events", () => {
  it("is a no-op without GA4_API_SECRET", async () => {
    vi.stubEnv("GA4_API_SECRET", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendGa4Events("1.2", [{ name: "qualified_lead" }])).toMatchObject({ ok: true, sent: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the events for the client id", async () => {
    vi.stubEnv("GA4_API_SECRET", "s3cret");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);
    const r = await sendGa4Events("1.2", [{ name: "quotation_sent", params: { value: 1830, currency: "THB" } }]);
    expect(r).toEqual({ ok: true, sent: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/mp/collect?measurement_id=G-");
    expect(url).toContain("api_secret=s3cret");
    expect(JSON.parse(init.body)).toMatchObject({ client_id: "1.2", events: [{ name: "quotation_sent", params: { value: 1830 } }] });
  });
});
