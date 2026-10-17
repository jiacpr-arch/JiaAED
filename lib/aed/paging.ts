// PostgREST (Supabase) caps every response at `max-rows` — 1,000 by default —
// and truncates silently, so "select all events in the last 30 days" quietly
// becomes "the first 1,000". Reports that count rows must page through.

export const PAGE_SIZE = 1000;

type PageResult = PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;

/**
 * Collect every row from a range-able query. `page(from, to)` must apply
 * `.range(from, to)` to a query with a stable order (e.g. `.order("id")`).
 * Stops at `maxRows` as a safety valve against runaway reads.
 */
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PageResult,
  maxRows = 100_000,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < maxRows; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return out;
}
