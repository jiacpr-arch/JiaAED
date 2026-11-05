import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  single: vi.fn(),
  countRecent: vi.fn(),
  findRecentLead: vi.fn(),
  notifyNewLead: vi.fn(),
  sendLeadAutoReply: vi.fn(),
  sendLeadOwnerNotification: vi.fn(),
  sendMetaLeadEvent: vi.fn(),
  recordConversion: vi.fn(),
  updateCustomer: vi.fn(),
  createChatLead: vi.fn(),
  pending: [] as Promise<unknown>[],
}));

vi.mock("@vercel/functions", () => ({
  waitUntil: (promise: Promise<unknown>) => mocks.pending.push(promise),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      insert: mocks.insert.mockImplementation(() => ({
        select: () => ({ single: mocks.single }),
      })),
    }),
  }),
}));
vi.mock("./rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./rate-limit")>()),
  countRecent: mocks.countRecent,
  findRecentLead: mocks.findRecentLead,
}));
vi.mock("./notify-owner", () => ({
  notifyNewLead: mocks.notifyNewLead,
  notifyEscalation: vi.fn(),
  notifyNewQuotation: vi.fn(),
}));
vi.mock("./email", () => ({
  sendLeadAutoReply: mocks.sendLeadAutoReply,
  sendLeadOwnerNotification: mocks.sendLeadOwnerNotification,
}));
vi.mock("./meta-capi", () => ({ sendMetaLeadEvent: mocks.sendMetaLeadEvent }));
vi.mock("./conversion", () => ({ recordConversion: mocks.recordConversion }));
vi.mock("./db-queries", () => ({
  updateCustomer: mocks.updateCustomer,
  createChatLead: mocks.createChatLead,
  createDeal: vi.fn(),
  updateDeal: vi.fn(),
  scheduleFollowup: vi.fn(),
}));
vi.mock("./flowaccount", () => ({ createQuotation: vi.fn() }));

import { POST as submitLead } from "@/app/api/aed/lead/route";
import { POST as submitOfflineConversion } from "@/app/api/aed/google-ads/conversion/route";
import { handleUpdateCustomerInfo, type ToolContext } from "./tool-handlers";

const form = {
  fullName: "Test contact",
  email: "contact@example.com",
  gclid: "mock-click-id",
  marketingConsent: true,
  eventId: "mock-meta-event",
  source: "quote_form",
};

function request(body: unknown, authorization?: string): Request {
  return new Request("https://example.test/api", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(authorization ? { authorization } : {}),
    },
    body: JSON.stringify(body),
  });
}

function chatContext(): ToolContext {
  return {
    customer: {
      id: "mock-customer", line_user_id: null, full_name: null, phone: null,
      email: null, company_name: null, tax_id: null, address: null,
      customer_type: "individual", is_company: false, total_orders: 0,
      total_lifetime_value: 0, preferred_channel: "line", notes: null,
      created_at: "", last_active_at: "",
    },
    conversation: {
      id: "mock-conversation", customer_id: "mock-customer", channel: "line",
      channel_thread_id: "mock-thread", status: "active", current_intent: null,
      collected_data: {}, lead_score: 0, message_count: 1,
      last_message_at: "", created_at: "",
    },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.pending.length = 0;
  mocks.single.mockResolvedValue({ data: { id: "mock-lead" }, error: null });
  mocks.countRecent.mockResolvedValue(0);
  mocks.findRecentLead.mockResolvedValue(null);
  mocks.notifyNewLead.mockResolvedValue(undefined);
  mocks.sendLeadAutoReply.mockResolvedValue(undefined);
  mocks.sendLeadOwnerNotification.mockResolvedValue({ ok: true });
  mocks.sendMetaLeadEvent.mockResolvedValue(undefined);
  mocks.updateCustomer.mockResolvedValue(undefined);
  mocks.createChatLead.mockResolvedValue("mock-chat-lead");
  mocks.recordConversion.mockResolvedValue({ ok: true, sent: true, matchStrategy: "gclid" });
  // All effects are mocked: no CRM records, notifications or ad events leave tests.
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected network request"); }));
});

