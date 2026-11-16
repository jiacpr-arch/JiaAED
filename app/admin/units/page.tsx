"use client";

// /admin/units — AED unit registry (customer pads / batteries). The list comes
// first with a search box and an "ใกล้หมดอายุ" filter; adding or editing a
// unit is a 3-step form: เครื่อง & ลูกค้า → แผ่น/แบต → สัญญาเช่า.

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UNIT_STATUSES, UNIT_PLAN_TYPES, type AedUnit } from "@/lib/aed/units";
import { checkUnitExpiries } from "@/lib/aed/unit-expiry";
import { AdminShell, Card, Empty, Field, Notice, Pill, StepNav, Steps, Tabs, btnPrimary, btnSmall, inputCls, useAdmin } from "../ui";

const EMPTY_FORM = {
  serial_number: "",
  status: UNIT_STATUSES[0] as string,
  customer_name: "",
  product_model: "",
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
type Filter = "all" | "urgent" | (typeof UNIT_STATUSES)[number];
const FORM_STEPS = ["เครื่อง & ลูกค้า", "แผ่น / แบต", "สัญญาเช่า"];

export default function AdminUnitsPage() {
  return (
    <AdminShell title="ทะเบียนเครื่อง AED" subtitle="แผ่น / แบตของลูกค้า — ระบบเตือนทาง LINE ก่อนหมดอายุ">
      <Suspense fallback={null}>
        <Units />
      </Suspense>
    </AdminShell>
  );
}

function Units() {
  const { expire } = useAdmin();
  const params = useSearchParams();
  const [units, setUnits] = useState<AedUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>(params.get("filter") === "urgent" ? "urgent" : "all");
  const [q, setQ] = useState("");
  // null = list view; otherwise the form is open (id null = new unit).
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/units");
      if (res.status === 401) return expire();
      const data = await res.json();
      if (!res.ok || !data.ok) return setError("โหลดรายการไม่สำเร็จ");
      setUnits(data.units);
    } catch {
      setError("เชื่อมต่อไม่ได้");
    } finally {
      setLoading(false);
    }
  }, [expire]);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side reuse of the same pure logic the weekly cron runs, so the
  // list highlights exactly what would trigger a LINE alert. Keyed by unit id
  // since serial numbers are optional and can repeat/be null.
  const expiryByUnitId = useMemo(() => {
    const map = new Map<string, { urgent: boolean; label: string; daysLeft: number }>();
    for (const u of units) {
      for (const s of checkUnitExpiries([u], new Date())) {
        const existing = map.get(u.id);
        if (!existing || s.daysLeft < existing.daysLeft) {
          const what = s.kind === "pad" ? "แผ่น" : "แบต";
          map.set(u.id, {
            urgent: s.urgent,
            daysLeft: s.daysLeft,
            label: s.daysLeft < 0 ? `${what}หมดอายุแล้ว` : `${what}เหลือ ${s.daysLeft} วัน`,
          });
        }
      }
    }
    return map;
  }, [units]);

  const urgentCount = units.filter((u) => expiryByUnitId.get(u.id)?.urgent).length;
  const knownProductModels = [...new Set(units.map((u) => u.product_model).filter(Boolean))].sort() as string[];

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = units.filter((u) => {
      if (filter === "urgent" && !expiryByUnitId.get(u.id)?.urgent) return false;
      if (filter !== "all" && filter !== "urgent" && u.status !== filter) return false;
      if (!needle) return true;
      return [u.serial_number, u.customer_name, u.product_model, u.notes].some((v) => v?.toLowerCase().includes(needle));
    });
    if (filter === "urgent") list.sort((a, b) => (expiryByUnitId.get(a.id)?.daysLeft ?? 0) - (expiryByUnitId.get(b.id)?.daysLeft ?? 0));
    return list;
  }, [units, filter, q, expiryByUnitId]);

  const startEdit = (u: AedUnit) =>
    setEditing({
      id: u.id,
      form: {
        serial_number: u.serial_number ?? "",
        status: u.status,
        customer_name: u.customer_name ?? "",
        product_model: u.product_model ?? "",
        plan_type: u.plan_type ?? "",
        start_date: u.start_date ?? "",
        end_date: u.end_date ?? "",
        rent_amount: u.rent_amount?.toString() ?? "",
        deposit_amount: u.deposit_amount?.toString() ?? "",
        pad_expiry_date: u.pad_expiry_date ?? "",
        battery_expiry_date: u.battery_expiry_date ?? "",
        next_inspection_date: u.next_inspection_date ?? "",
        notes: u.notes ?? "",
      },
    });

  const handleDelete = async (u: AedUnit) => {
    if (!confirm(`ลบ "${u.serial_number || u.customer_name || "เครื่องนี้"}" ออกจากทะเบียน?`)) return;
    const res = await fetch(`/api/admin/units?id=${encodeURIComponent(u.id)}`, { method: "DELETE" });
    if (res.ok) {
      setNotice("ลบแล้ว");
      await load();
    } else setError("ลบไม่สำเร็จ");
  };

  if (editing) {
    return (
      <UnitForm
        id={editing.id}
        initial={editing.form}
        models={knownProductModels}
        onCancel={() => setEditing(null)}
        onSaved={async (msg) => {
          setEditing(null);
          setNotice(msg);
          await load();
        }}
      />
    );
  }

  return (
    <>
      <button onClick={() => setEditing({ id: null, form: EMPTY_FORM })} className={`${btnPrimary} w-full sm:w-auto mb-6 text-lg`}>
        ＋ เพิ่มเครื่องใหม่
      </button>
      {error && (
        <div className="mb-4">
          <Notice kind="error" onClose={() => setError(null)}>
            {error}
          </Notice>
        </div>
      )}
      {notice && (
        <div className="mb-4">
          <Notice kind="ok" onClose={() => setNotice(null)}>
            {notice}
          </Notice>
        </div>
      )}

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 ค้นหา ชื่อลูกค้า / เลขซีเรียล / รุ่น" className={`${inputCls} mb-4`} />
      <Tabs<Filter>
        value={filter}
        onChange={setFilter}
        items={[
          { id: "all", label: `ทั้งหมด (${units.length})` },
          { id: "urgent", label: `⚠️ ใกล้หมดอายุ (${urgentCount})` },
          ...UNIT_STATUSES.map((s) => ({ id: s as Filter, label: `${s} (${units.filter((u) => u.status === s).length})` })),
        ]}
      />

      {loading && <p className="text-gray-500 text-sm">กำลังโหลด…</p>}
      {!loading && shown.length === 0 && (
        <Empty>{units.length === 0 ? "ยังไม่มีเครื่องในทะเบียน — กด “＋ เพิ่มเครื่อง” เพื่อเริ่ม" : "ไม่พบเครื่องที่ตรงกับเงื่อนไข"}</Empty>
      )}
      <div className="space-y-3">
        {shown.map((u) => {
          const expiry = expiryByUnitId.get(u.id);
          return (
            <Card key={u.id} className={`!p-4 ${expiry?.urgent ? "!border-red-500/50" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Pill tone="yellow">{u.status}</Pill>
                    {expiry && <Pill tone={expiry.urgent ? "red" : "gray"}>{expiry.label}</Pill>}
                  </div>
                  <div className="font-bold truncate">
                    {u.customer_name || u.serial_number || "(ไม่ระบุ)"}
                    {u.serial_number && u.customer_name && <span className="text-gray-400 font-normal"> · {u.serial_number}</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex gap-3 flex-wrap">
                    {u.product_model && <span>สินค้า: {u.product_model}</span>}
                    {u.plan_type && <span>แผน: {u.plan_type}</span>}
                    {u.pad_expiry_date && <span>แผ่นหมด: {u.pad_expiry_date}</span>}
                    {u.battery_expiry_date && <span>แบตหมด: {u.battery_expiry_date}</span>}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col gap-2 items-end">
                  <button onClick={() => startEdit(u)} className={btnSmall}>
                    ✏️ แก้ไข
                  </button>
                  <button onClick={() => handleDelete(u)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1">
                    ลบ
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function UnitForm({
  id,
  initial,
  models,
  onCancel,
  onSaved,
}: {
  id: string | null;
  initial: FormState;
  models: string[];
  onCancel: () => void;
  onSaved: (msg: string) => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof FormState) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  // Serial number is optional (see supabase/aed_units.sql) — customer name
  // is the minimum needed to make a row meaningful.
  const canSave = Boolean(form.serial_number.trim() || form.customer_name.trim());

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/units", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id, ...form } : form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) return setError(`บันทึกไม่สำเร็จ: ${data.error ?? "unknown"}`);
      onSaved(id ? "บันทึกการแก้ไขแล้ว" : "เพิ่มเครื่องแล้ว");
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const last = step === FORM_STEPS.length - 1;
  const chip = (active: boolean) =>
    `px-4 py-2.5 rounded-xl text-sm font-semibold border-2 ${active ? "border-yellow-400 bg-yellow-400 text-gray-950" : "border-gray-700 hover:border-gray-500"}`;

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="text-xl font-bold">{id ? "✏️ แก้ไขเครื่อง" : "＋ เพิ่มเครื่องใหม่"}</h2>
        <button onClick={onCancel} className="text-sm text-gray-400 hover:text-white">
          ยกเลิก ✕
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-5">กรอกทีละขั้น — ช่องที่ยังไม่รู้ข้ามไปก่อนได้</p>
      <Steps steps={FORM_STEPS} current={step} />
      {error && (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      )}

      {step === 0 && (
        <div className="grid gap-5">
          <Field label="ชื่อลูกค้า">
            <input value={form.customer_name} onChange={set("customer_name")} className={inputCls} autoFocus />
          </Field>
          <Field label="เลขซีเรียล (ถ้ามี)">
            <input value={form.serial_number} onChange={set("serial_number")} className={inputCls} />
          </Field>
          <div>
            <p className="text-sm font-semibold mb-2">สถานะเครื่อง</p>
            <div className="flex flex-wrap gap-2">
              {UNIT_STATUSES.map((s) => (
                <button key={s} type="button" onClick={() => setForm({ ...form, status: s })} className={chip(form.status === s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <Field label="สินค้า (รุ่นแผ่น/แบต)" hint="พิมพ์แล้วเลือกจากที่เคยใช้ เพื่อให้สะกดตรงกัน">
            <input value={form.product_model} onChange={set("product_model")} list="product-models" placeholder="เช่น pad zoll, batt a15" className={inputCls} />
            <datalist id="product-models">
              {models.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-5">
          <Notice kind="info">ใส่วันหมดอายุเพื่อให้ระบบเตือนทาง LINE ก่อนหมด (ใช้ปี ค.ศ.)</Notice>
          <Field label="🩹 วันหมดอายุแผ่นอิเล็กโทรด">
            <input type="date" value={form.pad_expiry_date} onChange={set("pad_expiry_date")} className={inputCls} />
          </Field>
          <Field label="🔋 วันหมดอายุแบตเตอรี่">
            <input type="date" value={form.battery_expiry_date} onChange={set("battery_expiry_date")} className={inputCls} />
          </Field>
          <Field label="🔧 เช็กสภาพครั้งถัดไป">
            <input type="date" value={form.next_inspection_date} onChange={set("next_inspection_date")} className={inputCls} />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-5">
          <div>
            <p className="text-sm font-semibold mb-2">ประเภทแผน</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setForm({ ...form, plan_type: "" })} className={chip(form.plan_type === "")}>
                ไม่ระบุ
              </button>
              {UNIT_PLAN_TYPES.map((p) => (
                <button key={p} type="button" onClick={() => setForm({ ...form, plan_type: p })} className={chip(form.plan_type === p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="วันเริ่ม">
              <input type="date" value={form.start_date} onChange={set("start_date")} className={inputCls} />
            </Field>
            <Field label="วันสิ้นสุด">
              <input type="date" value={form.end_date} onChange={set("end_date")} className={inputCls} />
            </Field>
            <Field label="ค่าเช่า (บาท)">
              <input type="number" value={form.rent_amount} onChange={set("rent_amount")} className={inputCls} />
            </Field>
            <Field label="มัดจำ (บาท)">
              <input type="number" value={form.deposit_amount} onChange={set("deposit_amount")} className={inputCls} />
            </Field>
          </div>
          <Field label="หมายเหตุ">
            <textarea value={form.notes} onChange={set("notes")} rows={3} className={inputCls} />
          </Field>
        </div>
      )}

      <StepNav
        onBack={step === 0 ? onCancel : () => setStep(step - 1)}
        backLabel={step === 0 ? "ยกเลิก" : "← ย้อนกลับ"}
        onNext={last ? save : () => setStep(step + 1)}
        nextLabel={last ? (saving ? "กำลังบันทึก…" : id ? "✓ บันทึกการแก้ไข" : "✓ เพิ่มเครื่อง") : "ถัดไป →"}
        nextDisabled={!canSave || saving}
        hint={!canSave ? "ใส่ชื่อลูกค้า หรือเลขซีเรียล อย่างน้อย 1 ช่อง" : undefined}
      />
      {id && !last && canSave && (
        <div className="text-right mt-3">
          <button onClick={save} disabled={saving} className="text-sm text-yellow-400 hover:text-yellow-300 underline underline-offset-4">
            บันทึกเลย (ไม่ต้องไปขั้นถัดไป)
          </button>
        </div>
      )}
    </Card>
  );
}
