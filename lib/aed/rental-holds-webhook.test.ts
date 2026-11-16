import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

const pushed: string[] = [];
vi.mock("./notify-owner", () => ({ pushToOwner: async (t: string) => (pushed.push(t), true) }));
const { handleHoldCanceled, handleHoldCheckout } = await import("./rental-holds-webhook");

type Rec = Record<string, unknown>;
function fakeDb() {
  const rows: Rec[] = [];
  let nextId = 1;
  const from = () => {
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
      upsert(rec: Rec) {
        const exists = rows.some((r) => r.payment_intent_id === rec.payment_intent_id);
        const added = exists ? [] : [{ id: nextId++, ...rec }];
        rows.push(...added);
        return { select: async () => ({ data: added, error: null }) };
      },
    };
    return q;
  };
  return { db: { from } as unknown as SupabaseClient, rows };
}

const CAPTURE_BEFORE = Math.floor(Date.parse("2026-11-23T10:00:00Z") / 1000);
const md = {
  kind: "rental_hold",
  package_id: "event-day",
  days: "2",
  units: "1",
  rent_thb: "2568",
  hold_thb: "30000",
  event_name: "มาราธอน",
  return_date: "2026-11-18",
  customer_name: "",
  company_name: "บริษัท วิ่ง",
  phone: "",
  contract_ref: "",
};
const stripe = {
  paymentIntents: {
    retrieve: async () => ({
      id: "pi_1",
      status: "requires_capture",
      amount_capturable: 3_256_800,
      latest_charge: { payment_method_details: { card: { capture_before: CAPTURE_BEFORE } } },
    }),
  },
} as unknown as Stripe;
const session = { id: "cs_h", mode: "payment", payment_intent: "pi_1", metadata: md, customer_details: { email: "a@example.com" } } as unknown as Stripe.Checkout.Session;

describe("event-rental hold webhook", () => {
  beforeEach(() => {
    pushed.length = 0;
  });

  it("records the hold once with its expiry and tells the team the deadline", async () => {
    const { db, rows } = fakeDb();
    await handleHoldCheckout(stripe, db, session);
    await handleHoldCheckout(stripe, db, session); // retry
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: "authorized", authorized_thb: 32_568, rent_thb: 2_568, capture_before: "2026-11-23T10:00:00.000Z" });
    expect(pushed).toHaveLength(1);
    expect(pushed[0]).toContain("เก็บค่าเช่า");
  });

  it("ignores ordinary order sessions", async () => {
    const { db } = fakeDb();
    expect((await handleHoldCheckout(stripe, db, { ...session, metadata: { product_id: "primedic-y2" } } as Stripe.Checkout.Session)).handled).toBe(false);
  });

  it("an expired hold alerts; a hold the team released does not", async () => {
    const { db, rows } = fakeDb();
    await handleHoldCheckout(stripe, db, session);
    pushed.length = 0;
    const pi = { id: "pi_1", metadata: md } as unknown as Stripe.PaymentIntent;

    rows[0].status = "released";
    await handleHoldCanceled(db, pi);
    expect(pushed).toHaveLength(0);

    rows[0].status = "authorized";
    await handleHoldCanceled(db, pi);
    expect(rows[0].status).toBe("expired");
    expect(pushed[0]).toContain("หมดอายุ");
  });
});
