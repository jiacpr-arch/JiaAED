"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { JiaAedLogo } from "@/app/components/JiaAedLogo";
import { UNIT_STATUSES, UNIT_PLAN_TYPES, type AedUnit } from "@/lib/aed/units";
import { checkUnitExpiries } from "@/lib/aed/unit-expiry";

const TOKEN_STORAGE_KEY = "jiaaed_admin_token";

const EMPTY_FORM = {
  serial_number: "",
  status: UNIT_STATUSES[0] as string,
  customer_name: "",
  plan_type: "",
  start_date: "",
  end_date: "",
  rent_amount: "",
  deposit_amount: "",
  pad_expiry_date: "",
  battery_expiry_date: "",
  next_inspection_date: "",
  notes: "",
};

type FormState = typeof EMPTY_FORM;

export default function AdminUnitsPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [units, setUnits] = useState<AedUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (saved) setToken(saved);
  }, []);

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/units", { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error === "unauthorized" ? "Token ไม่ถูกต้อง" : "เกิดข้อผิดพลาด");
        setAuthed(false);
        return;
      }
      setAuthed(true);
      setUnits(data.units);
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

  const startEdit = (u: AedUnit) => {
    setEditingId(u.id);
    setForm({
      serial_number: u.serial_number,
      status: u.status,
      customer_name: u.customer_name ?? "",
      plan_type: u.plan_type ?? "",
      start_date: u.start_date ?? "",
      end_date: u.end_date ?? "",
      rent_amount: u.rent_amount?.toString() ?? "",
      deposit_amount: u.deposit_amount?.toString() ?? "",
      pad_expiry_date: u.pad_expiry_date ?? "",
      battery_expiry_date: u.battery_expiry_date ?? "",
      next_inspection_date: u.next_inspection_date ?? "",
      notes: u.notes ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serial_number.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const method = editingId ? "PATCH" : "POST";
      const body = editingId ? { id: editingId, ...form } : form;
      const res = await fetch("/api/admin/units", {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(
          data.error === "duplicate_serial_number"
            ? "มีเลขซีเรียลนี้อยู่แล้ว"
            : `บันทึกล้มเหลว: ${data.error ?? "unknown"}`,
        );
        return;
      }
      cancelEdit();
      await load(token);
    } catch {
      setError("บันทึกล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบเครื่องนี้ออกจากทะเบียน?")) return;
    const res = await fetch(`/api/admin/units?id=${encodeURIComponent(id)}`, {
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
    setUnits([]);
  };

  // Client-side reuse of the same pure logic the weekly cron runs, so the
  // list highlights exactly what would trigger a LINE alert — no separate
  // "is this urgent" rule to keep in sync.
  const expiryBySerial = new Map<string, { urgent: boolean; label: string }>();
  for (const status of checkUnitExpiries(units, new Date())) {
    const existing = expiryBySerial.get(status.serialNumber);
    if (!existing || (status.urgent && !existing.urgent)) {
      expiryBySerial.set(status.serialNumber, {
        urgent: status.urgent,
        label: status.daysLeft < 0 ? "หมดอายุแล้ว" : `เหลือ ${status.daysLeft} วัน`,
      });
    }
  }

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
        <h1 className="text-2xl font-bold mb-6">ทะเบียนเครื่อง AED (แผ่น/แบตลูกค้า)</h1>

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
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
              <h2 className="font-bold mb-4">{editingId ? "แก้ไขเครื่อง" : "เพิ่มเครื่องใหม่"}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">เลขซีเรียล *</label>
                    <input
                      value={form.serial_number}
                      onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">สถานะ</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                    >
                      {UNIT_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">ลูกค้า</label>
                    <input
                      value={form.customer_name}
                      onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">ประเภทแผน</label>
                    <select
                      value={form.plan_type}
                      onChange={(e) => setForm({ ...form, plan_type: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                    >
                      <option value="">—</option>
                      {UNIT_PLAN_TYPES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">วันเริ่ม</label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">วันสิ้นสุด</label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">ค่าเช่า (บาท)</label>
                    <input
                      type="number"
                      value={form.rent_amount}
                      onChange={(e) => setForm({ ...form, rent_amount: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">มัดจำ (บาท)</label>
                    <input
                      type="number"
                      value={form.deposit_amount}
                      onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-yellow-400">วันหมดอายุแผ่น</label>
                    <input
                      type="date"
                      value={form.pad_expiry_date}
                      onChange={(e) => setForm({ ...form, pad_expiry_date: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-yellow-400">วันหมดอายุแบต</label>
                    <input
                      type="date"
                      value={form.battery_expiry_date}
                      onChange={(e) => setForm({ ...form, battery_expiry_date: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">เช็กสภาพครั้งถัดไป</label>
                    <input
                      type="date"
                      value={form.next_inspection_date}
                      onChange={(e) => setForm({ ...form, next_inspection_date: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">หมายเหตุ</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving || !form.serial_number.trim()}
                    className="bg-yellow-400 text-gray-950 font-bold px-5 py-2 rounded-full hover:bg-yellow-300 disabled:opacity-50"
                  >
                    {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "เพิ่มเครื่อง"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-sm text-gray-400 hover:text-white"
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">เครื่องในทะเบียน ({units.length})</h2>
                <button onClick={() => load(token)} className="text-sm text-yellow-400 hover:text-yellow-300">
                  รีเฟรช
                </button>
              </div>
              {loading && <p className="text-gray-500 text-sm">กำลังโหลด...</p>}
              {!loading && units.length === 0 && (
                <p className="text-gray-500 text-sm">ยังไม่มีเครื่องในทะเบียน — เพิ่มด้านบนเพื่อเริ่มต้น</p>
              )}
              <div className="space-y-3">
                {units.map((u) => {
                  const expiry = expiryBySerial.get(u.serial_number);
                  return (
                    <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-bold bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded">
                            {u.status}
                          </span>
                          {expiry && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                expiry.urgent ? "bg-red-500/20 text-red-300" : "bg-gray-800 text-gray-400"
                              }`}
                            >
                              {expiry.label}
                            </span>
                          )}
                        </div>
                        <div className="font-semibold truncate">
                          {u.serial_number}
                          {u.customer_name && <span className="text-gray-400 font-normal"> · {u.customer_name}</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex gap-3 flex-wrap">
                          {u.plan_type && <span>แผน: {u.plan_type}</span>}
                          {u.pad_expiry_date && <span>แผ่นหมด: {u.pad_expiry_date}</span>}
                          {u.battery_expiry_date && <span>แบตหมด: {u.battery_expiry_date}</span>}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col gap-2 items-end">
                        <button onClick={() => startEdit(u)} className="text-sm text-yellow-400 hover:text-yellow-300">
                          แก้ไข
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="text-sm text-red-400 hover:text-red-300">
                          ลบ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
