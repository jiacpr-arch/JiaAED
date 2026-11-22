import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMetaLeadEvent } from "./meta-capi";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123");
  vi.stubEnv("META_CAPI_TOKEN", "test-token");
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ events_received: 1 }) });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

const sentEvents = () => JSON.parse(fetchMock.mock.calls[0][1].body).data.map((e: { event_name: string; event_id: string }) => [e.event_name, e.event_id]);

describe("Meta CAPI event names", () => {
  it("a stored form lead goes out as Lead + CompleteRegistration", async () => {
    await sendMetaLeadEvent({ eventId: "e1", fbp: "fb.1.1.1" });
    expect(sentEvents()).toEqual([["Lead", "e1"], ["CompleteRegistration", "e1"]]);
  });

  it("a LINE click goes out as Contact only — never as a Lead", async () => {
    await sendMetaLeadEvent({ eventName: "Contact", eventId: "e2", fbp: "fb.1.1.1" });
    expect(sentEvents()).toEqual([["Contact", "e2"]]);
  });
});
