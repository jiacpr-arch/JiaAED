import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => mocks.client }));

import { deletableIds, monthsBefore, retentionCutoffs, runDataRetention } from "./data-retention";

type Row = Record<string, string | null>;

// In-memory stand-in for the PostgREST builder calls runDataRetention makes,
// including PostgREST's silent 1,000-row response cap.
const MAX_ROWS = 1000;
function fakeDb(tables: Record<string, Row[]>, inSizes: number[] = []) {
  const query = (table: string) => {
    const filters: Array<(r: Row) => boolean> = [];
    let op: "select" | "delete" | "update" = "select";
    let values: Row = {};
    let head = false;
    let columns = ["id"];
    let limit = Infinity;
    let range: [number, number] | null = null;
    const q = {
      select(cols: string, opts?: { head?: boolean }) {
        columns = cols.split(",").map((c) => c.trim());
        head = !!opts?.head;
        return q;
      },
      delete() {
        op = "delete";
        return q;
      },
      update(v: Row) {
        op = "update";
        values = v;
        return q;
      },
      lt(c: string, v: string) {
        filters.push((r) => r[c] != null && r[c]! < v);
        return q;
      },
      gt(c: string, v: string) {
        filters.push((r) => r[c] != null && r[c]! > v);
        return q;
      },
      gte(c: string, v: string) {
        filters.push((r) => r[c] != null && r[c]! >= v);
        return q;
      },
      not(c: string) {
        filters.push((r) => r[c] != null);
        return q;
      },
      in(c: string, vals: string[]) {
        inSizes.push(vals.length);
        filters.push((r) => vals.includes(r[c]!));
        return q;
      },
      or(expr: string) {
        if (expr.includes(".not.is.null")) {
          // "<a>.not.is.null,<b>.not.is.null,…" — any of them set
          const cols = expr.split(",").map((part) => part.split(".")[0]);
          filters.push((r) => cols.some((c) => r[c] != null));
          return q;
        }
        // "<col>.lt.<cut>,and(<col>.is.null,created_at.lt.<cut>)"
        const [, col, cut] = /^(\w+)\.lt\.([^,]+),/.exec(expr)!;
        filters.push((r) => (r[col] != null ? r[col]! < cut : r.created_at! < cut));
        return q;
      },
      order() {
        return q;
      },
      limit(n: number) {
        limit = n;
        return q;
      },
      range(a: number, b: number) {
        range = [a, b];
        return q;
      },
      then(resolve: (v: unknown) => void) {
        const rows = tables[table] ?? [];
        const hit = rows.filter((r) => filters.every((f) => f(r))).sort((a, b) => a.id!.localeCompare(b.id!));
        if (op === "delete") {
          tables[table] = rows.filter((r) => !hit.includes(r));
          return resolve({ count: hit.length, error: null });
        }
        if (op === "update") {
          hit.forEach((r) => Object.assign(r, values));
          return resolve({ count: hit.length, error: null });
        }
        if (head) return resolve({ count: hit.length, error: null });
        const sliced = (range ? hit.slice(range[0], range[1] + 1) : hit.slice(0, limit)).slice(0, MAX_ROWS);
        return resolve({ data: sliced.map((r) => Object.fromEntries(columns.map((c) => [c, r[c]]))), error: null });
      },
    };
    return q;
  };
  return { from: query };
}

const OLD = "2024-01-01T00:00:00.000Z"; // past both cutoffs
const MID = "2025-06-01T00:00:00.000Z"; // past the 13-month cutoff only
const NEW = "2026-10-01T00:00:00.000Z";
const NOW = new Date("2026-10-18T03:00:00.000Z");

function seed(): Record<string, Row[]> {
  return {
    aed_analytics_events: [{ id: "e1", created_at: MID }, { id: "e2", created_at: NEW }],
    aed_ad_visits: [{ id: "v1", created_at: OLD }],
    aed_conversion_log: [],
    aed_leads: [
      { id: "l1", created_at: OLD, gclid: "g1" },
      { id: "l2", created_at: MID, gclid: "g2", ip_hash: "h2", full_name: "kept" },
      { id: "l3", created_at: NEW, gclid: "g3" },
    ],
    aed_messages: [{ id: "m1", created_at: OLD }, { id: "m2", created_at: NEW }],
    aed_followups: [
      { id: "f1", created_at: OLD, conversation_id: "c2", customer_id: "u2" },
      { id: "f2", created_at: NEW, conversation_id: "c3", customer_id: null },
    ],
    aed_deals: [{ id: "d1", conversation_id: "c1", customer_id: "u1" }],
    aed_conversations: [
      { id: "c1", customer_id: "u1", last_message_at: OLD, created_at: OLD }, // has a deal
      { id: "c2", customer_id: null, last_message_at: OLD, created_at: OLD }, // only an old follow-up
      { id: "c3", customer_id: null, last_message_at: OLD, created_at: OLD }, // a recent follow-up
      { id: "c4", customer_id: "u3", last_message_at: NEW, created_at: OLD }, // still active
      { id: "c5", customer_id: null, last_message_at: null, created_at: OLD }, // web chat, never bumped
      { id: "c6", customer_id: "u5", last_message_at: OLD, created_at: OLD }, // idle LINE chat, no deal
    ],
    aed_customers: [
      { id: "u1", last_active_at: OLD, created_at: OLD }, // bought
      { id: "u2", last_active_at: OLD, created_at: OLD }, // gone quiet, nothing left
      { id: "u3", last_active_at: OLD, created_at: OLD }, // has an active conversation
      { id: "u4", last_active_at: NEW, created_at: OLD },
      { id: "u5", last_active_at: OLD, created_at: OLD }, // goes once c6 is gone
    ],
  };
}

