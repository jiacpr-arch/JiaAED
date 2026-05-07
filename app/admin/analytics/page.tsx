import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Analytics | JiaAED Admin" };

interface DailyPoint {
  date: string;
  count: number;
  revenue?: number;
}

async function getFunnel() {
  const db = createAdminClient();
  const [customers, conversations, quoted, won] = await Promise.all([
    db.from("aed_customers").select("id", { count: "exact", head: true }),
    db.from("aed_conversations").select("id", { count: "exact", head: true }),
    db
      .from("aed_deals")
      .select("id", { count: "exact", head: true })
      .in("stage", ["quoted", "negotiating", "won"]),
    db.from("aed_deals").select("id", { count: "exact", head: true }).eq("stage", "won"),
  ]);
  return {
    customers: customers.count ?? 0,
    conversations: conversations.count ?? 0,
    quoted: quoted.count ?? 0,
    won: won.count ?? 0,
  };
}

async function getDailyLeads(days = 30): Promise<DailyPoint[]> {
  const db = createAdminClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data } = await db
    .from("aed_conversations")
    .select("created_at")
    .gte("created_at", since);

  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    buckets.set(d, 0);
  }
  for (const row of data ?? []) {
    const d = (row as { created_at: string }).created_at.slice(0, 10);
    if (buckets.has(d)) buckets.set(d, (buckets.get(d) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

async function getDailyRevenue(days = 30): Promise<DailyPoint[]> {
  const db = createAdminClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data } = await db
    .from("aed_deals")
    .select("paid_at, total_amount")
    .eq("payment_status", "paid")
    .gte("paid_at", since);

  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    buckets.set(d, 0);
  }
  for (const row of data ?? []) {
    const r = row as { paid_at: string | null; total_amount: number | null };
    if (!r.paid_at) continue;
    const d = r.paid_at.slice(0, 10);
    if (buckets.has(d)) buckets.set(d, (buckets.get(d) ?? 0) + (r.total_amount ?? 0));
  }
  return [...buckets.entries()].map(([date, revenue]) => ({ date, count: 0, revenue }));
}

async function getTopProducts() {
  const db = createAdminClient();
  const { data } = await db
    .from("aed_deals")
    .select("product_id, quantity, total_amount, stage");

  const stats = new Map<string, { deals: number; won: number; revenue: number }>();
  for (const row of data ?? []) {
    const r = row as { product_id: string; quantity: number; total_amount: number | null; stage: string };
    const s = stats.get(r.product_id) ?? { deals: 0, won: 0, revenue: 0 };
    s.deals += 1;
    if (r.stage === "won") {
      s.won += 1;
      s.revenue += r.total_amount ?? 0;
    }
    stats.set(r.product_id, s);
  }
  return [...stats.entries()]
    .map(([product_id, s]) => ({ product_id, ...s }))
    .sort((a, b) => b.deals - a.deals);
}

function BarChart({ data, color, formatValue }: {
  data: DailyPoint[];
  color: string;
  formatValue: (n: number) => string;
}) {
  const values = data.map((d) => d.revenue ?? d.count);
  const max = Math.max(...values, 1);
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 h-32">
        {data.map((d, i) => {
          const v = d.revenue ?? d.count;
          const h = max > 0 ? (v / max) * 100 : 0;
          return (
            <div
              key={i}
              className="flex-1 relative group"
              style={{ height: "100%" }}
            >
              <div
                className={`absolute bottom-0 w-full ${color} rounded-t transition-all`}
                style={{ height: `${h}%`, minHeight: v > 0 ? "2px" : "0" }}
              />
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {d.date.slice(5)}: {formatValue(v)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-neutral-500">
        <span>{data[0]?.date.slice(5) ?? ""}</span>
        <span className="text-neutral-400">รวม: {formatValue(total)}</span>
        <span>{data[data.length - 1]?.date.slice(5) ?? ""}</span>
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const [funnel, leads, revenue, topProducts] = await Promise.all([
    getFunnel(),
    getDailyLeads(30),
    getDailyRevenue(30),
    getTopProducts(),
  ]);

  const conversionRate = funnel.conversations > 0
    ? ((funnel.won / funnel.conversations) * 100).toFixed(1)
    : "0.0";
  const quoteRate = funnel.conversations > 0
    ? ((funnel.quoted / funnel.conversations) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-neutral-100">Analytics</h1>

      {/* Funnel */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-200 mb-3">Conversion Funnel</h2>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
          {[
            { label: "ลูกค้าทั้งหมด", value: funnel.customers, color: "bg-blue-400", pct: 100 },
            {
              label: "เข้าแชท",
              value: funnel.conversations,
              color: "bg-cyan-400",
              pct: funnel.customers ? (funnel.conversations / funnel.customers) * 100 : 0,
            },
            {
              label: "เสนอราคา",
              value: funnel.quoted,
              color: "bg-yellow-400",
              pct: funnel.customers ? (funnel.quoted / funnel.customers) * 100 : 0,
            },
            {
              label: "ปิดการขาย",
              value: funnel.won,
              color: "bg-green-400",
              pct: funnel.customers ? (funnel.won / funnel.customers) * 100 : 0,
            },
          ].map((step) => (
            <div key={step.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-300">{step.label}</span>
                <span className="text-neutral-100 font-semibold">{step.value}</span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${step.color} transition-all`}
                  style={{ width: `${Math.min(step.pct, 100)}%` }}
                />
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-neutral-800 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-400">Quote rate</p>
              <p className="text-2xl font-bold text-yellow-400">{quoteRate}%</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Win rate</p>
              <p className="text-2xl font-bold text-green-400">{conversionRate}%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-lg font-semibold text-neutral-200 mb-3">Lead รายวัน (30 วัน)</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <BarChart
              data={leads}
              color="bg-cyan-400"
              formatValue={(n) => `${n}`}
            />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-200 mb-3">รายได้รายวัน (30 วัน)</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <BarChart
              data={revenue}
              color="bg-green-400"
              formatValue={(n) => `${n.toLocaleString("th-TH")} ฿`}
            />
          </div>
        </section>
      </div>

      {/* Top products */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-200 mb-3">สินค้ายอดนิยม</h2>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                <th className="px-4 py-3 font-medium">สินค้า</th>
                <th className="px-4 py-3 font-medium">Deals ทั้งหมด</th>
                <th className="px-4 py-3 font-medium">ปิดการขาย</th>
                <th className="px-4 py-3 font-medium">Win rate</th>
                <th className="px-4 py-3 font-medium">รายได้</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                    ยังไม่มีข้อมูล
                  </td>
                </tr>
              )}
              {topProducts.map((p) => (
                <tr
                  key={p.product_id}
                  className="border-b border-neutral-800 last:border-0 hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-neutral-100 font-medium">{p.product_id}</td>
                  <td className="px-4 py-3 text-neutral-300">{p.deals}</td>
                  <td className="px-4 py-3 text-green-400">{p.won}</td>
                  <td className="px-4 py-3 text-neutral-300">
                    {p.deals > 0 ? ((p.won / p.deals) * 100).toFixed(1) + "%" : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-100">
                    {p.revenue > 0 ? p.revenue.toLocaleString("th-TH") + " ฿" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
