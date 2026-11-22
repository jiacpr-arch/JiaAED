// ─── Lead pipeline: statuses, rules and funnel maths for /admin/leads ────────
// Pure module (no DB) so the API route and tests share one source of truth.
// Keep LEAD_STATUSES in step with the CHECK constraint in
// supabase/aed_leads_pipeline.sql.
//
// Measurement rules (landing-page brief §14): a form submit is a lead, never
// revenue; a LINE click is never a sale. Revenue only enters at
// contract_signed (contract value) and payment_received (money received), and
// only those two stages are reported to Google Ads as offline conversions.

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified_lead",
  "quotation_sent",
  "contract_signed",
  "payment_received",
  "lost",
  "spam",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_META: Record<LeadStatus, { label: string; tone: "gray" | "blue" | "yellow" | "green" | "red"; step: number | null }> = {
  new: { label: "ใหม่", tone: "yellow", step: 0 },
  contacted: { label: "ติดต่อแล้ว", tone: "blue", step: 1 },
  qualified_lead: { label: "ลูกค้ามีคุณภาพ", tone: "blue", step: 2 },
  quotation_sent: { label: "ส่งใบเสนอราคาแล้ว", tone: "blue", step: 3 },
  contract_signed: { label: "เซ็นสัญญา/ปิดการขาย", tone: "green", step: 4 },
  payment_received: { label: "รับชำระเงินแล้ว", tone: "green", step: 5 },
  lost: { label: "ไม่ได้งาน", tone: "red", step: null },
  spam: { label: "สแปม/ทดสอบ", tone: "gray", step: null },
};

/** Funnel stages in order (lost/spam are exits, not steps). */
export const FUNNEL: LeadStatus[] = LEAD_STATUSES.filter((s) => STATUS_META[s].step !== null);

export function isLeadStatus(v: unknown): v is LeadStatus {
  return typeof v === "string" && (LEAD_STATUSES as readonly string[]).includes(v);
}

/** Which money column a stage writes, if any. */
export const VALUE_COLUMN: Partial<Record<LeadStatus, "quote_value_thb" | "contract_value_thb" | "paid_value_thb">> = {
  quotation_sent: "quote_value_thb",
  contract_signed: "contract_value_thb",
  payment_received: "paid_value_thb",
};

// Stages that are real money and go to Google Ads as offline conversions.
// contract_signed → GOOGLE_ADS_CONTRACT_ACTION_ID, else the existing
// GOOGLE_ADS_CONVERSION_ACTION_ID ("Sale Closed"); payment_received only to its
// own GOOGLE_ADS_PAYMENT_ACTION_ID, so contract + payment never double-count
// one sale under the same action.
export type ConversionStage = "contract_signed" | "payment_received";
export function conversionActionFor(stage: LeadStatus, env: Record<string, string | undefined>): string | null {
  if (stage === "contract_signed") return env.GOOGLE_ADS_CONTRACT_ACTION_ID || env.GOOGLE_ADS_CONVERSION_ACTION_ID || null;
  if (stage === "payment_received") return env.GOOGLE_ADS_PAYMENT_ACTION_ID || null;
  return null;
}
export const isConversionStage = (s: LeadStatus): s is ConversionStage => s === "contract_signed" || s === "payment_received";

/** Google Ads dedups uploads by order id — one per lead per stage. */
export const conversionOrderId = (leadId: string, stage: ConversionStage) => `lead:${leadId}:${stage}`;

export type StatusChange = { status: LeadStatus; valueThb: number | null; note: string | null; lostReason: string | null };

