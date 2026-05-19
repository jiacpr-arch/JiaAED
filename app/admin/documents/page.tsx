"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type DocRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  public_url: string;
  storage_path: string;
  mime: string;
  size_bytes: number;
  language: string;
  is_published: boolean;
  created_at: string;
};

const CATEGORIES = [
  { value: "manual", label: "คู่มือ" },
  { value: "specification", label: "สเปค/TOR" },
  { value: "certificate", label: "ใบรับรอง" },
  { value: "brochure", label: "โบรชัวร์" },
  { value: "other", label: "อื่นๆ" },
];

const TOKEN_STORAGE_KEY = "jiaaed_admin_token";

function fmtSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminDocsPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("manual");
  const [language, setLanguage] = useState("th");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (saved) {
      setToken(saved);
    }
  }, []);

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/documents", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error === "unauthorized" ? "Token ไม่ถูกต้อง" : "เกิดข้อผิดพลาด");
        setAuthed(false);
        return;
      }
      setAuthed(true);
      setDocs(data.documents);
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("category", category);
      fd.append("language", language);
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(`อัปโหลดล้มเหลว: ${data.error ?? "unknown"}${data.detail ? ` (${data.detail})` : ""}`);
        return;
      }
      setTitle("");
      setDescription("");
      setFile(null);
      const inp = document.getElementById("file-input") as HTMLInputElement | null;
      if (inp) inp.value = "";
      await load(token);
    } catch {
      setError("อัปโหลดล้มเหลว");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบเอกสารนี้?")) return;
    const res = await fetch(`/api/admin/documents?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) await load(token);
    else setError("ลบไม่สำเร็จ");
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthed(false);
    setToken("");
    setDocs([]);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">❤️</span>
            <span className="font-bold text-xl text-yellow-400">JiaAED Admin</span>
          </Link>
          {authed && (
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-yellow-400">
              ออกจากระบบ
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">จัดการเอกสารบนเว็บไซต์</h1>

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
            <p className="text-xs text-gray-500 mt-3">
              ตั้งค่า <code className="bg-gray-800 px-1 rounded">ADMIN_TOKEN</code> ใน environment variables ก่อนใช้งาน
            </p>
          </form>
        ) : (
          <>
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
              <h2 className="font-bold mb-4">อัปโหลดเอกสารใหม่</h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">ชื่อเอกสาร *</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">คำอธิบาย</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">หมวดหมู่</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">ภาษา</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                    >
                      <option value="th">ไทย</option>
                      <option value="en">English</option>
                      <option value="th-en">ไทย-English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">ไฟล์ * (PDF/DOCX/รูป, ≤25MB)</label>
                    <input
                      id="file-input"
                      type="file"
                      accept=".pdf,.docx,.doc,image/png,image/jpeg"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      required
                      className="w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-yellow-400/20 file:text-yellow-400"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={uploading || !file || !title.trim()}
                  className="bg-yellow-400 text-gray-950 font-bold px-5 py-2 rounded-full hover:bg-yellow-300 disabled:opacity-50"
                >
                  {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
                </button>
              </form>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">เอกสารที่อัปโหลด ({docs.length})</h2>
                <button onClick={() => load(token)} className="text-sm text-yellow-400 hover:text-yellow-300">
                  รีเฟรช
                </button>
              </div>
              {loading && <p className="text-gray-500 text-sm">กำลังโหลด...</p>}
              {!loading && docs.length === 0 && (
                <p className="text-gray-500 text-sm">ยังไม่มีเอกสารที่อัปโหลด — อัปโหลดด้านบนเพื่อเริ่มต้น</p>
              )}
              <div className="space-y-3">
                {docs.map((d) => (
                  <div key={d.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded">
                          {d.category}
                        </span>
                        <span className="text-[10px] text-gray-500">{fmtSize(d.size_bytes)}</span>
                        <span className="text-[10px] text-gray-500">{d.language}</span>
                      </div>
                      <div className="font-semibold truncate">{d.title}</div>
                      {d.description && <div className="text-sm text-gray-400 truncate">{d.description}</div>}
                      <a
                        href={d.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-yellow-400 hover:text-yellow-300 mt-1 inline-block break-all"
                      >
                        {d.public_url}
                      </a>
                    </div>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="shrink-0 text-sm text-red-400 hover:text-red-300"
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
