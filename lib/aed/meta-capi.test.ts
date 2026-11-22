import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMetaLeadEvent, sendMetaStageEvent } from "./meta-capi";

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

describe("Meta CAPI lead-stage events", () => {
  it("sends one system_generated event with value in THB", async () => {
    await sendMetaStageEvent({ eventName: "Subscribe", eventId: "lead:x:contract_signed", phone: "0812345678", valueThb: 21960, leadSource: "gps_rental" });
    const ev = JSON.parse(fetchMock.mock.calls[0][1].body).data;
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ event_name: "Subscribe", event_id: "lead:x:contract_signed", action_source: "system_generated" });
    expect(ev[0].custom_data).toMatchObject({ currency: "THB", value: 21960, content_name: "gps_rental" });
    expect(ev[0].user_data.ph).toBeDefined();
    expect(JSON.stringify(ev)).not.toContain("0812345678");
  });

  it("skips a lead with nothing to match on", async () => {
    const r = await sendMetaStageEvent({ eventName: "QualifiedLead", eventId: "lead:y:qualified_lead" });
    expect(r).toMatchObject({ sent: false, reason: "no_identifier" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