afterEach(async () => {
  await Promise.all(mocks.pending);
  expect(fetch).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("raw form leads", () => {
  it.each([true, false])("preserves CRM and notifications without offline uploads (consent=%s)", async (marketingConsent) => {
    const response = await submitLead(request({ ...form, marketingConsent }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, leadId: "mock-lead" });
    expect(mocks.insert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      email: form.email, gclid: form.gclid, source: "quote_form",
    }));
    expect(mocks.notifyNewLead).toHaveBeenCalledOnce();
    expect(mocks.sendLeadOwnerNotification).toHaveBeenCalledOnce();
    expect(mocks.sendLeadAutoReply).toHaveBeenCalledOnce();
    expect(mocks.sendMetaLeadEvent).toHaveBeenCalledTimes(marketingConsent ? 1 : 0);
    if (marketingConsent) {
      expect(mocks.sendMetaLeadEvent).toHaveBeenCalledWith(expect.objectContaining({
        eventId: form.eventId, email: form.email,
      }));
    }
    expect(mocks.recordConversion).not.toHaveBeenCalled();
  });

  it.each(["duplicate", "honeypot", "invalid"])("keeps the %s guard without side effects", async (kind) => {
    if (kind === "duplicate") mocks.findRecentLead.mockResolvedValue("prior-lead");
    const body = kind === "honeypot" ? { ...form, hp: "bot" }
      : kind === "invalid" ? { ...form, email: "bad-address" } : form;
    const response = await submitLead(request(body));
    expect(response.status).toBe(kind === "invalid" ? 400 : 200);
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.notifyNewLead).not.toHaveBeenCalled();
    expect(mocks.sendLeadOwnerNotification).not.toHaveBeenCalled();
    expect(mocks.sendLeadAutoReply).not.toHaveBeenCalled();
    expect(mocks.sendMetaLeadEvent).not.toHaveBeenCalled();
    expect(mocks.recordConversion).not.toHaveBeenCalled();
  });

  it("does not report a failed CRM insert", async () => {
    mocks.single.mockResolvedValue({ data: null, error: { message: "mock failure" } });
    const response = await submitLead(request(form));
    expect(response.status).toBe(500);
    expect(mocks.pending).toHaveLength(0);
    expect(mocks.recordConversion).not.toHaveBeenCalled();
  });
});

describe("raw chat contacts", () => {
  it.each(["line", "web"])("stores the first %s contact once without a Google upload", async (channel) => {
    const ctx = chatContext();
    ctx.conversation.channel = channel;
    const input = { email: form.email, full_name: form.fullName };
    const result = await handleUpdateCustomerInfo(ctx, input);
    await handleUpdateCustomerInfo(ctx, input);
    expect(result).toContain("บันทึกข้อมูลลูกค้าแล้ว");
    expect(mocks.updateCustomer).toHaveBeenCalledTimes(2);
    expect(mocks.createChatLead).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      customerId: ctx.customer.id, conversationId: ctx.conversation.id,
      channel, email: form.email,
    }));
    expect(ctx.customer.email).toBe(form.email);
    expect(mocks.recordConversion).not.toHaveBeenCalled();
  });

  it("updates non-contact information without creating a lead or upload", async () => {
    await handleUpdateCustomerInfo(chatContext(), { full_name: form.fullName });
    expect(mocks.updateCustomer).toHaveBeenCalledOnce();
    expect(mocks.createChatLead).not.toHaveBeenCalled();
    expect(mocks.recordConversion).not.toHaveBeenCalled();
  });
});

describe("protected offline outcome endpoint", () => {
  it("still rejects an unauthenticated upload", async () => {
    vi.stubEnv("AED_INTERNAL_API_KEY", "mock-only-key");
    const response = await submitOfflineConversion(request({ gclid: "mock-click-id" }));
    expect(response.status).toBe(401);
    expect(mocks.recordConversion).not.toHaveBeenCalled();
  });

  it("preserves explicit action, order, date and sale value for an authorized outcome", async () => {
    vi.stubEnv("AED_INTERNAL_API_KEY", "mock-only-key");
    const outcome = {
      conversionActionId: "mock-offline-action", orderId: "mock-sale-order",
      conversionDateTime: "2026-11-05 12:00:00+07:00", valueThb: 59000,
      gclid: "mock-click-id",
    };
    const response = await submitOfflineConversion(request(outcome, "Bearer mock-only-key"));
    expect(response.status).toBe(200);
    expect(mocks.recordConversion).toHaveBeenCalledExactlyOnceWith({
      ...outcome, gbraid: null, wbraid: null, email: null, phone: null,
    });
    expect(await response.json()).toEqual({ ok: true, sent: true, matchStrategy: "gclid" });
  });
});
