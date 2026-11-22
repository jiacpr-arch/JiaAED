"use client";

// /admin/leads — work the web-form leads: list → open a lead → move it along
// the pipeline (ติดต่อแล้ว → มีคุณภาพ → ส่งใบเสนอราคา → เซ็นสัญญา → รับเงิน).
// The "รายงาน" tab shows the funnel and revenue per ad campaign, so ad spend
// can be compared with real contracts, not form fills or LINE clicks.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FUNNEL,
  LEAD_STATUSES,
  STATUS_META,
  VALUE_COLUMN,
  campaignKey,
  funnelBy,
  type LeadStatus,
} from "@/lib/aed/lead-pipeline";
import { AdminShell, Card, Dialog, Empty, Field, Notice, Pill, Summary, Tabs, btnPrimary, btnSmall, inputCls, useAdmin } from "../ui";

type Lead = {
  id: string;
  created_at: string;
  source: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  product_id: string | null;
  unit_count: string | null;
  message: string | null;
  gclid: string | null;
  fbclid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  page_url: string | null;
  status: LeadStatus;
  status_updated_at: string | null;
  quote_value_thb: number | null;
  contract_value_thb: number | null;
  paid_value_thb: number | null;
  lost_reason: string | null;
  admin_note: string | null;
};

type LeadEvent = { id: number; from_status: string | null; to_status: string; value_thb: number | null; note: string | null; conversion_status: string | null; created_at: string };

type View = "open" | "all" | "won" | "closed" | "report";
const OPEN: LeadStatus[] = ["new", "contacted", "qualified_lead", "quotation_sent"];
const WON: LeadStatus[] = ["contract_signed", "payment_received"];

