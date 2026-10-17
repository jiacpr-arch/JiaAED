import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  client: null as unknown,
  pushTextsToOwner: vi.fn<(texts: string[]) => Promise<boolean>>(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => mocks.client }));
vi.mock("@/lib/aed/notify-owner", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./notify-owner")>()),
  pushTextsToOwner: mocks.pushTextsToOwner,
}));

import { flushNotifyQueue, groupMessages, packRows } from "./notify-queue";
import { chunkForLine, LINE_TEXT_LIMIT } from "./notify-owner";

type Row = { id: number; text: string; created_at: string; sent: boolean; sent_at: string | null };

// Minimal stand-in for the PostgREST builder calls flushNotifyQueue makes.
function fakeQueue(rows: Row[]) {
  const releases: number[][] = [];
  const client = {
    from() {
      const q = { update: null as Partial<Row> | null, ids: null as number[] | null, sent: undefined as boolean | undefined };
      const run = () => {
        if (!q.update) return { data: rows.filter((r) => !r.sent).map(({ id, text, created_at }) => ({ id, text, created_at })), error: null };
        const hit = rows.filter((r) => q.ids!.includes(r.id) && (q.sent === undefined || r.sent === q.sent));
        hit.forEach((r) => Object.assign(r, q.update));
        if (q.update.sent === false) releases.push([...q.ids!]);
        return { data: hit.map((r) => ({ id: r.id })), error: null };
      };
      const b = {
        select: () => b,
        order: () => b,
        eq: (col: string, val: boolean) => {
          if (col === "sent") q.sent = val;
          return b;
        },
        in: (_col: string, ids: number[]) => {
          q.ids = ids;
          return b;
        },
        update: (patch: Partial<Row>) => {
          q.update = patch;
          return b;
        },
        then: (resolve: (v: unknown) => void) => resolve(run()),
      };
      return b;
    },
  };
  return { client, releases };
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const row = (id: number, chars: number, created_at = minutesAgo(20)): Row => ({
  id,
  text: `${id}`.repeat(chars),
  created_at,
  sent: false,
  sent_at: null,
});

describe("packRows", () => {
  const r = (id: number, n: number) => ({ id, text: "x".repeat(n) });

  it("keeps rows whole and in order, filling each message up to the limit", () => {
    expect(packRows([r(1, 40), r(2, 40), r(3, 40)], 100).map((g) => g.map((x) => x.id))).toEqual([[1, 2], [3]]);
  });

  it("counts the separator between rows", () => {
    // 45 + separator + 45 > 100 even though 45 + 45 fits.
    expect(packRows([r(1, 45), r(2, 45)], 100).map((g) => g.map((x) => x.id))).toEqual([[1], [2]]);
  });

  it("keeps a group that joins to exactly the limit together", () => {
    const sep = "\n\n━━━━━━━━━━\n\n".length;
    const n = (100 - sep) / 2;
    expect(packRows([r(1, n), r(2, n)], 100)).toHaveLength(1);
  });

  it("gives an oversized row a group of its own", () => {
    expect(packRows([r(1, 10), r(2, 500), r(3, 10)], 100).map((g) => g.map((x) => x.id))).toEqual([[1], [2], [3]]);
  });
});

describe("flushNotifyQueue", () => {
  beforeEach(() => mocks.pushTextsToOwner.mockReset());

  it("sends every fresh group and drops rows older than 24h without sending them", async () => {
    const rows = [row(1, 3000), row(2, 3000), row(9, 10, minutesAgo(25 * 60))];
    const q = fakeQueue(rows);
    mocks.client = q.client;
    mocks.pushTextsToOwner.mockResolvedValue(true);

    const res = await flushNotifyQueue();

    expect(res).toMatchObject({ flushed: true, count: 2 });
    expect(mocks.pushTextsToOwner).toHaveBeenCalledTimes(2);
    expect(mocks.pushTextsToOwner.mock.calls.flat(2).join("")).not.toContain("9");
    expect(rows.every((r) => r.sent)).toBe(true);
    expect(q.releases).toEqual([]);
  });

  it("on a failure part-way, hands back only the groups that were not delivered", async () => {
    const rows = [row(1, 3000), row(2, 3000), row(3, 3000), row(9, 10, minutesAgo(25 * 60))];
    const q = fakeQueue(rows);
    mocks.client = q.client;
    mocks.pushTextsToOwner.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await expect(flushNotifyQueue()).rejects.toThrow(/kept for retry/);

    expect(q.releases).toEqual([[2, 3]]);
    expect(rows.find((r) => r.id === 1)!.sent).toBe(true);
    expect(rows.find((r) => r.id === 2)!.sent).toBe(false);
    expect(rows.find((r) => r.id === 9)!.sent).toBe(true); // stale: dropped, not retried
  });
});

describe("groupMessages / chunkForLine", () => {
  it("doesn't spend a whole message on a header before one long list", () => {
    const report = "📋 header\n\n" + Array.from({ length: 300 }, (_, i) => `unit ${i} pad 2027-01-01`).join("\n");
    const chunks = chunkForLine(report);
    expect(chunks[0].length).toBeGreaterThan(LINE_TEXT_LIMIT / 2);
    expect(chunks.every((c) => c.length <= LINE_TEXT_LIMIT)).toBe(true);
  });

  it("caps a group at one push request (5 messages) and says what was cut", () => {
    const huge = Array.from({ length: 2000 }, (_, i) => `line ${i} ${"x".repeat(40)}`).join("\n");
    const msgs = groupMessages(huge);
    expect(msgs).toHaveLength(5);
    expect(msgs[4]).toMatch(/ตัดส่วนที่เหลือ/);
    expect(msgs.every((m) => m.length <= LINE_TEXT_LIMIT)).toBe(true);
  });
});
