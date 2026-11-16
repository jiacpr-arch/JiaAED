"use client";

// /admin/billing — card payments for rental customers:
//   1. monthly card billing link for a signed rental / rent-to-own contract
//   2. FLEX renter keeps the machine → buy / rent-to-own with deposit credited
//   3. event rental secured by a card hold (capture rent on return)

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { JiaAedLogo } from "@/app/components/JiaAedLogo";
import { thbExact } from "@/lib/aed/checkout";
import { MAX_RENTAL_UNITS, findRentalPlan, quoteSummary, rentalBillingPlans } from "@/lib/aed/rental-billing";
import { conversionSummary, conversionTargets, depositOf, findConversionTarget } from "@/lib/aed/rental-conversion";
import {
  HOLD_MAX_RETURN_DAYS,
  MAX_HOLD_UNITS,
  captureAmount,
  findHoldPackage,
  holdPackages,
  holdSummary,
  type HoldRow,
} from "@/lib/aed/rental-holds";
import { LOGIN_ERRORS, adminLogin, adminLogout, forgetLegacyToken } from "../admin-session";

type Row = {
  id: number;
  stripe_subscription_id: string;
  plan_id: string;
  units: number;
  status: "active" | "past_due" | "completed" | "canceled" | "converted";
  months_total: number | null;
  installments_paid: number;
  monthly_total_thb: number | null;
  customer_name: string | null;
  company_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  contract_ref: string | null;
};

const STATUS_TH: Record<Row["status"], { label: string; cls: string }> = {
  active: { label: "ตัดบัตรปกติ", cls: "text-green-400" },
  past_due: { label: "ค้างชำระ", cls: "text-red-400" },
  completed: { label: "ครบแล้ว", cls: "text-gray-400" },
  canceled: { label: "ยกเลิก", cls: "text-gray-500" },
  converted: { label: "เปลี่ยนเป็นซื้อแล้ว", cls: "text-blue-300" },
};

const HOLD_STATUS_TH: Record<HoldRow["status"], { label: string; cls: string }> = {
  authorized: { label: "กันวงเงินอยู่", cls: "text-yellow-300" },
  captured: { label: "เก็บค่าเช่าแล้ว", cls: "text-green-400" },
  released: { label: "ปล่อยวงเงิน (ไม่เก็บเงิน)", cls: "text-gray-400" },
  expired: { label: "หมดอายุ — ยังไม่ได้เก็บ!", cls: "text-red-400" },
};

const ERRORS: Record<string, string> = {
  stripe_not_configured: "ยังไม่ได้ตั้ง STRIPE_SECRET_KEY ใน Vercel",
  name_required: "ใส่ชื่อลูกค้าหรือชื่อบริษัท",
  bad_email: "อีเมลไม่ถูกต้อง",
  bad_units: "จำนวนเครื่องไม่ถูกต้อง",
  bad_deposit_credit: "เงินประกันที่หักต้องไม่เกินที่ลูกค้าวางไว้",
  bad_rent_credit: "เครดิตค่าเช่าไม่ถูกต้อง",
  source_not_active: "สัญญาเช่าเดิมไม่ได้อยู่ในสถานะตัดบัตร",
  return_too_late: `กันวงเงินได้เฉพาะเช่าที่คืนเครื่องภายใน ${HOLD_MAX_RETURN_DAYS} วันจากวันนี้ — นานกว่านี้ใช้มัดจำเงินสด`,
  hold_not_open: "รายการนี้ปิดไปแล้ว",
};

type Tab = "subscribe" | "convert" | "hold";
const INFO = { customerName: "", companyName: "", email: "", phone: "", contractRef: "" };

