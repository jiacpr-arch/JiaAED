"use client";

// /admin/billing — create a card-payment link for a signed rental / rent-to-own
// contract and see every customer on monthly card billing.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { JiaAedLogo } from "@/app/components/JiaAedLogo";
import { MAX_RENTAL_UNITS, findRentalPlan, quoteSummary, rentalBillingPlans } from "@/lib/aed/rental-billing";
import { LOGIN_ERRORS, adminLogin, adminLogout, forgetLegacyToken } from "../admin-session";

type Row = {
  id: number;
  plan_id: string;
  units: number;
  status: "active" | "past_due" | "completed" | "canceled";
  months_total: number | null;
  installments_paid: number;
  monthly_total_thb: number | null;
  customer_name: string | null;
  company_name: string | null;
  contract_ref: string | null;
  ends_at: string | null;
  created_at: string;
};

const STATUS_TH: Record<Row["status"], { label: string; cls: string }> = {
  active: { label: "ตัดบัตรปกติ", cls: "text-green-400" },
  past_due: { label: "ค้างชำระ", cls: "text-red-400" },
  completed: { label: "ครบแล้ว", cls: "text-gray-400" },
  canceled: { label: "ยกเลิก", cls: "text-gray-500" },
};

const EMPTY = { planId: rentalBillingPlans[0].id as string, units: "1", customerName: "", companyName: "", email: "", phone: "", contractRef: "" };

const ERRORS: Record<string, string> = {
  stripe_not_configured: "ยังไม่ได้ตั้ง STRIPE_SECRET_KEY ใน Vercel",
  name_required: "ใส่ชื่อลูกค้าหรือชื่อบริษัท",
  bad_email: "อีเมลไม่ถูกต้อง",
  bad_units: `จำนวนเครื่อง 1–${MAX_RENTAL_UNITS}`,
};