const ids = (rows: Row[]) => rows.map((r) => r.id);

describe("retention cutoffs", () => {
  it("counts back whole months, clamped to the month's last day", () => {
    expect(monthsBefore(new Date("2026-03-31T10:00:00Z"), 1).toISOString()).toBe("2026-02-28T10:00:00.000Z");
    expect(monthsBefore(new Date("2026-10-18T00:00:00Z"), 13).toISOString()).toBe("2025-09-18T00:00:00.000Z");
    expect(monthsBefore(new Date("2028-02-29T00:00:00Z"), 24).toISOString()).toBe("2026-02-28T00:00:00.000Z");
  });

  it("marketing keeps 13 months, leads/chat 2 years", () => {
    expect(retentionCutoffs(NOW)).toEqual({
      marketing: "2025-09-18T03:00:00.000Z",
      leadChat: "2024-10-18T03:00:00.000Z",
    });
  });

  it("deletableIds drops anything still referenced", () => {
    expect(deletableIds(["a", "b", "c"], ["b", null], new Set(["c"]))).toEqual(["a"]);
  });
});

describe("runDataRetention", () => {
  it("deletes by age and keeps whatever a deal, follow-up or conversation still needs", async () => {
    const tables = seed();
    mocks.client = fakeDb(tables);
    const report = await runDataRetention(NOW);

    expect(ids(tables.aed_analytics_events)).toEqual(["e2"]);
    expect(ids(tables.aed_ad_visits)).toEqual([]);
    expect(ids(tables.aed_leads)).toEqual(["l2", "l3"]); // MID is inside the 2-year window
    // …but its ad-referral data is past the 13-month marketing window.
    expect(tables.aed_leads[0]).toMatchObject({ gclid: null, ip_hash: null, full_name: "kept" });
    expect(tables.aed_leads[1].gclid).toBe("g3");
    expect(ids(tables.aed_messages)).toEqual(["m2"]);
    expect(ids(tables.aed_followups)).toEqual(["f2"]);
    expect(ids(tables.aed_conversations)).toEqual(["c1", "c3", "c4"]);
    expect(ids(tables.aed_customers)).toEqual(["u1", "u3", "u4"]);
    expect(ids(tables.aed_deals)).toEqual(["d1"]);
    expect(report).toMatchObject({ aed_analytics_events: 1, aed_conversations: 3, aed_customers: 2 });
  });

  it("a dry run counts without deleting", async () => {
    const tables = seed();
    mocks.client = fakeDb(tables);
    const report = await runDataRetention(NOW, true);
    // Same numbers the real run deletes, though nothing has been removed yet.
    expect(report).toMatchObject({
      aed_analytics_events: 1,
      aed_leads: 1,
      aed_leads_attribution_cleared: 2, // l1 and l2 (l1 is then deleted outright)
      aed_messages: 1,
      aed_conversations: 3,
      aed_customers: 2,
    });
    expect(tables).toEqual(seed());
  });

  it("gets past any number of protected rows, interleaved, deleting in small chunks", async () => {
    const pad = (n: number) => String(n).padStart(6, "0");
    // 12,000 deal-linked idle conversations spread through the id order, with
    // a deletable one after every fourth — more than a page cap would reach.
    const n = 15_000;
    const tables: Record<string, Row[]> = {
      aed_deals: Array.from({ length: n }, (_, i) => i)
        .filter((i) => i % 5 !== 4)
        .map((i) => ({ id: `d${pad(i)}`, conversation_id: `c${pad(i)}`, customer_id: null })),
      aed_conversations: Array.from({ length: n }, (_, i) => ({
        id: `c${pad(i)}`,
        customer_id: null,
        last_message_at: OLD,
        created_at: OLD,
      })),
    };
    const inSizes: number[] = [];
    mocks.client = fakeDb(tables, inSizes);
    const report = await runDataRetention(NOW);
    expect(report.aed_conversations).toBe(3_000);
    expect(tables.aed_conversations).toHaveLength(12_000);
    expect(Math.max(...inSizes)).toBeLessThanOrEqual(100);
  });
});
