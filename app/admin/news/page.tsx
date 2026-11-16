"use client";

// /admin/news — news the daily cron publishes on /news. One button per item:
// ซ่อน / แสดง. Delete is tucked away since hiding is almost always enough.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell, Card, Empty, Notice, Pill, Tabs, useAdmin } from "../ui";

type NewsRow = {
  id: string;
  source_title: string;
  source_url: string;
  source_name: string | null;
  topic: string | null;
  our_blurb: string;
  published_at: string | null;
  hidden: boolean;
  created_at: string;
};

type Filter = "shown" | "hidden" | "all";

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", year: "numeric", month: "short", day: "numeric" }).format(d);
}

export default function AdminNewsPage() {
  return (
    <AdminShell
      title="ข่าวบนหน้าเว็บ"
      subtitle={
        <>
          ระบบดึงข่าวมาลงอัตโนมัติทุกวัน — เจอข่าวไม่เหมาะ กด “ซ่อน” ได้เลย ·{" "}
          <Link href="/news" target="_blank" className="text-yellow-400 hover:text-yellow-300 underline">
            ดูหน้า /news
          </Link>
        </>
      }
    >
      <News />
    </AdminShell>
  );
}

function News() {
  const { expire } = useAdmin();
  const [news, setNews] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("shown");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/news");
      if (res.status === 401) return expire();
      const data = await res.json();
      if (!res.ok || !data.ok) return setError("โหลดรายการไม่สำเร็จ");
      setNews(data.news);
    } catch {
      setError("เชื่อมต่อไม่ได้");
    } finally {
      setLoading(false);
    }
  }, [expire]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleHidden = async (row: NewsRow) => {
    setBusyId(row.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/news", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, hidden: !row.hidden }),
      });
      if (res.ok) setNews((prev) => prev.map((n) => (n.id === row.id ? { ...n, hidden: !row.hidden } : n)));
      else setError("อัปเดตไม่สำเร็จ");
    } catch {
      setError("อัปเดตไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบข่าวนี้ถาวร? (ถ้าแค่ไม่อยากให้แสดง ใช้ “ซ่อน” แทนได้)")) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/news?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) setNews((prev) => prev.filter((n) => n.id !== id));
    else setError("ลบไม่สำเร็จ");
    setBusyId(null);
  };

  const visibleCount = news.filter((n) => !n.hidden).length;
  const shown = news.filter((n) => (filter === "all" ? true : filter === "hidden" ? n.hidden : !n.hidden));

  return (
    <>
      {error && (
        <div className="mb-4">
          <Notice kind="error" onClose={() => setError(null)}>
            {error}
          </Notice>
        </div>
      )}
      <Tabs<Filter>
        value={filter}
        onChange={setFilter}
        items={[
          { id: "shown", label: `👁️ แสดงอยู่ (${visibleCount})` },
          { id: "hidden", label: `🙈 ซ่อนอยู่ (${news.length - visibleCount})` },
          { id: "all", label: `ทั้งหมด (${news.length})` },
        ]}
      />

      {loading && <p className="text-gray-500 text-sm">กำลังโหลด…</p>}
      {!loading && shown.length === 0 && <Empty>{news.length === 0 ? "ยังไม่มีข่าว — ระบบจะเติมให้อัตโนมัติ" : "ไม่มีข่าวในหมวดนี้"}</Empty>}

      <div className="space-y-3">
        {shown.map((n) => (
          <Card key={n.id} className={`!p-4 ${n.hidden ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {n.topic && <Pill tone="yellow">{n.topic}</Pill>}
                  <span className="text-xs text-gray-500">{fmtDate(n.published_at)}</span>
                  {n.hidden && <Pill tone="red">ซ่อนอยู่</Pill>}
                </div>
                <div className="text-sm text-white mb-1">{n.our_blurb}</div>
                <a href={n.source_url} target="_blank" rel="nofollow noopener noreferrer" className="text-xs text-gray-500 hover:text-yellow-300 break-all">
                  อ้างอิง: {n.source_name ?? n.source_title} ↗
                </a>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-2">
                <button
                  onClick={() => toggleHidden(n)}
                  disabled={busyId === n.id}
                  className={`text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-50 ${
                    n.hidden ? "bg-yellow-400 text-gray-950 hover:bg-yellow-300" : "bg-gray-800 text-gray-200 hover:bg-gray-700"
                  }`}
                >
                  {n.hidden ? "👁️ แสดง" : "🙈 ซ่อน"}
                </button>
                <button onClick={() => handleDelete(n.id)} disabled={busyId === n.id} className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 px-2">
                  ลบ
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
