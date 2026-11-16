import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

const pushed: string[] = [];
vi.mock("./notify-owner", () => ({ pushToOwner: async (t: string) => (pushed.push(t), true) }));

const { handleRentalCheckout, handleRentalEvent } = await import("./rental-billing-webhook");

// ── Minimal in-memory stand-in for the supabase-js calls the handler makes ──
type Rec = Record<string, unknown>;
function fakeDb() {
  const tables: Record<string, Rec[]> = { aed_rental_billing: [], aed_rental_billing_invoices: [] };
  const from = (name: string) => {
    const rows = tables[name];
    const filters: [string, unknown][] = [];
    const match = (r: Rec) => filters.every(([k, v]) => r[k] === v);
    let op: "select" | "update" = "select";
    let patch: Rec = {};
    let countHead = false;
    const q = {
      select(_c?: string, opts?: { count?: string; head?: boolean }) {
        countHead = !!opts?.head;
        return q;
      },
      eq(k: string, v: unknown) {
        filters.push([k, v]);
        return op === "update" ? q.exec() : q;
      },
      async maybeSingle() {
        return { data: rows.find(match) ?? null, error: null };
      },
      update(p: Rec) {
        op = "update";
        patch = p;
        return q;
      },
      async exec() {
        rows.filter(match).forEach((r) => Object.assign(r, patch));
        return { error: null };
      },
      insert(rec: Rec) {
        const dup =
          name === "aed_rental_billing_invoices" &&
          rows.some((r) => r.stripe_invoice_id === rec.stripe_invoice_id && r.status === rec.status && r.attempt === rec.attempt);
        if (dup) return Promise.resolve({ error: { code: "23505", message: "duplicate" } });
        rows.push({ ...rec });
        return Promise.resolve({ error: null });
      },
      upsert(rec: Rec) {
        const exists = rows.some((r) => r.stripe_subscription_id === rec.stripe_subscription_id);
        if (!exists) rows.push({ ...rec });
        return { select: async () => ({ data: exists ? [] : [{ id: 1 }], error: null }) };
      },
      then(res: (v: unknown) => void) {
        // awaited select with count/head
        const data = rows.filter(match);
        res(countHead ? { count: data.length, error: null } : { data, error: null });
      },
    };
    return q;
  };
  return { db: { from } as unknown as SupabaseClient, tables };
}

const ANCHOR = Math.floor(Date.parse("2026-12-16T10:00:00+07:00") / 1000);
const md = { kind: "rental_billing", plan_id: "rto-y2", units: "1", months_total: "18", customer_name: "คุณเอ", company_name: "บริษัท บี", phone: "", contract_ref: "RTO-1" };

function fakeStripe() {
  const updates: Rec[] = [];
  const stripe = {
    subscriptions: {
      retrieve: async () => ({ id: "sub_1", billing_cycle_anchor: ANCHOR, start_date: ANCHOR - 30 * 86400, cancel_at: null }),
      update: async (_id: string, p: Rec) => (updates.push(p), { id: "sub_1", billing_cycle_anchor: ANCHOR, cancel_at: p.cancel_at }),
    },
  } as unknown as Stripe;
  return { stripe, updates };
}

const session = {
  id: "cs_1",
  mode: "subscription",
  subscription: "sub_1",
  customer: "cus_1",
  metadata: md,
  amount_total: 1_712_000,
  customer_details: { email: "a@example.com", name: "บริษัท บี", phone: null },
} as unknown as Stripe.Checkout.Session;

const invoiceEvent = (type: string, id: string, extra: Rec = {}) =>
  ({
    type,
    data: {
      object: {
        id,
        billing_reason: "subscription_cycle",
        amount_paid: 310_300,
        amount_due: 310_300,
        attempt_count: 1,
        hosted_invoice_url: "https://invoice.stripe.com/i/x",
        next_payment_attempt: null,
        parent: { subscription_details: { subscription: "sub_1", metadata: md } },
        ...extra,
      },
    },
  }) as unknown as Stripe.Event;