const thb = (n: number | null | undefined) => (n ? `฿${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "–");
const pathOf = (url: string | null) => {
  if (!url) return "–";
  try {
    return new URL(url).pathname;
  } catch {
    return url.slice(0, 80);
  }
};
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "–");

const ERRORS: Record<string, string> = {
  value_required: "สถานะนี้ต้องใส่จำนวนเงิน (บาท ไม่รวม VAT)",
  lost_reason_required: "กรุณาระบุเหตุผลที่ไม่ได้งาน",
  invalid_value: "จำนวนเงินไม่ถูกต้อง",
  invalid_status: "สถานะไม่ถูกต้อง",
  not_found: "ไม่พบ lead นี้",
};
const CONVERSION_NOTE: Record<string, string> = {
  queued: "ส่งยอดเข้า Google Ads แล้ว",
  skipped_no_gclid: "ไม่ได้ส่งเข้า Google Ads (lead นี้ไม่ได้มาจากโฆษณา Google หรือไม่ได้ยินยอมคุกกี้)",
  skipped_no_action_id: "ยังไม่ได้ตั้ง conversion action ใน Google Ads — บันทึกไว้ในระบบแล้ว",
  skipped_already_reported: "ขั้นนี้เคยส่ง Google Ads แล้ว ไม่ส่งซ้ำ",
};

export default function AdminLeadsPage() {
  return (
    <AdminShell title="Leads" subtitle="ลูกค้าที่กรอกฟอร์มบนเว็บ — อัปเดตสถานะเพื่อวัดยอดขายจริงจากโฆษณา" wide>
      <Leads />
    </AdminShell>
  );
}

function Leads() {
  const { expire } = useAdmin();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("open");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Lead | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leads");
      if (res.status === 401) return expire();
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setLeads(data.leads);
      setError(null);
    } catch {
      setError("โหลดรายการไม่สำเร็จ — ถ้าเพิ่งติดตั้ง ต้องรัน supabase/aed_leads_pipeline.sql ก่อน");
    } finally {
      setLoading(false);
    }
  }, [expire]);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (view === "open" && !OPEN.includes(l.status)) return false;
      if (view === "won" && !WON.includes(l.status)) return false;
      if (view === "closed" && !(l.status === "lost" || l.status === "spam")) return false;
      if (!term) return true;
      return [l.full_name, l.phone, l.email, l.company_name, l.message, l.utm_campaign, l.source].some((v) => v?.toLowerCase().includes(term));
    });
  }, [leads, view, q]);

  const counts = useMemo(() => {
    const c = { open: 0, won: 0, closed: 0, newOnes: 0 };
    for (const l of leads) {
      if (OPEN.includes(l.status)) c.open++;
      if (WON.includes(l.status)) c.won++;
      if (l.status === "lost" || l.status === "spam") c.closed++;
      if (l.status === "new") c.newOnes++;
    }
    return c;
  }, [leads]);

  return (
    <div className="space-y-5">
      {error && <Notice kind="error">{error}</Notice>}
      <Tabs
        value={view}
        onChange={setView}
        items={[
          { id: "open", label: `กำลังดำเนินการ (${counts.open})` },
          { id: "won", label: `ปิดการขาย (${counts.won})` },
          { id: "closed", label: `ไม่ได้งาน/สแปม (${counts.closed})` },
          { id: "all", label: `ทั้งหมด (${leads.length})` },
          { id: "report", label: "📊 รายงาน" },
        ]}
      />

      {view === "report" ? (
        <Report leads={leads} />
      ) : (
        <>
          {counts.newOnes > 0 && view === "open" && (
            <Notice kind="warn">มี lead ใหม่ {counts.newOnes} รายที่ยังไม่ได้ติดต่อ</Notice>
          )}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา ชื่อ เบอร์ บริษัท แคมเปญ…" className={inputCls} aria-label="ค้นหา lead" />
          {loading ? (
            <p className="text-gray-400">กำลังโหลด…</p>
          ) : shown.length === 0 ? (
            <Empty>ไม่มี lead ในหมวดนี้</Empty>
          ) : (
            <ul className="space-y-2" data-testid="lead-list">
              {shown.map((l) => (
                <li key={l.id}>
                  <button onClick={() => setOpen(l)} className="w-full text-left bg-gray-900 border border-gray-800 hover:border-yellow-400 rounded-2xl p-4 flex flex-wrap items-center gap-3">
                    <Pill tone={STATUS_META[l.status]?.tone ?? "gray"}>{STATUS_META[l.status]?.label ?? l.status}</Pill>
                    <span className="font-bold">{l.full_name || l.company_name || l.phone || "ไม่มีชื่อ"}</span>
                    {l.company_name && l.full_name && <span className="text-gray-400 text-sm">{l.company_name}</span>}
                    <span className="text-gray-500 text-sm">{l.utm_campaign || l.utm_source || l.source}</span>
                    <span className="ml-auto text-gray-500 text-xs">{when(l.created_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {open && (
        <LeadDialog
          lead={open}
          onClose={() => setOpen(null)}
          onSaved={async () => {
            setOpen(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function LeadDialog({ lead, onClose, onSaved }: { lead: Lead; onClose: () => void; onSaved: () => void }) {
  const { expire } = useAdmin();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [events, setEvents] = useState<LeadEvent[] | null>(null);

  useEffect(() => {
    fetch(`/api/admin/leads?id=${lead.id}`)
      .then((r) => (r.status === 401 ? (expire(), null) : r.json()))
      .then((d) => d?.ok && setEvents(d.events))
      .catch(() => setEvents([]));
  }, [lead.id, expire]);

  const needsValue = Boolean(VALUE_COLUMN[status]);
  const changed = status !== lead.status || note.trim() !== "";

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: lead.id, status, value_thb: value, note, lost_reason: lostReason }),
      });
      if (res.status === 401) return expire();
      const data = await res.json();
      if (!data.ok) return setError(ERRORS[data.error] ?? "บันทึกไม่สำเร็จ");
      if (data.conversion) {
        setResult(CONVERSION_NOTE[data.conversion] ?? data.conversion);
        setTimeout(onSaved, 1800);
      } else onSaved();
    } catch {
      setError("เชื่อมต่อไม่ได้");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog title={lead.full_name || lead.company_name || "Lead"} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {lead.phone && <a href={`tel:${lead.phone}`} className={btnSmall}>📞 {lead.phone}</a>}
          {lead.email && <a href={`mailto:${lead.email}`} className={btnSmall}>✉️ {lead.email}</a>}
        </div>
        <Summary
          rows={[
            ["องค์กร", lead.company_name || "–"],
            ["สินค้า / จำนวน", `${lead.product_id || "–"} · ${lead.unit_count || "–"}`],
            ["ข้อความ", lead.message || "–"],
            ["มาจาก", [lead.utm_source, lead.utm_medium, lead.utm_campaign, lead.utm_content].filter(Boolean).join(" / ") || lead.source || "–"],
            ["คลิกโฆษณา", lead.gclid ? "Google Ads (มี gclid)" : lead.fbclid ? "Meta (มี fbclid)" : "–"],
            ["หน้าเว็บ", pathOf(lead.page_url)],
            ["รับเข้า", when(lead.created_at)],
            ["มูลค่า", `เสนอราคา ${thb(lead.quote_value_thb)} · สัญญา ${thb(lead.contract_value_thb)} · รับเงิน ${thb(lead.paid_value_thb)}`],
          ]}
        />

        <Card>
          <Field label="สถานะ">
            <select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} className={inputCls} data-testid="status-select">
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          </Field>
          {needsValue && (
            <Field
              className="mt-4"
              label={status === "quotation_sent" ? "ยอดใบเสนอราคา (บาท ไม่รวม VAT)" : status === "contract_signed" ? "มูลค่าสัญญา (บาท ไม่รวม VAT) *" : "ยอดที่รับชำระแล้ว (บาท ไม่รวม VAT) *"}
              hint={status === "quotation_sent" ? undefined : "ใช้คำนวณ ROAS — ส่งเข้า Google Ads เมื่อ lead มาจากโฆษณา"}
            >
              <input type="number" inputMode="decimal" min={0} value={value} onChange={(e) => setValue(e.target.value)} className={inputCls} />
            </Field>
          )}
          {status === "lost" && (
            <Field className="mt-4" label="เหตุผลที่ไม่ได้งาน *">
              <input value={lostReason} onChange={(e) => setLostReason(e.target.value)} className={inputCls} placeholder="เช่น ราคาสูงไป / เลือกเจ้าอื่น / ติดต่อไม่ได้" />
            </Field>
          )}
          <Field className="mt-4" label="บันทึก (ไม่บังคับ)">
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
          </Field>
          {error && <div className="mt-4"><Notice kind="error">{error}</Notice></div>}
          {result && <div className="mt-4"><Notice kind="ok">{result}</Notice></div>}
          <button onClick={save} disabled={busy || !changed} className={`${btnPrimary} mt-5 w-full`}>
            {busy ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </Card>

        <div>
          <h3 className="font-bold mb-2">ประวัติ</h3>
          {events === null ? (
            <p className="text-gray-500 text-sm">กำลังโหลด…</p>
          ) : events.length === 0 ? (
            <p className="text-gray-500 text-sm">ยังไม่มีการเปลี่ยนสถานะ</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {events.map((e) => (
                <li key={e.id} className="text-gray-300">
                  <span className="text-gray-500">{when(e.created_at)}</span> ·{" "}
                  {STATUS_META[e.from_status as LeadStatus]?.label ?? e.from_status ?? "–"} → <b>{STATUS_META[e.to_status as LeadStatus]?.label ?? e.to_status}</b>
                  {e.value_thb ? ` · ${thb(e.value_thb)}` : ""}
                  {e.note ? ` · ${e.note}` : ""}
                  {e.conversion_status ? <span className="text-gray-500"> · Ads: {e.conversion_status}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function Report({ leads }: { leads: Lead[] }) {
  const rows = useMemo(() => funnelBy(leads, campaignKey), [leads]);
  const total = useMemo(() => funnelBy(leads, () => "รวม")[0], [leads]);
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");
  if (!total) return <Empty>ยังไม่มี lead</Empty>;

  return (
    <div className="space-y-5" data-testid="lead-report">
      <Card>
        <h3 className="font-bold mb-3">Funnel รวม ({total.leads} leads ไม่นับสแปม)</h3>
        <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {FUNNEL.map((s, i) => (
            <li key={s} className="rounded-xl bg-gray-950 border border-gray-800 p-3">
              <div className="text-xs text-gray-400">{STATUS_META[s].label}</div>
              <div className="text-2xl font-bold">{total.reached[i]}</div>
              <div className="text-xs text-gray-500">{pct(total.reached[i], total.leads)} ของ leads</div>
            </li>
          ))}
        </ol>
        <p className="text-sm text-gray-300 mt-4">
          มูลค่าสัญญา <b>{thb(total.contractValue)}</b> · รับเงินแล้ว <b>{thb(total.paidValue)}</b> · ไม่ได้งาน {total.lost}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          นับเฉพาะ lead จากฟอร์มบนเว็บ (ไม่รวมแชต LINE) · ยอดกรอกฟอร์มไม่ใช่รายได้ — รายได้นับจากสัญญาและเงินที่รับจริงเท่านั้น ·
          ROAS = รับเงินแล้ว ÷ ค่าโฆษณาของแคมเปญเดียวกัน
        </p>
      </Card>

      <Card>
        <h3 className="font-bold mb-3">แยกตามแคมเปญ</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-gray-400 text-left">
              <tr>
                <th className="py-2 pr-3">แหล่ง / แคมเปญ</th>
                <th className="py-2 px-2 text-right">Leads</th>
                <th className="py-2 px-2 text-right">มีคุณภาพ</th>
                <th className="py-2 px-2 text-right">ใบเสนอราคา</th>
                <th className="py-2 px-2 text-right">สัญญา</th>
                <th className="py-2 px-2 text-right">มูลค่าสัญญา</th>
                <th className="py-2 pl-2 text-right">รับเงินแล้ว</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-gray-800">
                  <td className="py-2 pr-3">{r.key}</td>
                  <td className="py-2 px-2 text-right">{r.leads}</td>
                  <td className="py-2 px-2 text-right">{r.reached[2]}</td>
                  <td className="py-2 px-2 text-right">{r.reached[3]}</td>
                  <td className="py-2 px-2 text-right">{r.reached[4]}</td>
                  <td className="py-2 px-2 text-right">{thb(r.contractValue)}</td>
                  <td className="py-2 pl-2 text-right">{thb(r.paidValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
