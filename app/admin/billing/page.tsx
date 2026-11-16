"use client";

// /admin/billing — card payments for rental customers, as step-by-step jobs:
//   1. monthly card billing link for a signed rental / rent-to-own contract
//   2. FLEX renter keeps the machine → buy / rent-to-own with deposit credited
//   3. event rental secured by a card hold (capture rent on return)
// plus the lists that need follow-up (open holds, monthly customers, online
// orders). Every money action opens a dialog: enter amount → check → confirm.

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { thbExact } from "@/lib/aed/checkout";
import { MAX_RENTAL_UNITS, findRentalPlan, quoteRental, rentalBillingPlans } from "@/lib/aed/rental-billing";
import { conversionQuote, conversionTargets, depositOf, findConversionTarget } from "@/lib/aed/rental-conversion";
import {
  HOLD_MAX_RETURN_DAYS,
  MAX_HOLD_UNITS,
  captureAmount,
  findHoldPackage,
  holdPackages,
  holdQuote,
  holdReturnDateOk,
  lateDays,
  lateFee,
  type HoldRow,
} from "@/lib/aed/rental-holds";
import { flexEndQuote, refundableLeft } from "@/lib/aed/refunds";
import {
  AdminShell,
  Card,
  Choice,
  Dialog,
  Empty,
  Field,
  Notice,
  Pill,
  StepNav,
  Steps,
  Summary,
  Tabs,
  btnGhost,
  btnPrimary,
  btnSmall,
  inputCls,
  useAdmin,
} from "../ui";

// ─── Types ───────────────────────────────────────────────────────────────────

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

type Order = {
  id: number;
  status: string;
  product_id: string;
  units: number;
  total_thb: number;
  refunded_thb: number | null;
  customer_name: string | null;
  company_name: string | null;
  customer_email: string | null;
  created_at: string;
};

type Hold = HoldRow & { payment_intent_id: string; refunded_thb?: number | null };

type Task = "subscribe" | "convert" | "hold";
type View = "holds" | "monthly" | "orders";
type Info = { customerName: string; companyName: string; email: string; phone: string; contractRef: string };
const EMPTY_INFO: Info = { customerName: "", companyName: "", email: "", phone: "", contractRef: "" };

const STATUS_TH: Record<Row["status"], { label: string; tone: "green" | "red" | "gray" | "blue" }> = {
  active: { label: "ตัดบัตรปกติ", tone: "green" },
  past_due: { label: "ค้างชำระ", tone: "red" },
  completed: { label: "ครบแล้ว", tone: "gray" },
  canceled: { label: "ยกเลิก", tone: "gray" },
  converted: { label: "เปลี่ยนเป็นซื้อแล้ว", tone: "blue" },
};