export default function AdminBillingPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [stripeReady, setStripeReady] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [creating, setCreating] = useState(false);
  const [link, setLink] = useState<{ url: string; summary: string; expiresAt: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rental-billing");
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (res.status !== 401) setError("โหลดรายการไม่สำเร็จ (รัน supabase/aed_rental_billing.sql แล้วหรือยัง?)");
        setAuthed(res.status !== 401);
        return;
      }
      setAuthed(true);
      setRows(data.rows);
      setStripeReady(data.stripeReady);
    } catch {
      setError("เชื่อมต่อไม่ได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    forgetLegacyToken();
    load();
  }, [load]);

  const plan = findRentalPlan(form.planId)!;
  const units = Math.min(Math.max(Number(form.units) || 1, 1), MAX_RENTAL_UNITS);
  const preview = useMemo(() => quoteSummary(plan, units), [plan, units]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    const result = await adminLogin(token.trim());
    if (result !== "ok") return setError(LOGIN_ERRORS[result]);
    setToken("");
    setError(null);
    await load();
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setLink(null);
    setCopied(false);
    try {
      const res = await fetch("/api/admin/rental-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, units }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) return setError(ERRORS[data.error] ?? `สร้างลิงก์ไม่สำเร็จ: ${data.message ?? data.error}`);
      setLink({ url: data.url, summary: data.summary, expiresAt: data.expiresAt });
    } catch {
      setError("สร้างลิงก์ไม่สำเร็จ");
    } finally {
      setCreating(false);
    }
  };

  const lineMessage = link
    ? `ลิงก์ผูกบัตรสำหรับ${plan.label}${form.contractRef ? ` (สัญญา ${form.contractRef})` : ""}\n${link.summary}\n${link.url}\n(ลิงก์ใช้ได้ถึง ${new Date(link.expiresAt * 1000).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })})`
    : "";

  const input = "w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm";

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <JiaAedLogo className="h-8 w-auto" />
            <span className="font-bold text-xl text-yellow-400">Admin</span>
          </Link>
          {authed && (
            <button onClick={() => adminLogout().then(() => setAuthed(false))} className="text-sm text-gray-400 hover:text-yellow-400">
              ออกจากระบบ
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">ตัดบัตรรายเดือน — ลูกค้าเช่า / เช่าซื้อ</h1>
        <p className="text-sm text-gray-400 mb-6">
          ใช้หลังเซ็นสัญญาแล้วเท่านั้น · สร้างลิงก์ → ส่งให้ลูกค้าทาง LINE → ลูกค้าจ่ายงวดแรกด้วยบัตร แล้วระบบตัดบัตรทุกเดือนเอง (แจ้งผลทาง LINE แอดมินทุกงวด)
        </p>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

        {!authed ? (
          <form onSubmit={handleLogin} className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md">
            <label className="block text-sm font-semibold mb-2">Admin Token</label>
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="กรอก ADMIN_TOKEN" className={input} />
            <button type="submit" disabled={loading} className="mt-4 bg-yellow-400 text-gray-950 font-bold px-5 py-2 rounded-lg">
              เข้าสู่ระบบ
            </button>
          </form>
        ) : (
          <>
            {!stripeReady && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 px-4 py-3 rounded-lg mb-6 text-sm">
                ยังไม่ได้ตั้ง STRIPE_SECRET_KEY — สร้างลิงก์ไม่ได้จนกว่าจะตั้งค่าใน Vercel
              </div>
            )}

            <form onSubmit={create} className="bg-gray-900 border border-gray-800 rounded-xl p-6 grid gap-4 sm:grid-cols-2 mb-6">
              <label className="sm:col-span-2 text-sm">
                แผน
                <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })} className={`${input} mt-1`}>
                  {rentalBillingPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                จำนวนเครื่อง
                <input type="number" min={1} max={MAX_RENTAL_UNITS} value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} className={`${input} mt-1`} />
              </label>
              <label className="text-sm">
                เลขที่สัญญา
                <input value={form.contractRef} onChange={(e) => setForm({ ...form, contractRef: e.target.value })} className={`${input} mt-1`} />
              </label>
              <label className="text-sm">
                ชื่อบริษัท
                <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className={`${input} mt-1`} />
              </label>
              <label className="text-sm">
                ชื่อผู้ติดต่อ
                <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className={`${input} mt-1`} />
              </label>
              <label className="text-sm">
                อีเมลลูกค้า (รับใบเสร็จ Stripe)
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`${input} mt-1`} />
              </label>
              <label className="text-sm">
                เบอร์โทร
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`${input} mt-1`} />
              </label>
              <p className="sm:col-span-2 text-sm text-yellow-300">{preview}</p>
              <div className="sm:col-span-2">
                <button type="submit" disabled={creating || !stripeReady} className="bg-yellow-400 text-gray-950 font-bold px-5 py-2 rounded-lg disabled:opacity-50">
                  {creating ? "กำลังสร้าง…" : "สร้างลิงก์ผูกบัตร"}
                </button>
              </div>
            </form>

            {link && (
              <div className="bg-gray-900 border border-green-500/40 rounded-xl p-6 mb-8">
                <div className="text-sm font-semibold text-green-300 mb-2">ลิงก์พร้อมส่ง (ใช้ได้ภายใน 23 ชม.)</div>
                <textarea readOnly value={lineMessage} rows={5} className={`${input} font-mono text-xs`} />
                <button
                  onClick={() => navigator.clipboard.writeText(lineMessage).then(() => setCopied(true))}
                  className="mt-3 bg-[#06C755] text-white font-semibold px-4 py-2 rounded-lg text-sm"
                >
                  {copied ? "คัดลอกแล้ว ✓" : "คัดลอกข้อความส่ง LINE"}
                </button>
              </div>
            )}

            <h2 className="text-lg font-bold mb-3">ลูกค้าที่ตัดบัตรรายเดือน ({rows.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="py-2 pr-3">ลูกค้า</th>
                    <th className="py-2 pr-3">แผน</th>
                    <th className="py-2 pr-3">งวด</th>
                    <th className="py-2 pr-3">ต่อเดือน</th>
                    <th className="py-2">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-gray-800">
                      <td className="py-2 pr-3">
                        {r.company_name || r.customer_name || "—"}
                        {r.contract_ref && <div className="text-xs text-gray-500">สัญญา {r.contract_ref}</div>}
                      </td>
                      <td className="py-2 pr-3">
                        {findRentalPlan(r.plan_id)?.label ?? r.plan_id}
                        {r.units > 1 && ` × ${r.units}`}
                      </td>
                      <td className="py-2 pr-3">
                        {r.installments_paid}
                        {r.months_total ? `/${r.months_total}` : ""}
                      </td>
                      <td className="py-2 pr-3">{r.monthly_total_thb != null ? `฿${Number(r.monthly_total_thb).toLocaleString("en-US")}` : "—"}</td>
                      <td className={`py-2 ${STATUS_TH[r.status]?.cls ?? ""}`}>{STATUS_TH[r.status]?.label ?? r.status}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500">
                        ยังไม่มีลูกค้าตัดบัตรรายเดือน
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              ยกเลิก / เปลี่ยนบัตร / คืนเงินประกัน ทำใน Stripe Dashboard → Subscriptions (เงินประกัน FLEX คืนด้วยการ Refund บรรทัดเงินประกันในใบแจ้งหนี้แรก)
            </p>
          </>
        )}
      </div>
    </div>
  );
}
