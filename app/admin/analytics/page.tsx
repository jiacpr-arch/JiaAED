"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, Notice, useAdmin } from "../ui";

type DashboardData = {
  range: { days: number; from: string; to: string };
  kpis: {
    visitors: number;
    visitors_prev: number;
    visitors_change_pct: number;
    line_clicks: number;
    line_ctr: number;
    leads: number;
    conversion_rate: number;
    docs_downloaded: number;
    price_views: number;
    form_starts: number;
    form_submits: number;
    form_abandons: number;
  };
  funnel: {
    visits: number;
    price_views: number;
    form_starts: number;
    form_submits: number;
  };
  daily_series: Array<{ date: string; visitors: number; line_clicks: number; leads: number; form_submits: number }>;
  top_pages: Array<{ path: string; n: number }>;
  top_referrers: Array<{ host: string; n: number }>;
  top_docs: Array<{ doc_id: string; n: number }>;
  top_line_locations: Array<{ location: string; n: number }>;
  recent_leads: Array<{
    id: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
    product_id: string | null;
    from_ads: boolean;
    created_at: string;
  }>;
  recent_alerts: Array<{ date: string; kind: string; alerts: string[] }>;
};

const RANGES = [
  { d: 1, label: "วันนี้" },
  { d: 7, label: "7 วัน" },
  { d: 30, label: "30 วัน" },
  { d: 90, label: "90 วัน" },
];

export default function AdminAnalyticsPage() {
  return (
    <AdminShell title="สถิติเว็บ" subtitle="คนเข้าเว็บ กด LINE และส่งฟอร์มกี่คน" wide>
      <Analytics />
    </AdminShell>
  );
}

