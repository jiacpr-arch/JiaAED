// ─── After an online order is paid: who does what next, and when to nudge ─────
// Owner, 16 พ.ย. 2026. A paid order walks four stages in /admin/billing:
//
//   new        ใหม่ — รอโทรยืนยัน
//   confirmed  โทรยืนยันแล้ว — รอส่ง/ติดตั้ง
//   delivered  ส่ง/ติดตั้งแล้ว — รอออกใบกำกับ   (serials → aed_units expiry alerts)
//   invoiced   ออกใบกำกับแล้ว — เสร็จ
//
// The daily cron (/api/cron/order-followups) pushes one LINE digest to every
// admin when an order has sat in a stage for more than STALE_HOURS, and when a
// delivered order is due a follow-up call (7 days: usage + free CPR course;
// 11 months: renew service / check pads & battery). The team calls — nothing is
// sent to the customer automatically. Pure module: pages, routes, cron, tests.
import { findCheckoutItem, thbExact } from "./checkout";

export type FulfillmentStage = "new" | "confirmed" | "delivered" | "invoiced";

export const STAGES: { id: FulfillmentStage; label: string; todo: string; action: string }[] = [
  { id: "new", label: "ใหม่ — รอโทรยืนยัน", todo: "โทรยืนยันกับลูกค้า", action: "📞 โทรยืนยันแล้ว" },
  { id: "confirmed", label: "โทรยืนยันแล้ว — รอส่ง/ติดตั้ง", todo: "นัดส่ง/ติดตั้ง", action: "🚚 ส่ง/ติดตั้งแล้ว" },
  { id: "delivered", label: "ส่ง/ติดตั้งแล้ว — รอออกใบกำกับ", todo: "ออกใบกำกับภาษีใน FlowAccount", action: "🧾 ออกใบกำกับแล้ว" },
  { id: "invoiced", label: "ออกใบกำกับแล้ว — เสร็จ", todo: "", action: "" },
];

export const STALE_HOURS = 24;

export type FollowupId = "d7" | "m11";
export const FOLLOWUPS: { id: FollowupId; days: number; label: string; todo: string }[] = [
  { id: "d7", days: 7, label: "ติดตาม 7 วัน", todo: "ถามการใช้งาน + ชวนจองอบรม CPR & AED ฟรี" },
  { id: "m11", days: 335, label: "ติดตาม 11 เดือน", todo: "ชวนต่อบริการดูแลรายปี + เช็กวันหมดอายุแผ่น/แบต" },
];

export type FulfillmentRow = {
  id: number;
  status: string;
  product_id: string;
  units: number;
  total_thb: number;
  refunded_thb?: number | null;
  customer_name: string | null;
  company_name: string | null;
  customer_phone?: string | null;
  fulfillment_status?: string | null;
  stage_changed_at?: string | null;
  paid_at?: string | null;
  created_at: string;
  delivered_at?: string | null;
  followup_d7_at?: string | null;
  followup_m11_at?: string | null;
};

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export function stageOf(o: Pick<FulfillmentRow, "fulfillment_status">): FulfillmentStage {
  return (STAGES.find((s) => s.id === o.fulfillment_status)?.id ?? "new") as FulfillmentStage;
}

export function stageInfo(s: FulfillmentStage) {
  return STAGES.find((x) => x.id === s)!;
}

export function nextStage(s: FulfillmentStage): FulfillmentStage | null {
  const i = STAGES.findIndex((x) => x.id === s);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1].id : null;
}

/** A fully refunded (or unpaid) order needs no work. */
function isLive(o: FulfillmentRow): boolean {
  return o.status === "paid" && Number(o.refunded_thb ?? 0) < Number(o.total_thb) - 0.005;
}

/** Hours the order has been waiting in its current stage. */
export function hoursInStage(o: FulfillmentRow, now: Date): number {
  const since = o.stage_changed_at ?? o.paid_at ?? o.created_at;
  return (now.getTime() - new Date(since).getTime()) / HOUR;
}

