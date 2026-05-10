import { optionalEnv, requireEnv } from "@/lib/env";

const TOKEN_URL = optionalEnv("FLOWACCOUNT_TOKEN_URL", "https://openapi.flowaccount.com/test/token");
const BASE_URL = optionalEnv("FLOWACCOUNT_BASE_URL", "https://openapi.flowaccount.com/test");

let _token = "";
let _tokenExp = 0;

async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExp - 60_000) return _token;
  const clientId = requireEnv("FLOWACCOUNT_CLIENT_ID");
  const clientSecret = requireEnv("FLOWACCOUNT_CLIENT_SECRET");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret, scope: "flowaccount-api" }),
  });
  if (!res.ok) throw new Error(`FA token ${res.status}`);
  const d = await res.json() as { access_token: string; expires_in: number };
  _token = d.access_token;
  _tokenExp = Date.now() + d.expires_in * 1_000;
  return _token;
}

async function faPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json() as T;
  if (!res.ok) throw new Error(`FA POST ${path} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuotationInput {
  productCode: string;
  productName: string;
  quantity: number;
  unitPriceExVat: number;
  contactName: string;
  contactTaxId?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyName?: string;
  notes?: string;
}

export interface FaResult {
  ok: boolean;
  documentId?: string;
  documentNumber?: string;
  error?: string;
}

type FaDoc = { id?: string; documentSerial?: string; documentNumber?: string; message?: string };

function buildItems(input: QuotationInput) {
  const subtotal = Math.round(input.unitPriceExVat * input.quantity * 100) / 100;
  const vatAmount = Math.round(subtotal * 0.07 * 100) / 100;
  const grandTotal = subtotal + vatAmount;

  return {
    subtotal,
    vatAmount,
    grandTotal,
    items: [
      {
        type: 1,
        name: input.productName,
        description: `${input.productName} (${input.productCode})`,
        quantity: input.quantity,
        unitName: "เครื่อง",
        pricePerUnit: input.unitPriceExVat,
        total: subtotal,
        discountAmount: 0,
        vatRate: 7,
        sellChartOfAccountCode: "41210",
        buyChartOfAccountCode: "",
      },
    ],
    contactMeta: {
      contactName: input.companyName || input.contactName,
      contactTaxId: input.contactTaxId ?? "",
      contactEmail: input.contactEmail ?? "",
      contactGroup: 1,
    },
    remarks: [input.notes, `ผู้ติดต่อ: ${input.contactName}${input.contactPhone ? " " + input.contactPhone : ""}`]
      .filter(Boolean).join(" | "),
  };
}

// ─── Create quotation ─────────────────────────────────────────────────────────

export async function createQuotation(input: QuotationInput): Promise<FaResult> {
  const today = new Date().toISOString().slice(0, 10);
  const dueDate = new Date(Date.now() + 15 * 86_400_000).toISOString().slice(0, 10);
  const { subtotal, vatAmount, grandTotal, items, contactMeta, remarks } = buildItems(input);

  try {
    const doc = await faPost<FaDoc>("/quotations", {
      ...contactMeta, publishedOn: today, creditType: 2, creditDays: 15, dueDate,
      isVatInclusive: false, isVat: true,
      subTotal: subtotal, discountPercentage: 0, discountAmount: 0,
      totalAfterDiscount: subtotal, vatAmount, grandTotal,
      documentShowWithholdingTax: false, documentWithholdingTaxPercentage: 0, documentWithholdingTaxAmount: 0,
      remarks, items,
    });
    return { ok: true, documentId: doc.id ?? doc.documentSerial, documentNumber: doc.documentNumber };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ─── Issue receipt after payment ──────────────────────────────────────────────

export async function issueReceipt(input: QuotationInput & { stripePaymentIntentId: string; publishedOn: string }): Promise<FaResult> {
  const { subtotal, vatAmount, grandTotal, items, contactMeta, remarks } = buildItems(input);

  try {
    const doc = await faPost<FaDoc>("/cash-invoices/inline/with-payment", {
      ...contactMeta, publishedOn: input.publishedOn, creditType: 3, creditDays: 0, dueDate: input.publishedOn,
      isVatInclusive: false, isVat: true,
      subTotal: subtotal, discountPercentage: 0, discountAmount: 0,
      totalAfterDiscount: subtotal, vatAmount, grandTotal,
      documentShowWithholdingTax: false, documentWithholdingTaxPercentage: 0, documentWithholdingTaxAmount: 0,
      remarks: `Stripe: ${input.stripePaymentIntentId} | ${remarks}`, items,
      documentPaymentStructureType: "InlineDocumentWithPaymentReceivingCash",
      paymentMethod: 1, paymentDate: input.publishedOn, collected: grandTotal,
      paymentDeductionType: 1, paymentDeductionAmount: 0,
      withheldPercentage: 0, withheldAmount: 0,
      paymentRemarks: `Stripe: ${input.stripePaymentIntentId}`,
      remainingCollectedType: 51, remainingCollected: 0,
    });
    return { ok: true, documentId: doc.id ?? doc.documentSerial, documentNumber: doc.documentNumber };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
