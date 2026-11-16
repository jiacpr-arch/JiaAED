// ─── How many machines one customer may hold on card billing ────────────────
// Owner, 16 พ.ย. 2026. A rent-to-own / FLEX machine costs ~฿25–30k while the
// down payment / deposit covers only part of it, so a customer who stops
// paying (card cancelled, chargeback) leaves us exposed. Event holds are
// excluded — the card hold covers the machine.
//
//   individual / small shop ............ 1 machine in total
//   company (DBD checked), new ......... 2 machines in total
//   company with ≥ 3 instalments paid
//   and nothing overdue ("trusted") .... +2 machines per new link
//   anything overdue ................... no new link
//   above the ceiling .................. admin override with a reason (LINE logs it)
//
// Pure module: matching + decision. The API loads the rows.

export type CustomerType = "individual" | "company";

export const CUSTOMER_TYPES: { id: CustomerType; label: string }[] = [
  { id: "individual", label: "บุคคลธรรมดา / ร้านค้าเล็ก" },
  { id: "company", label: "นิติบุคคล (เช็ค DBD แล้ว)" },
];

export const LIMITS = { individual: 1, company: 2, trustedStep: 2, trustedAfterInstalments: 3 } as const;

export type CustomerKey = { companyName: string; email: string; phone: string };

export type ExposureRow = {
  stripe_subscription_id: string;
  plan_id: string;
  units: number;
  status: string;
  installments_paid: number;
  company_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
};

/** "บริษัท ตัวอย่าง จำกัด (มหาชน)" and "ตัวอย่าง co., ltd." → "ตัวอย่าง". */
export function normalizeCompany(name: string | null | undefined): string {
  return (name ?? "")
    .toLowerCase()
    .replace(/บริษัท|บจก\.?|บมจ\.?|ห้างหุ้นส่วนจำกัด|หจก\.?|จำกัด|\(มหาชน\)|มหาชน|co\.?,?|ltd\.?|limited|public|company|plc\.?|inc\.?/g, "")
    .replace(/[\s.,()\-]/g, "");
}

/** Last 9 digits, so "+66 81 234 5678" and "081-234-5678" match. */
export function normalizePhone(phone: string | null | undefined): string {
  const d = (phone ?? "").replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : "";
}

export function sameCustomer(row: ExposureRow, key: CustomerKey): boolean {
  const c = normalizeCompany(key.companyName);
  const e = key.email.trim().toLowerCase();
  const p = normalizePhone(key.phone);
  return (
    (c.length >= 3 && normalizeCompany(row.company_name) === c) ||
    (!!e && (row.customer_email ?? "").trim().toLowerCase() === e) ||
    (!!p && normalizePhone(row.customer_phone) === p)
  );
}

export type CreditDecision =
  | { ok: true; openUnits: number; ceiling: number }
  | { ok: false; reason: "overdue" | "over_limit"; openUnits: number; ceiling: number; message: string };

/**
 * May this customer take `units` more machines on card billing?
 * `excludeSubscriptionId`: a FLEX contract being converted (its units go away).
 */
export function checkCredit(
  rows: ExposureRow[],
  key: CustomerKey,
  type: CustomerType,
  units: number,
  excludeSubscriptionId?: string,
): CreditDecision {
  const mine = rows.filter((r) => r.stripe_subscription_id !== excludeSubscriptionId && sameCustomer(r, key));
  const open = mine.filter((r) => r.status === "active" || r.status === "past_due");
  const openUnits = open.reduce((s, r) => s + (Number(r.units) || 0), 0);

  if (open.some((r) => r.status === "past_due")) {
    return { ok: false, reason: "overdue", openUnits, ceiling: 0, message: "ลูกค้ามีงวดค้างชำระอยู่ — เคลียร์ก่อนจึงเปิดสัญญาใหม่ได้" };
  }

  const trusted =
    type === "company" &&
    mine.some((r) => r.installments_paid >= LIMITS.trustedAfterInstalments && (r.status === "active" || r.status === "completed"));

  const ceiling = trusted ? openUnits + LIMITS.trustedStep : type === "company" ? LIMITS.company : LIMITS.individual;
  if (openUnits + units > ceiling) {
    const who = trusted ? "นิติบุคคลที่จ่ายตรง (เพิ่มได้ทีละ 2)" : type === "company" ? "นิติบุคคลรายใหม่" : "บุคคล/ร้านค้าเล็ก";
    return {
      ok: false,
      reason: "over_limit",
      openUnits,
      ceiling,
      message: `เกินเพดาน${who}: มีอยู่ ${openUnits} เครื่อง + ขอใหม่ ${units} > ${ceiling} เครื่อง`,
    };
  }
  return { ok: true, openUnits, ceiling };
}