const HOLD_STATUS_TH: Record<HoldRow["status"], { label: string; tone: "yellow" | "green" | "gray" | "red" }> = {
  authorized: { label: "กันวงเงินอยู่", tone: "yellow" },
  captured: { label: "เก็บค่าเช่าแล้ว", tone: "green" },
  released: { label: "ยกเลิก (ไม่เก็บเงิน)", tone: "gray" },
  expired: { label: "หมดอายุ — ยังไม่ได้เก็บ!", tone: "red" },
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

const bkk = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const thaiDay = (ymd: string | null) =>
  ymd ? new Date(`${ymd}T12:00:00+07:00`).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", weekday: "short", day: "numeric", month: "short" }) : "—";
const bkkToday = (plusDays = 0) => new Date(Date.now() + 7 * 3_600_000 + plusDays * 86_400_000).toISOString().slice(0, 10);
const whoOf = (r: { company_name: string | null; customer_name: string | null }) => r.company_name || r.customer_name || "—";
const isOpenFlex = (r: Row) => findRentalPlan(r.plan_id)?.kind === "flex" && ["active", "past_due"].includes(r.status);

async function post(body: Record<string, unknown>) {
  const res = await fetch("/api/admin/rental-billing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(ERRORS[data.error] ?? `ไม่สำเร็จ: ${data.message ?? data.error ?? res.status}`);
  return data;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminBillingPage() {
  return (
    <AdminShell title="รับชำระเงินด้วยบัตร" subtitle="สร้างลิงก์ → ส่ง LINE ให้ลูกค้า · ผลการชำระแจ้งเข้า LINE แอดมิน">
      <Suspense fallback={null}>
        <Billing />
      </Suspense>
    </AdminShell>
  );
}

type Dlg =
  | { type: "capture"; hold: Hold }
  | { type: "release"; hold: Hold }
  | { type: "refundHold"; hold: Hold }
  | { type: "refundOrder"; order: Order }
  | { type: "endFlex"; row: Row };

function Billing() {
  const { expire } = useAdmin();
  const router = useRouter();
  const params = useSearchParams();

  const [rows, setRows] = useState<Row[]>([]);
  const [holds, setHolds] = useState<Hold[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stripeReady, setStripeReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dlg | null>(null);
  const [convertFrom, setConvertFrom] = useState<Row | null>(null);

  const task = (["subscribe", "convert", "hold"] as const).find((t) => t === params.get("new")) ?? null;
  const view = (["holds", "monthly", "orders"] as const).find((v) => v === params.get("view")) ?? "holds";
  const go = (q: string) => router.push(`/admin/billing${q}`, { scroll: true });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rental-billing");
      if (res.status === 401) return expire();
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError("โหลดรายการไม่สำเร็จ (รัน supabase/aed_rental_billing.sql แล้วหรือยัง?)");
        return;
      }
      setRows(data.rows);
      setHolds(data.holds);
      setOrders(data.orders ?? []);
      setStripeReady(data.stripeReady);
    } catch {
      setError("เชื่อมต่อไม่ได้");
    } finally {
      setLoading(false);
    }
  }, [expire]);

  useEffect(() => {
    load();
  }, [load]);

  const done = async (msg: string) => {
    setDialog(null);
    setNotice(msg);
    setError(null);
    await load();
  };

  if (task) {
    return (
      <Wizard
        key={`${task}-${convertFrom?.id ?? ""}`}
        task={task}
        rows={rows}
        stripeReady={stripeReady}
        preset={task === "convert" ? convertFrom : null}
        onExit={() => {
          setConvertFrom(null);
          go(task === "hold" ? "?view=holds" : "?view=monthly");
          load();
        }}
      />
    );
  }

  const openHolds = holds.filter((h) => h.status === "authorized" || h.status === "expired");
  const closedHolds = holds.filter((h) => !(h.status === "authorized" || h.status === "expired"));

  return (
    <>
      {!stripeReady && (
        <div className="mb-4">
          <Notice kind="warn">ยังไม่ได้ตั้ง STRIPE_SECRET_KEY — สร้างลิงก์ไม่ได้จนกว่าจะตั้งค่าใน Vercel</Notice>
        </div>
      )}
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

      <h2 className="text-lg font-bold mb-3">① สร้างลิงก์ใหม่ให้ลูกค้า</h2>
      <div className="grid gap-3 mb-10">
        <Choice icon="💳" title="ตัดบัตรรายเดือน" desc="ลูกค้าเซ็นสัญญาเช่า FLEX หรือเช่าแล้วได้ซื้อแล้ว" onClick={() => go("?new=subscribe")} />
        <Choice icon="🎪" title="เช่าอีเวนต์ — กันวงเงินบัตร" desc={`เช่า 1–6 วัน คืนเครื่องภายใน ${HOLD_MAX_RETURN_DAYS} วัน · ยังไม่ตัดเงินจนกว่าจะคืนเครื่อง`} onClick={() => go("?new=hold")} />
        <Choice icon="🔁" title="เปลี่ยนเช่า → ซื้อ" desc="ลูกค้า FLEX อยากได้เครื่องเลย · หักเงินประกันที่วางไว้" onClick={() => go("?new=convert")} />
      </div>

      <h2 className="text-lg font-bold mb-3">② รายการที่ต้องดูแล</h2>
      <Tabs<View>
        value={view}
        onChange={(v) => go(`?view=${v}`)}
        items={[
          { id: "holds", label: `🎪 เช่าอีเวนต์${openHolds.length ? ` (${openHolds.length})` : ""}` },
          { id: "monthly", label: `💳 รายเดือน (${rows.length})` },
          { id: "orders", label: `🛒 ออเดอร์ออนไลน์ (${orders.length})` },
        ]}
      />

      {loading && <p className="text-gray-500 text-sm mb-4">กำลังโหลด…</p>}

      {view === "holds" && (
        <div className="space-y-3">
          {openHolds.length === 0 && !loading && <Empty>ไม่มีเครื่องอีเวนต์ที่ยังไม่คืน</Empty>}
          {openHolds.map((h) => (
            <HoldCard key={h.id} h={h} onAction={setDialog} />
          ))}
          {closedHolds.length > 0 && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">ดูรายการที่ปิดแล้ว ({closedHolds.length})</summary>
              <div className="space-y-3 mt-3">
                {closedHolds.map((h) => (
                  <HoldCard key={h.id} h={h} onAction={setDialog} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {view === "monthly" && (
        <div className="space-y-3">
          {rows.length === 0 && !loading && <Empty>ยังไม่มีลูกค้าตัดบัตรรายเดือน</Empty>}
          {rows.map((r) => (
            <Card key={r.id} className="!p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Pill tone={STATUS_TH[r.status]?.tone}>{STATUS_TH[r.status]?.label ?? r.status}</Pill>
                    {r.contract_ref && <span className="text-xs text-gray-500">สัญญา {r.contract_ref}</span>}
                  </div>
                  <div className="font-bold">{whoOf(r)}</div>
                  <div className="text-sm text-gray-400">
                    {findRentalPlan(r.plan_id)?.label ?? r.plan_id}
                    {r.units > 1 && ` × ${r.units} เครื่อง`}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-bold">{r.monthly_total_thb != null ? `${thbExact(Number(r.monthly_total_thb))}/เดือน` : "—"}</div>
                  <div className="text-gray-400">
                    จ่ายแล้ว {r.installments_paid}
                    {r.months_total ? `/${r.months_total}` : ""} งวด
                  </div>
                </div>
              </div>
              {isOpenFlex(r) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    className={btnSmall}
                    onClick={() => {
                      setConvertFrom(r);
                      go("?new=convert");
                    }}
                  >
                    🔁 ลูกค้าอยากซื้อ
                  </button>
                  <button className={btnSmall} onClick={() => setDialog({ type: "endFlex", row: r })}>
                    📦 คืนเครื่อง + คืนเงินประกัน
                  </button>
                </div>
              )}
            </Card>
          ))}
          <p className="text-xs text-gray-500 pt-2">ยกเลิกเช่าซื้อ / เปลี่ยนบัตร ทำใน Stripe Dashboard · ใบกำกับ/ใบลดหนี้ออกจาก FlowAccount</p>
        </div>
      )}

      {view === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 && !loading && <Empty>ยังไม่มีออเดอร์ที่ชำระแล้ว</Empty>}
          {orders.map((o) => {
            const left = refundableLeft(o);
            const refunded = Number(o.refunded_thb ?? 0);
            return (
              <Card key={o.id} className="!p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500 mb-1">{bkk(o.created_at)}</div>
                    <div className="font-bold">{whoOf(o)}</div>
                    <div className="text-sm text-gray-400">
                      {o.product_id}
                      {o.units > 1 && ` × ${o.units}`}
                      {o.customer_email && ` · ${o.customer_email}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{thbExact(Number(o.total_thb))}</div>
                    {refunded > 0 && <div className="text-xs text-gray-400">คืนแล้ว {thbExact(refunded)}</div>}
                  </div>
                </div>
                <div className="mt-3">
                  {left > 0 ? (
                    <button className={btnSmall} onClick={() => setDialog({ type: "refundOrder", order: o })}>
                      ↩️ คืนเงิน
                    </button>
                  ) : (
                    <Pill>คืนเงินครบแล้ว</Pill>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {dialog?.type === "capture" && <CaptureDialog h={dialog.hold} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.type === "release" && <ReleaseDialog h={dialog.hold} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.type === "refundHold" && <RefundHoldDialog h={dialog.hold} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.type === "refundOrder" && <RefundOrderDialog o={dialog.order} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.type === "endFlex" && <EndFlexDialog r={dialog.row} onClose={() => setDialog(null)} onDone={done} />}
    </>
  );
}

function HoldCard({ h, onAction }: { h: Hold; onAction: (d: Dlg) => void }) {
  const late = h.status === "authorized" ? lateDays(h.return_date) : 0;
  const refunded = Number(h.refunded_thb ?? 0);
  const canRefundExcess = h.status === "captured" && refunded === 0 && Number(h.captured_thb ?? 0) >= Number(h.authorized_thb);
  return (
    <Card className={`!p-4 ${late > 0 || h.status === "expired" ? "!border-red-500/50" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Pill tone={HOLD_STATUS_TH[h.status]?.tone}>{HOLD_STATUS_TH[h.status]?.label ?? h.status}</Pill>
            {late > 0 && <Pill tone="red">เลยกำหนดคืน {late} วัน</Pill>}
          </div>
          <div className="font-bold">{whoOf(h)}</div>
          {h.event_name && <div className="text-sm text-gray-400">{h.event_name}</div>}
          <div className="text-sm text-gray-400 mt-1">
            คืนเครื่อง {thaiDay(h.return_date)} · {h.units} เครื่อง · {h.days} วัน
          </div>
        </div>
        <div className="text-right text-sm">
          <div>
            ค่าเช่า <b>{thbExact(Number(h.rent_thb))}</b>
          </div>
          <div className="text-gray-400">กันไว้ {thbExact(Number(h.authorized_thb))}</div>
          {h.status === "captured" && h.captured_thb != null && (
            <div className="text-gray-400">
              เก็บแล้ว {thbExact(Number(h.captured_thb))}
              {refunded > 0 && ` · คืน ${thbExact(refunded)}`}
            </div>
          )}
          {h.status === "authorized" && <div className="text-xs text-yellow-300 mt-1">ต้องเก็บเงินก่อน {bkk(h.capture_before)}</div>}
        </div>
      </div>
      {h.status === "authorized" && (
        <div className="flex flex-wrap gap-2 mt-4">
          <button className={`${btnPrimary} !py-2 !px-4 text-sm`} onClick={() => onAction({ type: "capture", hold: h })}>
            📦 คืนเครื่องแล้ว — เก็บค่าเช่า
          </button>
          <button className={btnSmall} onClick={() => onAction({ type: "release", hold: h })}>
            ยกเลิกเช่า (ไม่เก็บเงิน)
          </button>
        </div>
      )}
      {canRefundExcess && (
        <div className="mt-4">
          <button className={btnSmall} onClick={() => onAction({ type: "refundHold", hold: h })}>
            ↩️ ได้เครื่องคืนแล้ว — คืนเงินส่วนเกิน
          </button>
        </div>
      )}
    </Card>
  );
}

// ─── Wizard: create a payment link ───────────────────────────────────────────

const TASK_TITLE: Record<Task, string> = {
  subscribe: "💳 ตัดบัตรรายเดือน",
  hold: "🎪 เช่าอีเวนต์ — กันวงเงินบัตร",
  convert: "🔁 เปลี่ยนเช่า → ซื้อ",
};

const TASK_STEPS: Record<Task, string[]> = {
  subscribe: ["เลือกแผน", "ข้อมูลลูกค้า", "ตรวจสอบ", "ส่งลิงก์"],
  hold: ["แพ็กเกจ", "วันคืนเครื่อง", "ข้อมูลลูกค้า", "ตรวจสอบ", "ส่งลิงก์"],
  convert: ["ลูกค้าเดิม", "เปลี่ยนเป็น", "ข้อมูลลูกค้า", "ตรวจสอบ", "ส่งลิงก์"],
};

function infoFrom(r: Row): Info {
  return {
    customerName: r.customer_name ?? "",
    companyName: r.company_name ?? "",
    email: r.customer_email ?? "",
    phone: r.customer_phone ?? "",
    contractRef: r.contract_ref ?? "",
  };
}

function Wizard({
  task,
  rows,
  stripeReady,
  preset,
  onExit,
}: {
  task: Task;
  rows: Row[];
  stripeReady: boolean;
  preset: Row | null;
  onExit: () => void;
}) {
  const steps = TASK_STEPS[task];
  const [step, setStep] = useState(preset ? 1 : 0);
  const [info, setInfo] = useState<Info>(preset ? infoFrom(preset) : EMPTY_INFO);
  const [units, setUnits] = useState(preset?.units ?? 1);

  const [planId, setPlanId] = useState<string>(rentalBillingPlans[0].id);
  const [packageId, setPackageId] = useState<string>(holdPackages[0].id);
  const [days, setDays] = useState(holdPackages[0].days[0]);
  const [returnDate, setReturnDate] = useState("");
  const [eventName, setEventName] = useState("");
  const [sourceId, setSourceId] = useState(preset?.stripe_subscription_id ?? "");
  const [targetId, setTargetId] = useState<string>(conversionTargets[0].id);
  const [depositCredit, setDepositCredit] = useState(preset ? depositOf(preset) : 0);
  const [rentCredit, setRentCredit] = useState(0);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<{ url: string; summary: string; expiresAt: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const flexRows = rows.filter(isOpenFlex);
  const source = rows.find((r) => r.stripe_subscription_id === sourceId) ?? null;
  const maxDeposit = source ? depositOf(source) : 0;
  const maxUnits = task === "hold" ? MAX_HOLD_UNITS : MAX_RENTAL_UNITS;
  const pkg = findHoldPackage(packageId)!;
  const plan = findRentalPlan(planId)!;
  const target = findConversionTarget(targetId)!;
  const key = steps[step];

  const next = () => {
    setError(null);
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    setError(null);
    if (step === 0) onExit();
    else setStep((s) => s - 1);
  };

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const base = { ...info, units };
      const body =
        task === "subscribe"
          ? { action: "subscribe", planId, ...base }
          : task === "convert"
            ? { action: "convert", targetId, sourceSubscriptionId: sourceId, depositCredit, rentCredit, ...base }
            : { action: "hold", packageId, days, returnDate, eventName, ...base };
      const data = await post(body);
      setLink({ url: data.url, summary: data.summary, expiresAt: data.expiresAt });
      next();
    } catch (err) {
      setError(err instanceof Error ? err.message : "สร้างลิงก์ไม่สำเร็จ");
    } finally {
      setCreating(false);
    }
  };

  const lineMessage = link
    ? `${link.summary}\n${link.url}\n(ลิงก์ใช้ได้ถึง ${new Date(link.expiresAt * 1000).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })})`
    : "";

  const pickSource = (r: Row | null) => {
    if (r) {
      setSourceId(r.stripe_subscription_id);
      setDepositCredit(depositOf(r));
      setUnits(r.units);
      setInfo(infoFrom(r));
    } else {
      setSourceId("");
      setDepositCredit(0);
    }
  };

  const nameOk = Boolean(info.companyName.trim() || info.customerName.trim());
  const emailOk = !info.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email.trim());

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="text-xl font-bold">{TASK_TITLE[task]}</h2>
        {key !== "ส่งลิงก์" && (
          <button onClick={onExit} className="text-sm text-gray-400 hover:text-white">
            ยกเลิก ✕
          </button>
        )}
      </div>
      <Steps steps={steps} current={step} />

      {error && (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      )}

      {/* ── subscribe ── */}
      {key === "เลือกแผน" && (
        <>
          <p className="text-gray-300 mb-3">ลูกค้าเลือกแผนไหน?</p>
          <div className="grid gap-3">
            {rentalBillingPlans.map((p) => {
              const q = quoteRental(p, 1);
              return (
                <Choice
                  key={p.id}
                  selected={planId === p.id}
                  onClick={() => setPlanId(p.id)}
                  title={p.label}
                  desc={`วันนี้ ${thbExact(q.todayTotal)} · เดือนละ ${thbExact(q.monthlyTotal)}${q.monthlyCharges != null ? ` × ${q.monthlyCharges} งวด` : " จนกว่าจะเลิกเช่า"} (ต่อเครื่อง รวม VAT)`}
                />
              );
            })}
          </div>
          <UnitsPicker value={units} max={maxUnits} onChange={setUnits} />
          <StepNav onBack={back} backLabel="← กลับ" onNext={next} />
        </>
      )}

      {/* ── hold ── */}
      {key === "แพ็กเกจ" && (
        <>
          <p className="text-gray-300 mb-3">เช่าแบบไหน?</p>
          <div className="grid gap-3">
            {holdPackages.map((p) => (
              <Choice
                key={p.id}
                selected={packageId === p.id}
                onClick={() => {
                  setPackageId(p.id);
                  setDays(p.days[0]);
                }}
                title={p.label}
                desc={p.days.length > 1 ? `เลือกได้ ${p.days[0]}–${p.days[p.days.length - 1]} วัน` : `${p.days[0]} วัน`}
              />
            ))}
          </div>
          {pkg.days.length > 1 && (
            <div className="mt-6">
              <p className="text-sm font-semibold mb-2">กี่วัน?</p>
              <div className="flex flex-wrap gap-2">
                {pkg.days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`w-14 h-12 rounded-xl font-bold border-2 ${days === d ? "border-yellow-400 bg-yellow-400 text-gray-950" : "border-gray-700 hover:border-gray-500"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
          <UnitsPicker value={units} max={maxUnits} onChange={setUnits} />
          <div className="mt-6">
            <Notice kind="info">
              กันวงเงิน {thbExact(holdQuote(pkg, days, units).authorizeTotal)} · ค่าเช่า {thbExact(holdQuote(pkg, days, units).rentGross)} (รวม VAT)
            </Notice>
          </div>
          <StepNav onBack={back} backLabel="← กลับ" onNext={next} />
        </>
      )}

      {key === "วันคืนเครื่อง" && (
        <>
          <div className="grid gap-5">
            <Field label="ลูกค้าจะคืนเครื่องวันไหน?" hint={`ต้องไม่เกิน ${HOLD_MAX_RETURN_DAYS} วันจากวันนี้ (วงเงินบัตรอยู่ได้ 7 วัน) — นานกว่านี้ให้รับมัดจำเงินสดแทน`}>
              <input type="date" value={returnDate} min={bkkToday()} max={bkkToday(HOLD_MAX_RETURN_DAYS)} onChange={(e) => setReturnDate(e.target.value)} className={inputCls} />
            </Field>
            <div className="flex flex-wrap gap-2 -mt-2">
              {[days - 1, days].filter((d, i, a) => d >= 0 && d <= HOLD_MAX_RETURN_DAYS && a.indexOf(d) === i).map((d) => (
                <button key={d} type="button" className={btnSmall} onClick={() => setReturnDate(bkkToday(d))}>
                  {thaiDay(bkkToday(d))}
                </button>
              ))}
            </div>
            <Field label="ชื่องาน / อีเวนต์ (ไม่บังคับ)">
              <input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="เช่น งานวิ่งมาราธอน" className={inputCls} />
            </Field>
          </div>
          <StepNav
            onBack={back}
            onNext={next}
            nextDisabled={!holdReturnDateOk(returnDate)}
            hint={returnDate && !holdReturnDateOk(returnDate) ? <span className="text-red-300">วันคืนต้องอยู่ระหว่างวันนี้ ถึง {thaiDay(bkkToday(HOLD_MAX_RETURN_DAYS))}</span> : undefined}
          />
        </>
      )}

      {/* ── convert ── */}
      {key === "ลูกค้าเดิม" && (
        <>
          <p className="text-gray-300 mb-3">ลูกค้าเช่า FLEX คนไหนจะเปลี่ยนเป็นซื้อ?</p>
          <div className="grid gap-3">
            {flexRows.map((r) => (
              <Choice
                key={r.id}
                selected={sourceId === r.stripe_subscription_id}
                onClick={() => pickSource(r)}
                title={whoOf(r)}
                desc={`${findRentalPlan(r.plan_id)?.label}${r.units > 1 ? ` × ${r.units}` : ""} · จ่ายแล้ว ${r.installments_paid} เดือน · เงินประกัน ${thbExact(depositOf(r))}`}
              />
            ))}
            <Choice selected={sourceId === ""} onClick={() => pickSource(null)} title="ไม่อยู่ในรายการ" desc="ลูกค้าเช่าแบบอื่น — ใส่ส่วนลดค่าเช่าเองในขั้นถัดไป" />
          </div>
          <StepNav onBack={back} backLabel="← กลับ" onNext={next} hint={source ? "เมื่อลูกค้าจ่ายแล้ว ระบบหยุดตัดค่าเช่าเดิมให้อัตโนมัติ" : undefined} />
        </>
      )}

      {key === "เปลี่ยนเป็น" && (
        <>
          <p className="text-gray-300 mb-3">เปลี่ยนเป็นอะไร?</p>
          <div className="grid gap-3">
            {conversionTargets.map((t) => (
              <Choice key={t.id} selected={targetId === t.id} onClick={() => setTargetId(t.id)} title={t.label} desc={t.kind === "buy" ? "จ่ายครั้งเดียว" : "ดาวน์ + ผ่อนรายเดือน"} />
            ))}
          </div>
          {!source && <UnitsPicker value={units} max={maxUnits} onChange={setUnits} />}
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <Field label="หักเงินประกัน (บาท)" hint={source ? `สูงสุด ${thbExact(maxDeposit)}` : "ไม่มีสัญญา FLEX เดิม"}>
              <input
                type="number"
                min={0}
                max={maxDeposit}
                value={depositCredit}
                disabled={!source}
                onChange={(e) => setDepositCredit(Math.max(0, Number(e.target.value) || 0))}
                className={inputCls}
              />
            </Field>
            <Field label="หักค่าเช่าที่จ่ายแล้ว (โปร)" hint="ใส่ 0 ถ้าไม่ให้ส่วนลดนี้">
              <input type="number" min={0} value={rentCredit} onChange={(e) => setRentCredit(Math.max(0, Number(e.target.value) || 0))} className={inputCls} />
            </Field>
          </div>
          <StepNav
            onBack={back}
            onNext={next}
            nextDisabled={depositCredit > maxDeposit}
            hint={depositCredit > maxDeposit ? <span className="text-red-300">หักเงินประกันได้ไม่เกิน {thbExact(maxDeposit)}</span> : undefined}
          />
        </>
      )}

      {/* ── shared ── */}
      {key === "ข้อมูลลูกค้า" && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="ชื่อบริษัท">
              <input value={info.companyName} onChange={(e) => setInfo({ ...info, companyName: e.target.value })} className={inputCls} />
            </Field>
            <Field label="ชื่อผู้ติดต่อ">
              <input value={info.customerName} onChange={(e) => setInfo({ ...info, customerName: e.target.value })} className={inputCls} />
            </Field>
            <Field label="อีเมล" hint="ลูกค้าได้ใบเสร็จ Stripe ทางอีเมลนี้">
              <input type="email" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} className={inputCls} />
            </Field>
            <Field label="เบอร์โทร">
              <input type="tel" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} className={inputCls} />
            </Field>
            <Field label="เลขที่สัญญา / ใบเสนอราคา" className="sm:col-span-2">
              <input value={info.contractRef} onChange={(e) => setInfo({ ...info, contractRef: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <StepNav
            onBack={back}
            onNext={next}
            nextDisabled={!nameOk || !emailOk}
            hint={!nameOk ? "ใส่ชื่อบริษัท หรือชื่อผู้ติดต่อ อย่างน้อย 1 ช่อง" : !emailOk ? <span className="text-red-300">อีเมลไม่ถูกต้อง</span> : undefined}
          />
        </>
      )}

      {key === "ตรวจสอบ" && (
        <>
          <p className="text-gray-300 mb-3">ตรวจสอบให้ถูกต้องก่อนสร้างลิงก์</p>
          <Summary
            rows={[
              ["ลูกค้า", [info.companyName, info.customerName].filter(Boolean).join(" · ")],
              ...(info.email ? [["อีเมล", info.email] as [string, string]] : []),
              ...(info.contractRef ? [["เลขที่สัญญา", info.contractRef] as [string, string]] : []),
              ...reviewRows(),
            ]}
          />
          {!stripeReady && (
            <div className="mt-4">
              <Notice kind="warn">ยังไม่ได้ตั้ง STRIPE_SECRET_KEY — สร้างลิงก์ไม่ได้</Notice>
            </div>
          )}
          <StepNav onBack={back} onNext={create} nextDisabled={creating || !stripeReady} nextLabel={creating ? "กำลังสร้าง…" : task === "hold" ? "✓ สร้างลิงก์กันวงเงิน" : "✓ สร้างลิงก์ชำระเงิน"} />
        </>
      )}

      {key === "ส่งลิงก์" && link && (
        <>
          <Notice kind="ok">สร้างลิงก์แล้ว — คัดลอกข้อความด้านล่างไปส่งลูกค้าทาง LINE (ใช้ได้ภายใน 23 ชม.)</Notice>
          <textarea readOnly value={lineMessage} rows={6} className={`${inputCls} font-mono text-xs mt-4`} />
          <button
            onClick={() => navigator.clipboard.writeText(lineMessage).then(() => setCopied(true))}
            className="mt-3 w-full bg-[#06C755] hover:brightness-110 text-white font-bold px-5 py-4 rounded-xl text-lg"
          >
            {copied ? "คัดลอกแล้ว ✓ — ไปวางใน LINE ได้เลย" : "📋 คัดลอกข้อความส่ง LINE"}
          </button>
          <p className="text-sm text-gray-400 mt-4">เมื่อลูกค้าจ่ายแล้ว ระบบแจ้งเข้า LINE แอดมินอัตโนมัติ</p>
          <div className="mt-6 flex justify-end">
            <button onClick={onExit} className={btnGhost}>
              เสร็จแล้ว ✓
            </button>
          </div>
        </>
      )}
    </Card>
  );

  function reviewRows(): [string, string][] {
    if (task === "subscribe") {
      const q = quoteRental(plan, units);
      return [
        ["แผน", `${plan.label}${units > 1 ? ` × ${units} เครื่อง` : ""}`],
        ["จ่ายวันนี้", thbExact(q.todayTotal)],
        ["ตัดบัตรทุกเดือน", q.monthlyCharges == null ? `${thbExact(q.monthlyTotal)} จนกว่าจะเลิกเช่า` : `${thbExact(q.monthlyTotal)} × ${q.monthlyCharges} งวด`],
        ...(q.contractTotal != null ? [["รวมทั้งสัญญา", thbExact(q.contractTotal)] as [string, string]] : []),
      ];
    }
    if (task === "hold") {
      const q = holdQuote(pkg, days, units);
      return [
        ["แพ็กเกจ", `${pkg.label} · ${days} วัน${units > 1 ? ` × ${units} เครื่อง` : ""}`],
        ["วันคืนเครื่อง", thaiDay(returnDate)],
        ...(eventName ? [["งาน", eventName] as [string, string]] : []),
        ["กันวงเงินบัตร (ยังไม่ตัดเงิน)", thbExact(q.authorizeTotal)],
        ["เก็บจริงเมื่อคืนเครื่อง", `${thbExact(q.rentGross)} (ค่าเช่า รวม VAT)`],
        ["ปล่อยคืนบัตรลูกค้า", thbExact(q.hold)],
      ];
    }
    const q = conversionQuote(target, units, depositCredit + rentCredit);
    return [
      ["จากสัญญาเดิม", source ? whoOf(source) : "—"],
      ["เปลี่ยนเป็น", `${target.label}${units > 1 ? ` × ${units}` : ""}`],
      ["ราคาเต็มวันนี้", thbExact(q.grossToday)],
      ...(q.creditApplied > 0 ? [["หักเงินประกัน/ค่าเช่า", `− ${thbExact(q.creditApplied)}`] as [string, string]] : []),
      ...(q.creditUnused > 0 ? [["ส่วนลดที่หักไม่ได้ (คืนแยก)", thbExact(q.creditUnused)] as [string, string]] : []),
      ["ลูกค้าจ่ายวันนี้", thbExact(q.payableToday)],
      ...(q.monthlyTotal != null ? [["ผ่อนรายเดือน", `${thbExact(q.monthlyTotal)} × ${q.monthlyCharges} งวด`] as [string, string]] : []),
    ];
  }
}

function UnitsPicker({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="mt-6">
      <p className="text-sm font-semibold mb-2">จำนวนเครื่อง</p>
      <div className="flex items-center gap-3">
        <button type="button" className="w-12 h-12 rounded-xl border-2 border-gray-700 text-2xl disabled:opacity-30" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1} aria-label="ลด">
          −
        </button>
        <span className="text-2xl font-bold w-12 text-center">{value}</span>
        <button type="button" className="w-12 h-12 rounded-xl border-2 border-gray-700 text-2xl disabled:opacity-30" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="เพิ่ม">
          +
        </button>
        <span className="text-sm text-gray-500">สูงสุด {max}</span>
      </div>
    </div>
  );
}

// ─── Money dialogs ───────────────────────────────────────────────────────────

type DlgProps = { onClose: () => void; onDone: (msg: string) => void };

function useRun() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function AmountInput({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <div className="relative mt-1.5">
      <input type="number" inputMode="decimal" min={0} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} !mt-0 pr-12 text-xl font-bold`} autoFocus={autoFocus} />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">บาท</span>
    </div>
  );
}

function CaptureDialog({ h, onClose, onDone }: { h: Hold } & DlgProps) {
  const late = lateDays(h.return_date);
  const fee = lateFee(late, h.units);
  const rent = Number(h.rent_thb);
  const authorized = Number(h.authorized_thb);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"ok" | "extra" | "all">("ok");
  const [extra, setExtra] = useState(String(fee || ""));
  const { busy, error, run } = useRun();

  const damage = mode === "all" ? authorized : mode === "ok" ? fee : Number(extra) || 0;
  const total = captureAmount({ rentGross: rent, authorizeTotal: authorized }, damage);
  const bad = mode === "extra" && (!Number.isFinite(Number(extra)) || Number(extra) < 0);

  return (
    <Dialog title={`เก็บค่าเช่า — ${whoOf(h)}`} onClose={onClose}>
      <Steps steps={["สภาพเครื่อง", "ยืนยัน"]} current={step} />
      {step === 0 && (
        <>
          {late > 0 && (
            <div className="mb-3">
              <Notice kind="warn">
                คืนช้า {late} วัน = ค่าปรับ {thbExact(fee)}
              </Notice>
            </div>
          )}
          <div className="grid gap-3">
            <Choice
              selected={mode === "ok"}
              onClick={() => setMode("ok")}
              icon="✅"
              title={late > 0 ? "ได้เครื่องคืนครบสภาพ (คิดค่าคืนช้า)" : "ได้เครื่องคืนครบสภาพ ตรงเวลา"}
              desc={`เก็บ ${thbExact(rent + fee)}`}
            />
            <Choice selected={mode === "extra"} onClick={() => setMode("extra")} icon="🛠️" title="มีค่าเสียหาย / ค่าใช้จ่ายเพิ่ม" desc="ใส่จำนวนเงินเอง" />
            <Choice
              selected={mode === "all"}
              onClick={() => setMode("all")}
              icon="⏳"
              title="ยังไม่ได้เครื่องคืน แต่วงเงินใกล้หมดอายุ"
              desc={`เก็บเต็มวงเงิน ${thbExact(authorized)} ไว้ก่อน แล้วคืนส่วนเกินทีหลัง`}
            />
          </div>
          {mode === "extra" && (
            <Field label="ค่าใช้จ่ายเพิ่ม (นอกจากค่าเช่า)" hint={late > 0 ? `รวมค่าคืนช้า ${thbExact(fee)} ไว้ในตัวเลขนี้ด้วย` : undefined} className="mt-4">
              <AmountInput value={extra} onChange={setExtra} autoFocus />
            </Field>
          )}
          <StepNav onBack={onClose} backLabel="ยกเลิก" onNext={() => setStep(1)} nextDisabled={bad} />
        </>
      )}
      {step === 1 && (
        <>
          <Summary
            rows={[
              ["ค่าเช่า", thbExact(rent)],
              ...(total - rent > 0 ? [["ค่าใช้จ่ายเพิ่ม", thbExact(total - rent)] as [string, string]] : []),
              [<b key="a">ตัดเงินจากบัตร</b>, <b key="b" className="text-yellow-300 text-lg">{thbExact(total)}</b>],
              ["ปล่อยวงเงินคืนลูกค้า", thbExact(authorized - total)],
            ]}
          />
          {error && (
            <div className="mt-4">
              <Notice kind="error">{error}</Notice>
            </div>
          )}
          <StepNav
            onBack={() => setStep(0)}
            nextDisabled={busy}
            nextLabel={busy ? "กำลังดำเนินการ…" : `✓ ยืนยันเก็บ ${thbExact(total)}`}
            onNext={() =>
              run(async () => {
                const data = await post({ action: "capture", holdId: h.id, damage });
                onDone(`เก็บเงิน ${thbExact(data.captured)} แล้ว · ปล่อยวงเงิน ${thbExact(data.released)}`);
              })
            }
          />
        </>
      )}
    </Dialog>
  );
}

function ReleaseDialog({ h, onClose, onDone }: { h: Hold } & DlgProps) {
  const { busy, error, run } = useRun();
  return (
    <Dialog title={`ยกเลิกเช่า — ${whoOf(h)}`} onClose={onClose}>
      <p className="text-gray-300">ยกเลิกการเช่าและปล่อยวงเงิน {thbExact(Number(h.authorized_thb))} คืนบัตรลูกค้าทั้งหมด</p>
      <p className="text-red-300 font-semibold mt-2">ไม่เก็บค่าเช่าเลย — ทำย้อนกลับไม่ได้</p>
      {error && (
        <div className="mt-4">
          <Notice kind="error">{error}</Notice>
        </div>
      )}
      <StepNav
        onBack={onClose}
        backLabel="ไม่ใช่ กลับ"
        danger
        nextDisabled={busy}
        nextLabel={busy ? "กำลังดำเนินการ…" : "ยืนยันยกเลิก"}
        onNext={() =>
          run(async () => {
            await post({ action: "release", holdId: h.id, damage: 0 });
            onDone("ยกเลิกแล้ว · ปล่อยวงเงินคืนลูกค้า");
          })
        }
      />
    </Dialog>
  );
}

function RefundHoldDialog({ h, onClose, onDone }: { h: Hold } & DlgProps) {
  const late = lateDays(h.return_date);
  const suggested = Math.round((Number(h.rent_thb) + lateFee(late, h.units)) * 100) / 100;
  const [step, setStep] = useState(0);
  const [keep, setKeep] = useState(String(suggested));
  const [quote, setQuote] = useState<{ keep: number; excess: number; feeOnExcess: number; refund: number } | null>(null);
  const { busy, error, run } = useRun();
  const k = Number(keep);
  const bad = !Number.isFinite(k) || k < 0 || keep.trim() === "";

  return (
    <Dialog title={`คืนเงินส่วนเกิน — ${whoOf(h)}`} onClose={onClose}>
      <Steps steps={["ยอดที่ร้านเก็บไว้", "ยืนยัน"]} current={step} />
      {step === 0 && (
        <>
          <p className="text-sm text-gray-400 mb-4">
            เก็บเต็มวงเงินไว้แล้ว {thbExact(Number(h.captured_thb ?? 0))} — ตอนนี้ได้เครื่องคืน ให้ใส่ยอดที่ร้านจะเก็บไว้จริง ส่วนที่เหลือคืนลูกค้า
          </p>
          <Field
            label="ร้านเก็บไว้"
            hint={`= ค่าเช่า ${thbExact(Number(h.rent_thb))}${late > 0 ? ` + คืนช้า ${late} วัน ${thbExact(lateFee(late, h.units))}` : ""} · ถ้ามีค่าเสียหายให้บวกเพิ่ม`}
          >
            <AmountInput value={keep} onChange={setKeep} autoFocus />
          </Field>
          {error && (
            <div className="mt-4">
              <Notice kind="error">{error}</Notice>
            </div>
          )}
          <StepNav
            onBack={onClose}
            backLabel="ยกเลิก"
            nextDisabled={bad || busy}
            nextLabel={busy ? "กำลังคำนวณ…" : "ถัดไป →"}
            onNext={() =>
              run(async () => {
                const data = await post({ action: "refund_hold", holdId: h.id, keep: k, preview: true });
                setQuote(data.quote);
                setStep(1);
              })
            }
          />
        </>
      )}
      {step === 1 && quote && (
        <>
          <Summary
            rows={[
              ["ร้านเก็บไว้", thbExact(quote.keep)],
              ["ส่วนเกิน", thbExact(quote.excess)],
              ["หัก ค่าธรรมเนียมบัตรที่ Stripe ไม่คืน", `− ${thbExact(quote.feeOnExcess)}`],
              [<b key="a">คืนลูกค้า</b>, <b key="b" className="text-yellow-300 text-lg">{thbExact(quote.refund)}</b>],
            ]}
          />
          <p className="text-sm text-red-300 mt-3">คืนเงินแล้วยกเลิกไม่ได้</p>
          {error && (
            <div className="mt-4">
              <Notice kind="error">{error}</Notice>
            </div>
          )}
          <StepNav
            onBack={() => setStep(0)}
            nextDisabled={busy}
            nextLabel={busy ? "กำลังคืนเงิน…" : `✓ คืน ${thbExact(quote.refund)}`}
            onNext={() =>
              run(async () => {
                await post({ action: "refund_hold", holdId: h.id, keep: k });
                onDone(`คืนเงิน ${thbExact(quote.refund)} แล้ว (หักค่าธรรมเนียมบัตร ${thbExact(quote.feeOnExcess)}) · เงินเข้าบัตรลูกค้าใน 5–10 วันทำการ`);
              })
            }
          />
        </>
      )}
    </Dialog>
  );
}

function RefundOrderDialog({ o, onClose, onDone }: { o: Order } & DlgProps) {
  const left = refundableLeft(o);
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(String(left));
  const { busy, error, run } = useRun();
  const a = Number(amount);
  const bad = !Number.isFinite(a) || a <= 0 || a > left;

  return (
    <Dialog title={`คืนเงิน — ${whoOf(o)}`} onClose={onClose}>
      <Steps steps={["จำนวนเงิน", "ยืนยัน"]} current={step} />
      {step === 0 && (
        <>
          <div className="flex gap-2 mb-4">
            <button type="button" className={btnSmall} onClick={() => setAmount(String(left))}>
              คืนเต็ม {thbExact(left)}
            </button>
          </div>
          <Field label="ยอดที่จะคืน" hint={`คืนได้สูงสุด ${thbExact(left)} · Stripe ไม่คืนค่าธรรมเนียมของยอดที่คืน`}>
            <AmountInput value={amount} onChange={setAmount} autoFocus />
          </Field>
          <StepNav
            onBack={onClose}
            backLabel="ยกเลิก"
            onNext={() => setStep(1)}
            nextDisabled={bad}
            hint={amount && bad ? <span className="text-red-300">ยอดต้องมากกว่า 0 และไม่เกิน {thbExact(left)}</span> : undefined}
          />
        </>
      )}
      {step === 1 && (
        <>
          <Summary
            rows={[
              ["ลูกค้า", whoOf(o)],
              ["สินค้า", `${o.product_id}${o.units > 1 ? ` × ${o.units}` : ""}`],
              [<b key="a">คืนเงิน</b>, <b key="b" className="text-yellow-300 text-lg">{thbExact(a)}</b>],
            ]}
          />
          <p className="text-sm text-red-300 mt-3">คืนเงินแล้วยกเลิกไม่ได้</p>
          {error && (
            <div className="mt-4">
              <Notice kind="error">{error}</Notice>
            </div>
          )}
          <StepNav
            onBack={() => setStep(0)}
            nextDisabled={busy}
            nextLabel={busy ? "กำลังคืนเงิน…" : `✓ คืน ${thbExact(a)}`}
            onNext={() =>
              run(async () => {
                const data = await post({ action: "refund_order", orderId: o.id, amount: a });
                onDone(`คืนเงิน ${thbExact(data.refunded)} แล้ว · เงินเข้าบัตรลูกค้าใน 5–10 วันทำการ · อย่าลืมออกใบลดหนี้ใน FlowAccount`);
              })
            }
          />
        </>
      )}
    </Dialog>
  );
}

function EndFlexDialog({ r, onClose, onDone }: { r: Row } & DlgProps) {
  const [step, setStep] = useState(0);
  const [hasDamage, setHasDamage] = useState(false);
  const [damage, setDamage] = useState("");
  const { busy, error, run } = useRun();
  const d = hasDamage ? Number(damage) : 0;
  const bad = hasDamage && (!Number.isFinite(d) || d < 0 || damage.trim() === "");
  const q = flexEndQuote(r, bad ? 0 : d);

  return (
    <Dialog title={`คืนเครื่อง FLEX — ${whoOf(r)}`} onClose={onClose}>
      <Steps steps={["สภาพเครื่อง", "ยืนยัน"]} current={step} />
      {step === 0 && (
        <>
          <p className="text-sm text-gray-400 mb-4">เงินประกันที่ลูกค้าวางไว้ {thbExact(q?.deposit ?? 0)}</p>
          <div className="grid gap-3">
            <Choice selected={!hasDamage} onClick={() => setHasDamage(false)} icon="✅" title="ได้เครื่องคืนครบสภาพ" desc="คืนเงินประกันเต็มจำนวน" />
            <Choice selected={hasDamage} onClick={() => setHasDamage(true)} icon="🛠️" title="มีค่าเสียหาย" desc="หักจากเงินประกัน" />
          </div>
          {hasDamage && (
            <Field label="ค่าเสียหาย" className="mt-4">
              <AmountInput value={damage} onChange={setDamage} autoFocus />
            </Field>
          )}
          <StepNav onBack={onClose} backLabel="ยกเลิก" onNext={() => setStep(1)} nextDisabled={bad} />
        </>
      )}
      {step === 1 && q && (
        <>
          <Summary
            rows={[
              ["หยุดตัดค่าเช่ารายเดือน", "ใช่"],
              ["เงินประกัน", thbExact(q.deposit)],
              ...(q.damage > 0 ? [["หักค่าเสียหาย", `− ${thbExact(q.damage)}`] as [string, string]] : []),
              [<b key="a">คืนลูกค้า</b>, <b key="b" className="text-yellow-300 text-lg">{thbExact(q.refund)}</b>],
            ]}
          />
          <p className="text-sm text-red-300 mt-3">ทำแล้วยกเลิกไม่ได้</p>
          {error && (
            <div className="mt-4">
              <Notice kind="error">{error}</Notice>
            </div>
          )}
          <StepNav
            onBack={() => setStep(0)}
            nextDisabled={busy}
            nextLabel={busy ? "กำลังดำเนินการ…" : "✓ ยืนยันจบเช่า"}
            onNext={() =>
              run(async () => {
                const data = await post({ action: "end_flex", subscriptionId: r.stripe_subscription_id, damage: q.damage });
                onDone(
                  data.refunded || q.refund === 0
                    ? `จบเช่าแล้ว · คืนเงินประกัน ${thbExact(q.refund)} · เงินเข้าบัตรลูกค้าใน 5–10 วันทำการ`
                    : "จบเช่าแล้ว แต่คืนเงินประกันอัตโนมัติไม่สำเร็จ — คืนเองใน Stripe Dashboard",
                );
              })
            }
          />
        </>
      )}
    </Dialog>
  );
}