const input = "w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm mt-1";
const bkk = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function AdminBillingPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [holds, setHolds] = useState<(HoldRow & { payment_intent_id: string })[]>([]);
  const [stripeReady, setStripeReady] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("subscribe");

  const [info, setInfo] = useState(INFO);
  const [units, setUnits] = useState("1");
  const [planId, setPlanId] = useState<string>(rentalBillingPlans[0].id);
  const [targetId, setTargetId] = useState<string>(conversionTargets[0].id);
  const [sourceId, setSourceId] = useState("");
  const [depositCredit, setDepositCredit] = useState("0");
  const [rentCredit, setRentCredit] = useState("0");
  const [packageId, setPackageId] = useState<string>(holdPackages[0].id);
  const [days, setDays] = useState("1");
  const [returnDate, setReturnDate] = useState("");
  const [eventName, setEventName] = useState("");

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
      setHolds(data.holds);
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

  const n = Math.max(1, Number(units) || 1);
  const source = rows.find((r) => r.stripe_subscription_id === sourceId) ?? null;
  const maxDeposit = source ? depositOf(source) : 0;
  const flexRows = rows.filter((r) => findRentalPlan(r.plan_id)?.kind === "flex" && ["active", "past_due"].includes(r.status));

  const preview = useMemo(() => {
    if (tab === "subscribe") return quoteSummary(findRentalPlan(planId)!, Math.min(n, MAX_RENTAL_UNITS));
    if (tab === "convert") return conversionSummary(findConversionTarget(targetId)!, n, (Number(depositCredit) || 0) + (Number(rentCredit) || 0));
    const pkg = findHoldPackage(packageId)!;
    return holdSummary(pkg, pkg.days.includes(Number(days)) ? Number(days) : pkg.days[0], Math.min(n, MAX_HOLD_UNITS));
  }, [tab, planId, targetId, depositCredit, rentCredit, packageId, days, n]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    const result = await adminLogin(token.trim());
    if (result !== "ok") return setError(LOGIN_ERRORS[result]);
    setToken("");
    setError(null);
    await load();
  };

  const post = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/admin/rental-billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(ERRORS[data.error] ?? `ไม่สำเร็จ: ${data.message ?? data.error}`);
    return data;
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setNotice(null);
    setLink(null);
    setCopied(false);
    try {
      const base = { ...info, units: n };
      const body =
        tab === "subscribe"
          ? { action: "subscribe", planId, ...base }
          : tab === "convert"
            ? { action: "convert", targetId, sourceSubscriptionId: sourceId, depositCredit: Number(depositCredit) || 0, rentCredit: Number(rentCredit) || 0, ...base }
            : { action: "hold", packageId, days: Number(days), returnDate, eventName, ...base };
      const data = await post(body);
      setLink({ url: data.url, summary: data.summary, expiresAt: data.expiresAt });
    } catch (err) {
      setError(err instanceof Error ? err.message : "สร้างลิงก์ไม่สำเร็จ");
    } finally {
      setCreating(false);
    }
  };

  const startConvert = (r: Row) => {
    setTab("convert");
    setSourceId(r.stripe_subscription_id);
    setDepositCredit(String(depositOf(r)));
    setRentCredit("0");
    setUnits(String(r.units));
    setInfo({
      customerName: r.customer_name ?? "",
      companyName: r.company_name ?? "",
      email: r.customer_email ?? "",
      phone: r.customer_phone ?? "",
      contractRef: r.contract_ref ?? "",
    });
    setLink(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const settleHold = async (h: HoldRow, action: "capture" | "release") => {
    let damage = 0;
    if (action === "capture") {
      const raw = prompt(
        `เก็บค่าเช่า ${thbExact(Number(h.rent_thb))}\nมีค่าเสียหายเพิ่มไหม? ใส่จำนวนเงิน (บาท) หรือ 0 ถ้าคืนครบสภาพ\nเก็บได้สูงสุด ${thbExact(Number(h.authorized_thb))}`,
        "0",
      );
      if (raw === null) return;
      damage = Number(raw);
      if (!Number.isFinite(damage) || damage < 0) return setError("ค่าเสียหายไม่ถูกต้อง");
      const total = captureAmount({ rentGross: Number(h.rent_thb), authorizeTotal: Number(h.authorized_thb) }, damage);
      if (!confirm(`ตัดเงินจากบัตร ${thbExact(total)} แล้วปล่อยวงเงินที่เหลือ ${thbExact(Number(h.authorized_thb) - total)} คืนลูกค้า?`)) return;
    } else if (!confirm("ยกเลิกการเช่าและปล่อยวงเงินทั้งหมด โดยไม่เก็บค่าเช่า?")) {
      return;
    }
    setError(null);
    try {
      const data = await post({ action, holdId: h.id, damage });
      setNotice(action === "capture" ? `เก็บเงิน ${thbExact(data.captured)} แล้ว · ปล่อยวงเงิน ${thbExact(data.released)}` : "ปล่อยวงเงินแล้ว");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สำเร็จ");
    }
  };

  const lineMessage = link ? `${link.summary}\n${link.url}\n(ลิงก์ใช้ได้ถึง ${new Date(link.expiresAt * 1000).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })})` : "";
  const field = (key: keyof typeof INFO, label: string, type = "text") => (
    <label className="text-sm">
      {label}
      <input type={type} value={info[key]} onChange={(e) => setInfo({ ...info, [key]: e.target.value })} className={input} />
    </label>
  );
  const tabBtn = (t: Tab, label: string) => (
    <button
      type="button"
      onClick={() => {
        setTab(t);
        setLink(null);
      }}
      className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === t ? "bg-yellow-400 text-gray-950" : "bg-gray-900 text-gray-300 border border-gray-800"}`}
    >
      {label}
    </button>
  );

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
        <h1 className="text-2xl font-bold mb-2">ชำระเงินด้วยบัตร — ลูกค้าเช่า</h1>
        <p className="text-sm text-gray-400 mb-6">ใช้หลังตกลง/เซ็นสัญญาแล้ว · สร้างลิงก์ → คัดลอกส่ง LINE · ผลการชำระแจ้งทาง LINE แอดมิน</p>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
        {notice && <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg mb-6 text-sm">{notice}</div>}

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

            <div className="flex flex-wrap gap-2 mb-4">
              {tabBtn("subscribe", "ตัดบัตรรายเดือน")}
              {tabBtn("convert", "เปลี่ยนเช่า → ซื้อ (หักมัดจำ)")}
              {tabBtn("hold", "กันวงเงินเช่าอีเวนต์")}
            </div>

            <form onSubmit={create} className="bg-gray-900 border border-gray-800 rounded-xl p-6 grid gap-4 sm:grid-cols-2 mb-6">
              {tab === "subscribe" && (
                <label className="sm:col-span-2 text-sm">
                  แผน
                  <select value={planId} onChange={(e) => setPlanId(e.target.value)} className={input}>
                    {rentalBillingPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {tab === "convert" && (
                <>
                  <label className="sm:col-span-2 text-sm">
                    ลูกค้าเช่า FLEX ที่จะเปลี่ยน (หยุดตัดค่าเช่าเดิมให้อัตโนมัติเมื่อลูกค้าจ่าย)
                    <select
                      value={sourceId}
                      onChange={(e) => {
                        const r = rows.find((x) => x.stripe_subscription_id === e.target.value);
                        if (r) startConvert(r);
                        else {
                          setSourceId("");
                          setDepositCredit("0");
                        }
                      }}
                      className={input}
                    >
                      <option value="">— ไม่มี (ลูกค้าเช่าแบบอื่น / ใส่เครดิตค่าเช่าอย่างเดียว) —</option>
                      {flexRows.map((r) => (
                        <option key={r.id} value={r.stripe_subscription_id}>
                          {r.company_name || r.customer_name} · {findRentalPlan(r.plan_id)?.label} · จ่ายแล้ว {r.installments_paid} เดือน
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="sm:col-span-2 text-sm">
                    เปลี่ยนเป็น
                    <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className={input}>
                      {conversionTargets.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    หักเงินประกัน (สูงสุด {thbExact(maxDeposit)})
                    <input type="number" min={0} max={maxDeposit} value={depositCredit} onChange={(e) => setDepositCredit(e.target.value)} className={input} disabled={!source} />
                  </label>
                  <label className="text-sm">
                    หักค่าเช่าที่จ่ายแล้ว (โปร — ใส่ 0 ถ้าไม่ให้)
                    <input type="number" min={0} value={rentCredit} onChange={(e) => setRentCredit(e.target.value)} className={input} />
                  </label>
                </>
              )}

              {tab === "hold" && (
                <>
                  <label className="text-sm">
                    แพ็กเกจ
                    <select
                      value={packageId}
                      onChange={(e) => {
                        setPackageId(e.target.value);
                        setDays(String(findHoldPackage(e.target.value)!.days[0]));
                      }}
                      className={input}
                    >
                      {holdPackages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    จำนวนวัน
                    <select value={days} onChange={(e) => setDays(e.target.value)} className={input}>
                      {findHoldPackage(packageId)!.days.map((d) => (
                        <option key={d} value={d}>
                          {d} วัน
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    วันคืนเครื่อง (ภายใน {HOLD_MAX_RETURN_DAYS} วัน)
                    <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={input} required />
                  </label>
                  <label className="text-sm">
                    ชื่องาน / อีเวนต์
                    <input value={eventName} onChange={(e) => setEventName(e.target.value)} className={input} />
                  </label>
                </>
              )}

              <label className="text-sm">
                จำนวนเครื่อง
                <input type="number" min={1} max={tab === "hold" ? MAX_HOLD_UNITS : MAX_RENTAL_UNITS} value={units} onChange={(e) => setUnits(e.target.value)} className={input} />
              </label>
              {field("contractRef", "เลขที่สัญญา / ใบเสนอราคา")}
              {field("companyName", "ชื่อบริษัท")}
              {field("customerName", "ชื่อผู้ติดต่อ")}
              {field("email", "อีเมลลูกค้า (รับใบเสร็จ Stripe)", "email")}
              {field("phone", "เบอร์โทร")}

              <p className="sm:col-span-2 text-sm text-yellow-300">{preview}</p>
              <div className="sm:col-span-2">
                <button type="submit" disabled={creating || !stripeReady} className="bg-yellow-400 text-gray-950 font-bold px-5 py-2 rounded-lg disabled:opacity-50">
                  {creating ? "กำลังสร้าง…" : tab === "hold" ? "สร้างลิงก์กันวงเงิน" : "สร้างลิงก์ชำระเงิน"}
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

            <h2 className="text-lg font-bold mb-3">กันวงเงินเช่าอีเวนต์ ({holds.filter((h) => h.status === "authorized").length} รายการเปิดอยู่)</h2>
            <div className="overflow-x-auto mb-10">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="py-2 pr-3">ลูกค้า / งาน</th>
                    <th className="py-2 pr-3">คืนเครื่อง</th>
                    <th className="py-2 pr-3">ค่าเช่า / กันไว้</th>
                    <th className="py-2 pr-3">หมดอายุ</th>
                    <th className="py-2">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {holds.map((h) => (
                    <tr key={h.id} className="border-t border-gray-800 align-top">
                      <td className="py-2 pr-3">
                        {h.company_name || h.customer_name || "—"}
                        {h.event_name && <div className="text-xs text-gray-500">{h.event_name}</div>}
                      </td>
                      <td className="py-2 pr-3">{h.return_date ?? "—"}</td>
                      <td className="py-2 pr-3">
                        {thbExact(Number(h.rent_thb))} / {thbExact(Number(h.authorized_thb))}
                        {h.captured_thb != null && h.status === "captured" && <div className="text-xs text-gray-500">เก็บ {thbExact(Number(h.captured_thb))}</div>}
                      </td>
                      <td className="py-2 pr-3">{h.status === "authorized" ? bkk(h.capture_before) : "—"}</td>
                      <td className="py-2">
                        <span className={HOLD_STATUS_TH[h.status]?.cls}>{HOLD_STATUS_TH[h.status]?.label ?? h.status}</span>
                        {h.status === "authorized" && (
                          <div className="flex gap-2 mt-1">
                            <button onClick={() => settleHold(h, "capture")} className="text-xs bg-green-500 text-gray-950 font-semibold px-2 py-1 rounded">
                              เก็บค่าเช่า
                            </button>
                            <button onClick={() => settleHold(h, "release")} className="text-xs border border-gray-600 px-2 py-1 rounded">
                              ยกเลิก
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {holds.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500">
                        ยังไม่มีรายการกันวงเงิน
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

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
                    <tr key={r.id} className="border-t border-gray-800 align-top">
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
                      <td className="py-2 pr-3">{r.monthly_total_thb != null ? thbExact(Number(r.monthly_total_thb)) : "—"}</td>
                      <td className="py-2">
                        <span className={STATUS_TH[r.status]?.cls}>{STATUS_TH[r.status]?.label ?? r.status}</span>
                        {findRentalPlan(r.plan_id)?.kind === "flex" && ["active", "past_due"].includes(r.status) && (
                          <div>
                            <button onClick={() => startConvert(r)} className="text-xs text-yellow-300 underline mt-1">
                              เปลี่ยนเป็นซื้อ (หักมัดจำ)
                            </button>
                          </div>
                        )}
                      </td>
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
              ยกเลิกการเช่า / เปลี่ยนบัตร / คืนเงินประกัน FLEX (Refund เฉพาะยอดเงินประกันในใบแจ้งหนี้แรก) ทำใน Stripe Dashboard · ใบกำกับภาษีออกจาก FlowAccount
            </p>
          </>
        )}
      </div>
    </div>
  );
}