export function isStale(o: FulfillmentRow, now: Date): boolean {
  return isLive(o) && stageOf(o) !== "invoiced" && hoursInStage(o, now) > STALE_HOURS;
}

export function dueFollowups(o: FulfillmentRow, now: Date): (typeof FOLLOWUPS)[number][] {
  if (o.status !== "paid" || !o.delivered_at) return [];
  if (stageOf(o) !== "delivered" && stageOf(o) !== "invoiced") return [];
  const delivered = new Date(o.delivered_at).getTime();
  return FOLLOWUPS.filter((f) => {
    const done = f.id === "d7" ? o.followup_d7_at : o.followup_m11_at;
    if (done) return false;
    // The 7-day call is pointless once the 11-month one is due.
    if (f.id === "d7" && now.getTime() - delivered >= FOLLOWUPS[1].days * DAY) return false;
    return now.getTime() - delivered >= f.days * DAY;
  });
}

export const whoOfOrder = (o: Pick<FulfillmentRow, "company_name" | "customer_name">) => o.company_name || o.customer_name || "ลูกค้า";

function itemOf(o: FulfillmentRow): string {
  const name = findCheckoutItem(o.product_id)?.name ?? o.product_id;
  return `${name}${o.units > 1 ? ` × ${o.units}` : ""}`;
}

export type OrderTodo = { orderId: number; kind: "stale" | FollowupId; text: string };

export function orderTodos(orders: FulfillmentRow[], now: Date): OrderTodo[] {
  const out: OrderTodo[] = [];
  for (const o of orders) {
    if (isStale(o, now)) {
      const s = stageInfo(stageOf(o));
      const days = Math.floor(hoursInStage(o, now) / 24);
      out.push({ orderId: o.id, kind: "stale", text: `${whoOfOrder(o)} (${itemOf(o)}): ${s.todo} — ค้างมา ${days >= 1 ? `${days} วัน` : "เกิน 24 ชม."}` });
    }
    for (const f of dueFollowups(o, now)) {
      out.push({ orderId: o.id, kind: f.id, text: `${whoOfOrder(o)} (${itemOf(o)}): ${f.label} — ${f.todo}` });
    }
  }
  return out;
}

export function orderDigestText(orders: FulfillmentRow[], now: Date): string | null {
  const todos = orderTodos(orders, now);
  if (todos.length === 0) return null;
  const byId = new Map(orders.map((o) => [o.id, o]));
  const stale = todos.filter((t) => t.kind === "stale");
  const calls = todos.filter((t) => t.kind !== "stale");
  const phone = (t: OrderTodo) => {
    const p = byId.get(t.orderId)?.customer_phone;
    return p ? ` · โทร ${p}` : "";
  };
  return [
    `📦 งานออเดอร์ที่ต้องทำวันนี้ (${todos.length})`,
    ...(stale.length ? ["", "⏰ ออเดอร์ค้าง:", ...stale.map((t) => `• ${t.text}${phone(t)}`)] : []),
    ...(calls.length ? ["", "📞 ติดตามลูกค้า:", ...calls.map((t) => `• ${t.text}${phone(t)}`)] : []),
    "",
    "👉 อัปเดตสถานะที่ jiaaed.com/admin/billing?view=orders",
  ].join("\n");
}

/** One-line LINE note when the team moves an order on (keeps everyone in sync). */
export function stageChangedText(o: FulfillmentRow & { total_thb: number }, to: FulfillmentStage, serials: string[]): string {
  return [
    `${stageInfo(to).action.split(" ")[0]} ออเดอร์ ${whoOfOrder(o)} → ${stageInfo(to).label}`,
    `${itemOf(o)} · ${thbExact(Number(o.total_thb))}`,
    serials.length ? `เลขเครื่อง: ${serials.join(", ")} (เข้าระบบเตือนแผ่น/แบตแล้ว)` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** "SN1, SN2\nSN3" → ["SN1","SN2","SN3"] (deduped, trimmed, ≤ 50 × 100 chars). */
export function parseSerials(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return [...new Set(raw.split(/[\s,;]+/).map((s) => s.trim().slice(0, 100)).filter(Boolean))].slice(0, 50);
}
