// ─── Supabase row types ───────────────────────────────────────────────────────

export interface AedCustomer {
  id: string;
  line_user_id: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  tax_id: string | null;
  address: string | null;
  customer_type: "individual" | "corporate" | "government";
  is_company: boolean;
  total_orders: number;
  total_lifetime_value: number;
  preferred_channel: string;
  notes: string | null;
  created_at: string;
  last_active_at: string;
}

export interface AedConversation {
  id: string;
  customer_id: string | null;
  channel: string;
  channel_thread_id: string;
  status: "active" | "idle" | "closed" | "escalated";
  current_intent: string | null;
  collected_data: Record<string, unknown>;
  lead_score: number;
  message_count: number;
  last_message_at: string;
  created_at: string;
}

export interface AedMessage {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  sender_type: "customer" | "ai";
  content_text: string | null;
  content_data: Record<string, unknown> | null;
  ai_tools_used: AiToolCall[] | null;
  created_at: string;
}

export interface AedDeal {
  id: string;
  customer_id: string | null;
  conversation_id: string | null;
  source_channel: string;
  stage: "new" | "quoted" | "negotiating" | "won" | "lost";
  product_id: string;
  quantity: number;
  unit_price: number | null;
  total_amount: number | null;
  vat_amount: number | null;
  flowaccount_quotation_id: string | null;
  flowaccount_quotation_number: string | null;
  flowaccount_receipt_id: string | null;
  stripe_payment_link_url: string | null;
  stripe_payment_intent_id: string | null;
  payment_status: "pending" | "paid" | "failed";
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  closed_at: string | null;
}

export interface AedFollowup {
  id: string;
  customer_id: string | null;
  conversation_id: string | null;
  deal_id: string | null;
  scheduled_for: string;
  message_template: string;
  status: "pending" | "sent" | "skipped";
  sent_at: string | null;
  created_at: string;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface AiToolCall {
  name: string;
  input: Record<string, unknown>;
  result: unknown;
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

export interface AedProduct {
  id: string;
  name: string;
  nameTh: string;
  description: string;
  msrp: number;
  startingPrice: number;
  bestPrice: number;
  minPrice: number;
  vatRate: number;
  faProductCode: string;
}

export interface PriceCalcResult {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  priceLevel: "standard" | "best" | "min";
  canDiscount: boolean;
}

// ─── LINE events ──────────────────────────────────────────────────────────────

export interface LineTextEvent {
  type: "message";
  replyToken: string;
  source: { userId: string; type: string };
  message: { type: "text"; text: string; id: string };
  timestamp: number;
}

export interface LineFollowEvent {
  type: "follow";
  replyToken: string;
  source: { userId: string; type: string };
  timestamp: number;
}

export type LineEvent =
  | LineTextEvent
  | LineFollowEvent
  | { type: string; source?: { userId?: string } };

// ─── Tool I/O schemas ─────────────────────────────────────────────────────────

export interface CalculatePriceInput {
  product_id: string;
  quantity: number;
  customer_type?: "individual" | "corporate" | "government";
}

export interface CreateQuotationInput {
  product_id: string;
  quantity: number;
  unit_price: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  company_name?: string;
  tax_id?: string;
  notes?: string;
}

export interface CreatePaymentLinkInput {
  deal_id: string;
  amount_thb: number;
  description?: string;
}

export interface EscalateToHumanInput {
  reason: string;
  urgency: "high" | "medium" | "low";
  summary: string;
}

export interface ScheduleFollowupInput {
  days_later: number;
  message_template: string;
}

export interface UpdateCustomerInfoInput {
  full_name?: string;
  phone?: string;
  email?: string;
  company_name?: string;
  tax_id?: string;
  address?: string;
  customer_type?: "individual" | "corporate" | "government";
}