describe("rental billing webhook", () => {
  beforeEach(() => {
    pushed.length = 0;
  });

  it("checkout: ends rent-to-own right after the 18th instalment, records once, alerts once", async () => {
    const { db, tables } = fakeDb();
    const { stripe, updates } = fakeStripe();
    await handleRentalCheckout(stripe, db, session);
    await handleRentalCheckout(stripe, db, session); // Stripe retry
    expect(updates[0]).toEqual({ cancel_at: Math.floor(Date.parse("2028-06-16T10:00:00+07:00") / 1000), proration_behavior: "none" });
    expect(tables.aed_rental_billing).toHaveLength(1);
    expect(tables.aed_rental_billing[0]).toMatchObject({ installments_paid: 0, months_total: 18, monthly_total_thb: 3_103 });
    expect(pushed).toHaveLength(1);
    expect(pushed[0]).toContain("฿17,120");
  });

  it("ignores one-time order sessions and non-rental invoices", async () => {
    const { db } = fakeDb();
    const { stripe } = fakeStripe();
    expect((await handleRentalCheckout(stripe, db, { ...session, mode: "payment" } as Stripe.Checkout.Session)).handled).toBe(false);
    const other = invoiceEvent("invoice.paid", "in_x", { parent: { subscription_details: { subscription: "sub_9", metadata: {} } } });
    expect((await handleRentalEvent(db, other)).handled).toBe(false);
  });

  it("counts instalments idempotently and flags past_due on failure", async () => {
    const { db, tables } = fakeDb();
    const { stripe } = fakeStripe();
    await handleRentalCheckout(stripe, db, session);
    pushed.length = 0;

    // The down-payment invoice is not an instalment.
    await handleRentalEvent(db, invoiceEvent("invoice.paid", "in_0", { billing_reason: "subscription_create" }));
    await handleRentalEvent(db, invoiceEvent("invoice.paid", "in_1"));
    await handleRentalEvent(db, invoiceEvent("invoice.paid", "in_1")); // retry
    expect(tables.aed_rental_billing[0].installments_paid).toBe(1);
    expect(pushed).toHaveLength(1);
    expect(pushed[0]).toContain("งวดที่ 1/18");

    await handleRentalEvent(db, invoiceEvent("invoice.payment_failed", "in_2"));
    await handleRentalEvent(db, invoiceEvent("invoice.payment_failed", "in_2")); // retry, same attempt
    await handleRentalEvent(db, invoiceEvent("invoice.payment_failed", "in_2", { attempt_count: 2 })); // Stripe retried the card
    expect(tables.aed_rental_billing[0].status).toBe("past_due");
    expect(pushed.filter((t) => t.includes("ตัดบัตรไม่ผ่าน"))).toHaveLength(2);

    await handleRentalEvent(db, invoiceEvent("invoice.paid", "in_2"));
    expect(tables.aed_rental_billing[0]).toMatchObject({ installments_paid: 2, status: "active" });
  });

  it("subscription ending early alerts the team; ending after the last instalment does not", async () => {
    const { db, tables } = fakeDb();
    const { stripe } = fakeStripe();
    await handleRentalCheckout(stripe, db, session);
    pushed.length = 0;
    const deleted = { type: "customer.subscription.deleted", data: { object: { id: "sub_1", metadata: md, cancellation_details: { reason: "payment_failed" } } } } as unknown as Stripe.Event;
    await handleRentalEvent(db, deleted);
    expect(tables.aed_rental_billing[0].status).toBe("canceled");
    expect(pushed[0]).toContain("หยุดตัดบัตร");

    tables.aed_rental_billing[0].status = "active";
    tables.aed_rental_billing[0].installments_paid = 18;
    pushed.length = 0;
    await handleRentalEvent(db, deleted);
    expect(tables.aed_rental_billing[0].status).toBe("completed");
    expect(pushed).toHaveLength(0);
  });
});
