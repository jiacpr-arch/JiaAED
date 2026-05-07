import { createAdminClient } from "@/lib/supabase/admin";
import type { AedCustomer, AedConversation, AedMessage, AedDeal, AedFollowup, AiToolCall } from "./types";

const db = () => createAdminClient();

// ─── Customers ────────────────────────────────────────────────────────────────

export async function getOrCreateCustomerByLine(lineUserId: string): Promise<AedCustomer> {
  const supabase = db();

  const { data: existing } = await supabase
    .from("aed_customers")
    .select("*")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("aed_customers")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", existing.id);
    return existing as AedCustomer;
  }

  const { data: created, error } = await supabase
    .from("aed_customers")
    .insert({ line_user_id: lineUserId })
    .select("*")
    .single();

  if (error || !created) throw new Error(`Failed to create customer: ${error?.message}`);
  return created as AedCustomer;
}

export async function updateCustomer(
  customerId: string,
  updates: Partial<Pick<AedCustomer, "full_name" | "phone" | "email" | "company_name" | "tax_id" | "address" | "customer_type" | "is_company" | "notes">>,
): Promise<void> {
  await db().from("aed_customers").update(updates).eq("id", customerId);
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function getOrCreateConversation(
  customerId: string,
  channel: string,
  channelThreadId: string,
): Promise<AedConversation> {
  const supabase = db();

  const { data: existing } = await supabase
    .from("aed_conversations")
    .select("*")
    .eq("channel", channel)
    .eq("channel_thread_id", channelThreadId)
    .maybeSingle();

  if (existing) return existing as AedConversation;

  const { data: created, error } = await supabase
    .from("aed_conversations")
    .insert({ customer_id: customerId, channel, channel_thread_id: channelThreadId })
    .select("*")
    .single();

  if (error || !created) throw new Error(`Failed to create conversation: ${error?.message}`);
  return created as AedConversation;
}

export async function bumpConversation(conversationId: string): Promise<void> {
  const supabase = db();
  const { data } = await supabase
    .from("aed_conversations")
    .select("message_count")
    .eq("id", conversationId)
    .maybeSingle();

  await supabase
    .from("aed_conversations")
    .update({
      last_message_at: new Date().toISOString(),
      message_count: ((data?.message_count as number) ?? 0) + 1,
    })
    .eq("id", conversationId);
}

export async function updateConversationState(
  conversationId: string,
  updates: Partial<Pick<AedConversation, "status" | "current_intent" | "collected_data" | "lead_score">>,
): Promise<void> {
  await db().from("aed_conversations").update(updates).eq("id", conversationId);
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function saveMessage(
  conversationId: string,
  direction: "inbound" | "outbound",
  senderType: "customer" | "ai",
  contentText: string,
  aiToolsUsed?: AiToolCall[],
): Promise<AedMessage> {
  const { data, error } = await db()
    .from("aed_messages")
    .insert({
      conversation_id: conversationId,
      direction,
      sender_type: senderType,
      content_text: contentText,
      ai_tools_used: aiToolsUsed ?? null,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(`Failed to save message: ${error?.message}`);
  return data as AedMessage;
}

export async function getRecentMessages(conversationId: string, limit = 20): Promise<AedMessage[]> {
  const { data } = await db()
    .from("aed_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as AedMessage[]).reverse();
}

// ─── Deals ────────────────────────────────────────────────────────────────────

export async function createDeal(
  customerId: string,
  conversationId: string,
  productId: string,
  quantity: number,
  unitPrice: number,
): Promise<AedDeal> {
  const subtotal = unitPrice * quantity;
  const vatAmount = Math.round(subtotal * 0.07 * 100) / 100;

  const { data, error } = await db()
    .from("aed_deals")
    .insert({
      customer_id: customerId,
      conversation_id: conversationId,
      product_id: productId,
      quantity,
      unit_price: unitPrice,
      total_amount: subtotal + vatAmount,
      vat_amount: vatAmount,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(`Failed to create deal: ${error?.message}`);
  return data as AedDeal;
}

export async function updateDeal(
  dealId: string,
  updates: Partial<Pick<AedDeal,
    | "stage"
    | "flowaccount_quotation_id"
    | "flowaccount_quotation_number"
    | "stripe_payment_link_url"
    | "payment_status"
    | "paid_at"
    | "notes"
    | "flowaccount_receipt_id"
  >>,
): Promise<void> {
  await db().from("aed_deals").update(updates).eq("id", dealId);
}

export async function getDealById(dealId: string): Promise<AedDeal | null> {
  const { data } = await db().from("aed_deals").select("*").eq("id", dealId).maybeSingle();
  return data as AedDeal | null;
}

export async function getDealWithCustomer(
  dealId: string,
): Promise<{ deal: AedDeal; customer: AedCustomer } | null> {
  const supabase = db();
  const { data: deal } = await supabase.from("aed_deals").select("*").eq("id", dealId).maybeSingle();
  if (!deal) return null;
  const { data: customer } = await supabase
    .from("aed_customers")
    .select("*")
    .eq("id", (deal as AedDeal).customer_id ?? "")
    .maybeSingle();
  if (!customer) return null;
  return { deal: deal as AedDeal, customer: customer as AedCustomer };
}

// ─── Follow-ups ───────────────────────────────────────────────────────────────

export async function scheduleFollowup(
  customerId: string,
  conversationId: string,
  daysLater: number,
  messageTemplate: string,
  dealId?: string,
): Promise<AedFollowup> {
  const scheduledFor = new Date(Date.now() + daysLater * 86_400_000).toISOString();

  const { data, error } = await db()
    .from("aed_followups")
    .insert({ customer_id: customerId, conversation_id: conversationId, deal_id: dealId ?? null, scheduled_for: scheduledFor, message_template: messageTemplate })
    .select("*")
    .single();

  if (error || !data) throw new Error(`Failed to schedule follow-up: ${error?.message}`);
  return data as AedFollowup;
}

export async function getPendingFollowups(before: Date = new Date()): Promise<AedFollowup[]> {
  const { data } = await db()
    .from("aed_followups")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", before.toISOString())
    .order("scheduled_for", { ascending: true });
  return (data ?? []) as AedFollowup[];
}

export async function markFollowupSent(followupId: string): Promise<void> {
  await db()
    .from("aed_followups")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", followupId);
}