function Analytics() {
  const { expire } = useAdmin();
  const [days, setDays] = useState(7);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (currentDays: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/analytics?days=${currentDays}`);
        if (res.status === 401) return expire();
        setData((await res.json()) as DashboardData);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    },
    [expire],
  );

  useEffect(() => {
    void load(7);
  }, [load]);

  function changeRange(d: number) {
    setDays(d);
    void load(d);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-400 mr-1">ช่วงเวลา:</span>
        {RANGES.map((r) => (
          <button
            key={r.d}
            onClick={() => changeRange(r.d)}
            className={`text-sm px-4 py-2 rounded-xl transition-colors ${
              days === r.d ? "bg-yellow-400 text-gray-950 font-bold" : "bg-gray-900 border border-gray-800 text-gray-300 hover:text-white"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

        {loading && <p className="text-gray-500">กำลังโหลด…</p>}
        {error && <Notice kind="error">{error}</Notice>}

        {data && (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="👥 คนเข้าเว็บ" value={data.kpis.visitors.toLocaleString()} change={data.kpis.visitors_change_pct} />
              <Kpi label="💬 กดปุ่ม LINE" value={data.kpis.line_clicks.toLocaleString()} suffix={` (${data.kpis.line_ctr}%)`} />
              <Kpi label="🎯 ส่งข้อมูลติดต่อ (Lead)" value={data.kpis.leads.toLocaleString()} suffix={` (${data.kpis.conversion_rate}%)`} />
              <Kpi label="📄 ดาวน์โหลดเอกสาร" value={data.kpis.docs_downloaded.toLocaleString()} />
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3">📈 รายวัน</h2>
              <DailyChart series={data.daily_series} />
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3">🔻 Funnel</h2>
              <Funnel data={data.funnel} />
            </section>

            <div className="grid md:grid-cols-2 gap-6">
              <TopList title="หน้าที่คนเข้าเยอะ" items={data.top_pages.map((p) => ({ label: p.path, n: p.n }))} />
              <TopList title="คนมาจากไหน (referrer)" items={data.top_referrers.map((r) => ({ label: r.host, n: r.n }))} emptyText="ส่วนใหญ่ direct / hidden" />
              <TopList title="ปุ่ม LINE ตำแหน่งไหนคนกด" items={data.top_line_locations.map((l) => ({ label: l.location, n: l.n }))} />
              <TopList title="เอกสารที่ถูกโหลด" items={data.top_docs.map((d) => ({ label: d.doc_id, n: d.n }))} emptyText="ยังไม่มี download" />
            </div>

            {data.recent_alerts.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-3">🚨 Alerts ล่าสุด</h2>
                <div className="space-y-2">
                  {data.recent_alerts.map((a, i) => (
                    <div key={i} className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4">
                      <div className="text-xs text-gray-500 mb-1">{a.date} · {a.kind}</div>
                      <ul className="text-sm text-yellow-200 space-y-1">
                        {a.alerts.map((line, j) => <li key={j}>{line}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-lg font-bold mb-3">🎯 Leads ล่าสุด ({data.recent_leads.length})</h2>
              {data.recent_leads.length === 0 ? (
                <p className="text-gray-500 text-sm">ยังไม่มี lead ในช่วงเวลานี้</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-gray-500 border-b border-gray-800">
                      <tr>
                        <th className="py-2 pr-3">เวลา</th>
                        <th className="pr-3">ชื่อ</th>
                        <th className="pr-3">โทร</th>
                        <th className="pr-3">Email</th>
                        <th className="pr-3">รุ่น</th>
                        <th className="pr-3">ที่มา</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_leads.map((l) => (
                        <tr key={l.id} className="border-b border-gray-900">
                          <td className="py-2 pr-3 text-gray-400 whitespace-nowrap">{new Date(l.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</td>
                          <td className="pr-3">{l.full_name ?? "-"}</td>
                          <td className="pr-3">{l.phone ? <a className="text-yellow-400 hover:underline" href={`tel:${l.phone}`}>{l.phone}</a> : "-"}</td>
                          <td className="pr-3">{l.email ? <a className="text-yellow-400 hover:underline" href={`mailto:${l.email}`}>{l.email}</a> : "-"}</td>
                          <td className="pr-3">{l.product_id ?? "-"}</td>
                          <td className="pr-3 text-xs">{l.from_ads ? <span className="bg-green-400/10 text-green-400 px-2 py-0.5 rounded">Ads</span> : <span className="text-gray-500">organic</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
    </div>
  );
}

function Kpi({ label, value, suffix, change }: { label: string; value: string; suffix?: string; change?: number }) {
  const trend = change === undefined ? null : change >= 0 ? "▲" : "▼";
  const trendColor = change === undefined ? "" : change >= 0 ? "text-green-400" : "text-red-400";
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}<span className="text-sm text-gray-400 font-normal">{suffix}</span></div>
      {trend && <div className={`text-xs mt-1 ${trendColor}`}>{trend} {change}% เทียบช่วงก่อน</div>}
    </div>
  );
}

function DailyChart({ series }: { series: DashboardData["daily_series"] }) {
  const maxVisitors = Math.max(1, ...series.map((s) => s.visitors));
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-end gap-1 h-32">
        {series.map((s) => {
          const h = Math.max(2, (s.visitors / maxVisitors) * 100);
          return (
            <div key={s.date} className="flex-1 flex flex-col items-center justify-end gap-1" title={`${s.date}: ${s.visitors} visitors`}>
              <div className="w-full bg-yellow-400/70 hover:bg-yellow-400 rounded-t" style={{ height: `${h}%` }} />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 mt-2">
        <span>{series[0]?.date.slice(5)}</span>
        <span>{series[series.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

function Funnel({ data }: { data: DashboardData["funnel"] }) {
  const stages = [
    { label: "👥 Visits", n: data.visits, color: "bg-gray-700" },
    { label: "👁️  เห็นราคา", n: data.price_views, color: "bg-blue-500/70" },
    { label: "📝 เริ่มกรอกฟอร์ม", n: data.form_starts, color: "bg-purple-500/70" },
    { label: "✅ ส่งฟอร์มสำเร็จ", n: data.form_submits, color: "bg-green-500/70" },
  ];
  const max = Math.max(1, ...stages.map((s) => s.n));
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 space-y-2">
      {stages.map((s, i) => {
        const w = (s.n / max) * 100;
        const prevN = i > 0 ? stages[i - 1].n : 0;
        const dropPct = i > 0 && prevN > 0 ? Math.round(((prevN - s.n) / prevN) * 100) : 0;
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>{s.label}</span>
              <span className="text-gray-400">{s.n.toLocaleString()} {i > 0 && prevN > 0 && <span className="text-xs text-red-400 ml-2">(-{dropPct}%)</span>}</span>
            </div>
            <div className="h-7 bg-gray-950 rounded overflow-hidden">
              <div className={`h-full ${s.color} rounded`} style={{ width: `${w}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TopList({ title, items, emptyText }: { title: string; items: Array<{ label: string; n: number }>; emptyText?: string }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
      <h3 className="font-bold mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText ?? "ไม่มีข้อมูล"}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-300 truncate mr-3">{it.label}</span>
              <span className="text-yellow-400 font-semibold shrink-0">{it.n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
