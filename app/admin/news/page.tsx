"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { JiaAedLogo } from "@/app/components/JiaAedLogo";

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

const TOKEN_STORAGE_KEY = "jiaaed_admin_token";

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export default function AdminNewsPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (saved) setToken(saved);
  }, []);

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/news", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error === "unauthorized" ? "Token ไม่ถูกต้อง" : "เกิดข้อผิดพลาด");
        setAuthed(false);
        return;
      }
      setAuthed(true);
      setNews(data.news);
      localStorage.setItem(TOKEN_STORAGE_KEY, t);
    } catch {
      setError("เชื่อมต่อไม่ได้");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) load(token.trim());
  };

  const toggleHidden = async (row: NewsRow) => {
    setBusyId(row.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/news", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, hidden: !row.hidden }),
      });
      if (res.ok) {
        setNews((prev) =>
          prev.map((n) => (n.id === row.id ? { ...n, hidden: !row.hidden } : n)),
        );
      } else {
        setError("อัปเดตไม่สำเร็จ");
      }
    } catch {
      setError("อัปเดตไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบข่าวนี้ถาวร?")) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/news?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setNews((prev) => prev.filter((n) => n.id !== id));
    else setError("ลบไม่สำเร็จ");
    setBusyId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthed(false);
    setToken("");
    setNews([]);
  };

  const visibleCount = news.filter((n) => !n.hidden).length;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <JiaAedLogo className="h-8 w-auto" />
            <span className="font-bold text-xl text-yellow-400">Admin</span>
          </Link>
          {authed && (
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-yellow-400">
              ออกจากระบบ
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">จัดการข่าวบนหน้าเว็บ</h1>
        <p className="text-sm text-gray-500 mb-6">
          ระบบดึงและเผยแพร่ข่าวที่เกี่ยวข้องอัตโนมัติทุกวัน — กด &quot;ซ่อน&quot; เพื่อนำข่าวออกจากหน้า{" "}
          <Link href="/news" className="text-yellow-400 hover:text-yellow-300">/news</Link>
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {!authed ? (
          <form onSubmit={handleLogin} className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md">
            <label className="block text-sm font-semibold mb-2">Admin Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="กรอก ADMIN_TOKEN"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white mb-4"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="bg-yellow-400 text-gray-950 font-bold px-5 py-2 rounded-full hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">
                ข่าวทั้งหมด {news.length} — แสดงอยู่ {visibleCount} / ซ่อน {news.length - visibleCount}
              </h2>
              <button onClick={() => load(token)} className="text-sm text-yellow-400 hover:text-yellow-300">
                รีเฟรช
              </button>
            </div>

            {loading && <p className="text-gray-500 text-sm">กำลังโหลด...</p>}
            {!loading && news.length === 0 && (
              <p className="text-gray-500 text-sm">ยังไม่มีข่าว — ระบบจะเติมให้อัตโนมัติเมื่อ cron รัน</p>
            )}

            <div className="space-y-3">
              {news.map((n) => (
                <div
                  key={n.id}
                  className={`bg-gray-900 border rounded-xl p-4 flex items-start justify-between gap-4 ${
                    n.hidden ? "border-gray-800 opacity-60" : "border-gray-800"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {n.topic && (
                        <span className="text-[10px] font-bold bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded">
                          {n.topic}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500">{fmtDate(n.published_at)}</span>
                      {n.hidden && (
                        <span className="text-[10px] font-bold bg-red-500/10 text-red-300 px-2 py-0.5 rounded">
                          ซ่อนอยู่
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-white mb-1">{n.our_blurb}</div>
                    <div className="text-xs text-gray-500 truncate">อ้างอิง: {n.source_title}</div>
                    <a
                      href={n.source_url}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="text-xs text-yellow-400 hover:text-yellow-300 break-all"
                    >
                      {n.source_name ?? n.source_url}
                    </a>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <button
                      onClick={() => toggleHidden(n)}
                      disabled={busyId === n.id}
                      className={`text-sm font-semibold px-3 py-1 rounded-full disabled:opacity-50 ${
                        n.hidden
                          ? "bg-yellow-400 text-gray-950 hover:bg-yellow-300"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {n.hidden ? "แสดง" : "ซ่อน"}
                    </button>
                    <button
                      onClick={() => handleDelete(n.id)}
                      disabled={busyId === n.id}
                      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
