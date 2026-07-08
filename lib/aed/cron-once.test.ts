import { describe, it, expect, vi } from "vitest";
import { claimDailyCronRun, bkkDateLabel, type ClaimClient } from "./cron-once";

// The claim gate is what stops a re-delivered Vercel Cron tick (delivery is
// at-least-once) from re-sending the whole daily digest to the owner's LINE.
// A wrong verdict here means either duplicate spam (false → should be skip) or
// a silently dropped report (true → should have sent), so pin the exact mapping
// from Supabase insert result to "should this invocation proceed?".

function clientReturning(error: { code?: string } | null): {
  client: ClaimClient;
  rows: Record<string, unknown>[];
} {
  const rows: Record<string, unknown>[] = [];
  const client: ClaimClient = {
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        rows.push(row);
        return Promise.resolve({ error });
      },
    }),
  };
  return { client, rows };
}

describe("claimDailyCronRun", () => {
  it("wins the claim when the marker row inserts cleanly", async () => {
    const { client, rows } = clientReturning(null);
    const won = await claimDailyCronRun("daily", { date: "2026-07-07", client });
    expect(won).toBe(true);
    expect(rows).toEqual([
      { digest_date: "2026-07-07", kind: "daily", payload: { status: "claimed" } },
    ]);
  });

  it("loses the claim on a unique-violation (23505) — the day was already taken", async () => {
    const { client } = clientReturning({ code: "23505" });
    const won = await claimDailyCronRun("daily", { date: "2026-07-07", client });
    expect(won).toBe(false);
  });

  it("fails open on an unexpected DB error rather than dropping the report", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientReturning({ code: "08006" }); // connection failure
    const won = await claimDailyCronRun("weekly_ai", { date: "2026-07-07", client });
    expect(won).toBe(true);
    spy.mockRestore();
  });

  it("fails open when the insert throws", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const client: ClaimClient = {
      from: () => ({
        insert: () => Promise.reject(new Error("network down")),
      }),
    };
    const won = await claimDailyCronRun("ads_round2", { date: "2026-07-07", client });
    expect(won).toBe(true);
    spy.mockRestore();
  });

  it("defaults the bucket to the current Bangkok day", async () => {
    const { client, rows } = clientReturning(null);
    await claimDailyCronRun("auto_optimize", { client });
    expect(rows[0].digest_date).toBe(bkkDateLabel());
  });
});
