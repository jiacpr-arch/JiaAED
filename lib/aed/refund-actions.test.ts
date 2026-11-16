import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

const pushed: string[] = [];
vi.mock("./notify-owner", () => ({ pushToOwner: async (t: string) => (pushed.push(t), true) }));
const { endFlexRental, refundOrder } = await import("./refund-actions");

type Rec = Record<string, unknown>;
function fakeDb(tables: Record<string, Rec[]>) {
  const from = (name: string) => {
    const rows = tables[name];
    const filters: [string, unknown][] = [];
    const match = (r: Rec) => filters.every(([k, v]) => r[k] === v);
    let patch: Rec | null = null;
    const q = {
      select: () => q,
      eq(k: string, v: unknown) {
        filters.push([k, v]);
        if (patch) {
          rows.filter(match).forEach((r) => Object.assign(r, patch));
          return Promise.resolve({ error: null });
        }
        return q;
      },
      maybeSingle: async () => ({ data: rows.find(match) ?? null, error: null }),
      update(p: Rec) {
        patch = p;
        return q;
      },
    };
    return q;
  };
  return { from } as unknown as SupabaseClient;
}

function fakeStripe() {
  const calls: Rec[] = [];
  const stripe = {
    refunds: { create: async (p: Rec, o: Rec) => (calls.push({ refund: p, ...o }), { id: "re_1" }) },
    subscriptions: { cancel: async (id: string, p: Rec) => (calls.push({ cancel: id, ...p }), { id }) },
    invoices: {
      list: async () => ({ data: [{ id: "in_2", billing_reason: "subscription_cycle" }, { id: "in_1", billing_reason: "subscription_create" }] }),
    },
    invoicePayments: {
      list: async ({ invoice }: { invoice: string }) => ({ data: invoice === "in_1" ? [{ status: "paid", payment: { payment_intent: "pi_deposit" } }] : [] }),
    },
  } as unknown as Stripe;
  return { stripe, calls };
}

describe("admin refunds", () => {
  beforeEach(() => {
    pushed.length = 0;
  });

  it("partial then final order refund, never above what was paid", async () => {
    const order = { id: 7, status: "paid", payment_intent_id: "pi_order", total_thb: 58_743, refunded_thb: 0, product_id: "set-y2-ready", customer_name: "ก", company_name: null };
    const db = fakeDb({ aed_orders: [order] });
    const { stripe, calls } = fakeStripe();

    expect(await refundOrder(stripe, db, 7, 10_000)).toMatchObject({ ok: true, refunded: 10_000, left: 48_743 });
    expect(await refundOrder(stripe, db, 7, 50_000)).toMatchObject({ ok: false, error: "bad_amount" });
    expect(await refundOrder(stripe, db, 7, 48_743)).toMatchObject({ ok: true, left: 0 });
    expect(await refundOrder(stripe, db, 7, 1)).toMatchObject({ ok: false, error: "nothing_to_refund" });

    expect(calls.map((c) => (c.refund as Rec).amount)).toEqual([1_000_000, 4_874_300]);
    expect(calls[0].idempotencyKey).not.toBe(calls[1].idempotencyKey);
    expect(order.refunded_thb).toBe(58_743);
    expect(pushed).toHaveLength(2);
  });

  it("ending FLEX cancels rent and refunds deposit − damage from the first invoice", async () => {
    const row = { stripe_subscription_id: "sub_f", plan_id: "flex", units: 1, status: "active", company_name: "บริษัท ข", customer_name: null, contract_ref: "F-1" };
    const db = fakeDb({ aed_rental_billing: [row] });
    const { stripe, calls } = fakeStripe();

    const r = await endFlexRental(stripe, db, "sub_f", 3_000);
    expect(r).toMatchObject({ ok: true, refunded: true, quote: { deposit: 10_000, damage: 3_000, refund: 7_000 } });
    expect(calls).toContainEqual({ cancel: "sub_f", prorate: false, invoice_now: false });
    expect(calls.find((c) => c.refund)).toMatchObject({ refund: { payment_intent: "pi_deposit", amount: 700_000 }, idempotencyKey: "flex-deposit-sub_f" });
    expect(row).toMatchObject({ status: "canceled", damage_thb: 3_000, deposit_refunded_thb: 7_000 });
    expect(pushed[0]).toContain("คืน ฿7,000");

    // second click on an ended rental does nothing
    expect(await endFlexRental(stripe, db, "sub_f", 0)).toMatchObject({ ok: false, error: "rental_not_active" });
  });

  it("damage ≥ deposit: rent stops, nothing refunded", async () => {
    const row = { stripe_subscription_id: "sub_g", plan_id: "flex", units: 1, status: "past_due", company_name: null, customer_name: "ค", contract_ref: null };
    const db = fakeDb({ aed_rental_billing: [row] });
    const { stripe, calls } = fakeStripe();
    expect(await endFlexRental(stripe, db, "sub_g", 20_000)).toMatchObject({ ok: true, quote: { refund: 0 } });
    expect(calls.some((c) => c.refund)).toBe(false);
  });

  it("rent-to-own can't be ended with a deposit refund", async () => {
    const db = fakeDb({ aed_rental_billing: [{ stripe_subscription_id: "sub_r", plan_id: "rto-y2", units: 1, status: "active" }] });
    const { stripe, calls } = fakeStripe();
    expect(await endFlexRental(stripe, db, "sub_r", 0)).toMatchObject({ ok: false, error: "not_flex" });
    expect(calls).toHaveLength(0);
  });
});

describe("hold excess refund after a late return", () => {
  it("previews then refunds captured − kept − fee share, once", async () => {
    const { refundHold } = await import("./refund-actions");
    const hold = { id: 3, status: "captured", payment_intent_id: "pi_h", captured_thb: 32_568, authorized_thb: 32_568, refunded_thb: 0, company_name: "ง", customer_name: null, event_name: "งานวิ่ง" };
    const db = fakeDb({ aed_rental_holds: [hold] });
    const { stripe, calls } = fakeStripe();
    (stripe as unknown as Rec).paymentIntents = {
      retrieve: async () => ({ latest_charge: { balance_transaction: { fee: 119_833 } } }),
    };
    const preview = await refundHold(stripe, db, 3, 5_457, true);
    expect(preview).toMatchObject({ ok: true, refunded: false, quote: { excess: 27_111 } });
    expect(calls).toHaveLength(0);

    const done = await refundHold(stripe, db, 3, 5_457, false);
    expect(done).toMatchObject({ ok: true, refunded: true });
    const q = (done as { quote: { refund: number; feeOnExcess: number } }).quote;
    expect(q.feeOnExcess).toBeGreaterThan(990);
    expect(calls[0]).toMatchObject({ refund: { payment_intent: "pi_h", amount: Math.round(q.refund * 100) }, idempotencyKey: "hold-excess-3" });
    expect(hold.refunded_thb).toBe(q.refund);
    expect(await refundHold(stripe, db, 3, 5_457, false)).toMatchObject({ ok: false, error: "already_refunded" });
  });
});