/** Validate a PATCH body from the admin page. Returns the change or an error code. */
export function parseStatusChange(body: Record<string, unknown>): StatusChange | { error: string } {
  if (!isLeadStatus(body.status)) return { error: "invalid_status" };
  const status = body.status;

  let valueThb: number | null = null;
  if (body.value_thb !== undefined && body.value_thb !== null && body.value_thb !== "") {
    const n = Number(body.value_thb);
    if (!Number.isFinite(n) || n < 0 || n > 100_000_000) return { error: "invalid_value" };
    valueThb = Math.round(n * 100) / 100;
  }
  // Revenue stages must carry the amount — otherwise ROAS can't be measured.
  if ((status === "contract_signed" || status === "payment_received") && !(valueThb && valueThb > 0)) {
    return { error: "value_required" };
  }
  if (valueThb !== null && !VALUE_COLUMN[status]) valueThb = null; // only money stages store a value

  const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const lostReason = status === "lost" ? text(body.lost_reason, 300) : null;
  if (status === "lost" && !lostReason) return { error: "lost_reason_required" };

  return { status, valueThb, note: text(body.note, 1000), lostReason };
}

// ─── Funnel report ───────────────────────────────────────────────────────────

export type LeadRow = {
  status: string;
  source: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  contract_value_thb: number | string | null;
  paid_value_thb: number | string | null;
};

export type FunnelRow = {
  key: string;
  leads: number;
  /** leads that reached at least this stage (index = FUNNEL step) */
  reached: number[];
  lost: number;
  spam: number;
  contractValue: number;
  paidValue: number;
};

const num = (v: number | string | null) => (v === null || v === "" ? 0 : Number(v) || 0);

/**
 * Group leads by a key (campaign, source …) and count how many reached each
 * funnel step. A lead at step N also "reached" every earlier step. Lost and
 * spam leads count as leads but reach no further than where they were; since
 * their last step isn't stored on the row, they're counted only as leads.
 */
export function funnelBy(rows: LeadRow[], keyOf: (r: LeadRow) => string): FunnelRow[] {
  const groups = new Map<string, FunnelRow>();
  for (const r of rows) {
    const key = keyOf(r);
    let g = groups.get(key);
    if (!g) {
      g = { key, leads: 0, reached: FUNNEL.map(() => 0), lost: 0, spam: 0, contractValue: 0, paidValue: 0 };
      groups.set(key, g);
    }
    if (r.status === "spam") {
      g.spam++;
      continue; // spam/test rows aren't leads
    }
    g.leads++;
    if (r.status === "lost") g.lost++;
    const step = isLeadStatus(r.status) ? STATUS_META[r.status].step : null;
    if (step !== null) for (let i = 0; i <= step; i++) g.reached[i]++;
    else g.reached[0]++;
    g.contractValue += num(r.contract_value_thb);
    g.paidValue += num(r.paid_value_thb);
  }
  return [...groups.values()].sort((a, b) => b.leads - a.leads);
}

export const campaignKey = (r: LeadRow) =>
  r.utm_campaign ? `${r.utm_source ?? "?"} / ${r.utm_campaign}` : r.utm_source ? r.utm_source : "ไม่มี UTM (organic/direct)";

// ─── Follow-up signals to GA4 and Meta ───────────────────────────────────────
// Names follow the landing-page brief (§14). Meta: "Subscribe" (standard, with
// value) for a signed rental contract; custom names elsewhere — never
// "Purchase", because this Meta dataset also carries the jia1669.com shop's
// purchases and rental money must not be mixed into them.
export const STAGE_SIGNALS: Partial<Record<LeadStatus, { ga4: string; meta: string }>> = {
  qualified_lead: { ga4: "qualified_lead", meta: "QualifiedLead" },
  quotation_sent: { ga4: "quotation_sent", meta: "QuotationSent" },
  contract_signed: { ga4: "rental_contract_signed", meta: "Subscribe" },
  payment_received: { ga4: "rental_payment_received", meta: "RentalPaymentReceived" },
};

/** Stable id per lead + stage, so a retry or an accidental double save dedupes. */
export const stageEventId = (leadId: string, stage: LeadStatus) => `lead:${leadId}:${stage}`;

export type SignalOutcome = { ads: string | null; ga4: string | null; meta: string | null };

/** "ads=queued ga4=skipped_no_consent meta=queued" — stored on aed_lead_events. */
export function formatOutcome(o: SignalOutcome): string | null {
  const parts = (Object.entries(o) as [keyof SignalOutcome, string | null][])
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${v}`);
  return parts.length ? parts.join(" ") : null;
}
