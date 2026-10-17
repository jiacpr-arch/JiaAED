import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "./system-prompt";
import { MAX_QUOTE_QUANTITY, QUOTABLE_PRODUCT_IDS } from "./pricing";
import { getRecentMessages } from "./db-queries";
import {
  handleGetCustomerInfo,
  handleUpdateCustomerInfo,
  handleCalculatePrice,
  handleCreateQuotation,
  handleEscalateToHuman,
  handleScheduleFollowup,
  type ToolContext,
} from "./tool-handlers";
import type { AiToolCall } from "./types";

// ─── Tool definitions (Claude function calling) ───────────────────────────────

const AED_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_customer_info",
    description: "ดูข้อมูลลูกค้าที่บันทึกไว้แล้ว (ชื่อ เบอร์ บริษัท ประวัติการสั่งซื้อ)",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "update_customer_info",
    description: "บันทึก/อัปเดตข้อมูลลูกค้า เมื่อลูกค้าบอกชื่อ เบอร์ บริษัท หรือเลขผู้เสียภาษี",
    input_schema: {
      type: "object" as const,
      properties: {
        full_name: { type: "string", description: "ชื่อ-นามสกุล" },
        phone: { type: "string", description: "เบอร์โทรศัพท์" },
        email: { type: "string", description: "อีเมล" },
        company_name: { type: "string", description: "ชื่อบริษัท/หน่วยงาน" },
        tax_id: { type: "string", description: "เลขประจำตัวผู้เสียภาษี 13 หลัก" },
        address: { type: "string", description: "ที่อยู่จัดส่ง" },
        customer_type: { type: "string", enum: ["individual", "corporate", "government"] },
      },
      required: [],
    },
  },
  {
    name: "calculate_price",
    description: "คำนวณราคา + VAT ตามสินค้า จำนวน และประเภทลูกค้า",
    input_schema: {
      type: "object" as const,
      properties: {
        product_id: { type: "string", enum: QUOTABLE_PRODUCT_IDS, description: "รหัสสินค้า" },
        quantity: { type: "integer", minimum: 1, maximum: MAX_QUOTE_QUANTITY, description: "จำนวนเครื่อง" },
        customer_type: { type: "string", enum: ["individual", "corporate", "government"] },
      },
      required: ["product_id", "quantity"],
    },
  },
  {
    name: "create_quotation",
    description: "สร้างใบเสนอราคาใน FlowAccount และบันทึก deal ในระบบ ต้องมีชื่อลูกค้าก่อนเรียก",
    input_schema: {
      type: "object" as const,
      properties: {
        product_id: { type: "string", enum: QUOTABLE_PRODUCT_IDS },
        quantity: { type: "integer", minimum: 1, maximum: MAX_QUOTE_QUANTITY },
        unit_price: { type: "number", description: "ราคาต่อเครื่อง (ไม่รวม VAT)" },
        customer_name: { type: "string", description: "ชื่อ-นามสกุลหรือชื่อบริษัท" },
        customer_phone: { type: "string" },
        customer_email: { type: "string" },
        company_name: { type: "string" },
        tax_id: { type: "string" },
        notes: { type: "string" },
      },
      required: ["product_id", "quantity", "unit_price", "customer_name"],
    },
  },
  {
    name: "escalate_to_human",
    description: "ส่งแจ้งเตือนเจ้าของทาง LINE เมื่อ: สั่ง ≥5 เครื่อง, ต้องการราคาพิเศษ, ภาครัฐ/โรงพยาบาล, ขอเจอตัว",
    input_schema: {
      type: "object" as const,
      properties: {
        reason: { type: "string", description: "เหตุผลที่ต้อง escalate" },
        urgency: { type: "string", enum: ["high", "medium", "low"] },
        summary: { type: "string", description: "สรุปสิ่งที่ลูกค้าต้องการ" },
      },
      required: ["reason", "urgency", "summary"],
    },
  },
  {
    name: "schedule_followup",
    description: "ตั้ง follow-up อัตโนมัติ เช่น หลังส่งใบเสนอราคา ให้ follow +1 วัน",
    input_schema: {
      type: "object" as const,
      properties: {
        days_later: { type: "number", description: "กี่วันหลังจากนี้" },
        message_template: { type: "string", description: "ข้อความที่จะส่ง" },
      },
      required: ["days_later", "message_template"],
    },
  },
];

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export interface OrchestratorResult {
  reply: string;
  toolsUsed: AiToolCall[];
  /**
   * Set when the turn ended without the model's own answer: what went wrong
   * and what did or didn't run, for the owner's alert. `reply` is then a
   * holding message and the owner has to follow up by hand.
   */
  incomplete?: string;
}

// Stop starting new model calls after this long, so the turn always ends with
// a reply inside the webhook's maxDuration instead of being killed mid-loop.
const TURN_BUDGET_MS = 150_000;
const CALL_TIMEOUT_MS = 45_000;
// Not worth starting a model call with less time than this left.
const MIN_CALL_MS = 10_000;
// Kept back from the caller's deadline for the last tool round (FlowAccount,
// LINE notify) and sending/saving the reply after the loop.
const POST_LOOP_RESERVE_MS = 50_000;
// A tool isn't started with less than this left before the caller's deadline
// (the slowest, create_quotation, can take ~45s at its upstream timeouts).
const MIN_TOOL_MS = 45_000;

// Tools that only look things up — nothing for the owner to follow up.
const READ_ONLY_TOOLS = new Set(["get_customer_info", "calculate_price"]);

// What to tell the customer when the model fails after tools already ran —
// built from what those tools did, so a quotation or escalation that went
// through isn't answered with "please try again".
export function fallbackReply(toolsUsed: AiToolCall[]): string {
  const quote = toolsUsed.find((t) => t.name === "create_quotation" && String(t.result).startsWith("สร้างใบเสนอราคาสำเร็จ"));
  if (quote) {
    const number = /เลขที่:\s*(\S+)/.exec(String(quote.result))?.[1];
    return `ออกใบเสนอราคาให้แล้วครับ${number ? ` (เลขที่ ${number})` : ""} ทีมงานจะติดต่อกลับเพื่อยืนยันรายละเอียดและการชำระเงินโดยเร็วครับ 🙏`;
  }
  if (toolsUsed.some((t) => t.name === "escalate_to_human" && String(t.result).startsWith("escalated_to_human"))) {
    return "ทีมงานได้รับเรื่องแล้วครับ จะติดต่อกลับโดยเร็วที่สุด 🙏";
  }
  return "ได้รับข้อความแล้วครับ ทีมงานจะตอบกลับโดยเร็วที่สุด 🙏";
}

export async function runAI(
  userMessage: string,
  ctx: ToolContext,
  opts: { deadline?: number } = {},
): Promise<OrchestratorResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const toolsUsed: AiToolCall[] = [];
  const startedAt = Date.now();

  // Build conversation history from DB
  const history = await getRecentMessages(ctx.conversation.id, 20);
  const messages: Anthropic.MessageParam[] = history
    .filter((m) => (m.content_text ?? "").trim().length > 0)
    .map((m) => ({
      role: m.sender_type === "customer" ? "user" : "assistant",
      content: m.content_text ?? "",
    }));

  // The webhook saves the inbound message before calling us, so it's normally
  // already the last history entry — only append it when it isn't, or the
  // model sees every customer message twice.
  const last = history[history.length - 1];
  if (!(last && last.sender_type === "customer" && last.content_text === userMessage)) {
    messages.push({ role: "user", content: userMessage });
  }

  const systemPrompt = buildSystemPrompt(ctx.customer.full_name);

  // Tool calling loop
  let iterations = 0;
  const MAX_ITERATIONS = 8;

  // Time left for model calls: this turn's own budget, and — since one webhook
  // delivery can carry several events handled back to back — the caller's
  // deadline minus what the rest of the turn still needs.
  const remainingMs = () =>
    Math.min(
      TURN_BUDGET_MS - (Date.now() - startedAt),
      opts.deadline === undefined ? Infinity : opts.deadline - Date.now() - POST_LOOP_RESERVE_MS,
    );

  // End the turn with a holding reply and tell the owner what's left to do.
  // Each tool that changed something is listed with its result, since a call
  // that ran can still have failed (e.g. "สร้างใบเสนอราคาล้มเหลว") and isn't
  // done. Lookups are left out so a long turn can't push these off the alert.
  const giveUp = (why: string): OrchestratorResult => {
    const writes = toolsUsed.filter((t) => !READ_ONLY_TOOLS.has(t.name));
    return {
      reply: fallbackReply(toolsUsed),
      toolsUsed,
      incomplete: writes.length
        ? `${why} · เรียกไปแล้ว: ${writes.map((t) => `${t.name} → ${String(t.result).slice(0, 80)}`).join(" / ")}`
        : why,
    };
  };

  // One manual retry instead of the SDK's, whose backoff can honour a
  // retry-after of up to a minute — every attempt here fits the time left.
  const createMessage = async (): Promise<Anthropic.Message> => {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      const remaining = remainingMs();
      if (remaining < MIN_CALL_MS) break;
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1_000));
      try {
        return await anthropic.messages.create(
          {
            model: "claude-sonnet-5-5",
            max_tokens: 1024,
            system: systemPrompt,
            tools: AED_TOOLS,
            messages,
          },
          { timeout: Math.min(CALL_TIMEOUT_MS, remaining), maxRetries: 0 },
        );
      } catch (err) {
        lastError = err;
        console.error(`[AED] model call failed (attempt ${attempt + 1}):`, err);
      }
    }
    throw lastError ?? new Error("no time left for a model call");
  };

  while (iterations < MAX_ITERATIONS) {
    if (remainingMs() < MIN_CALL_MS) break;
    iterations++;

    let response: Anthropic.Message;
    try {
      response = await createMessage();
    } catch (err) {
      // Nothing happened yet: let the caller's error path alert the owner.
      if (toolsUsed.length === 0) throw err;
      // Tools already ran (a quotation may exist): keep what they did, so the
      // turn is still saved and scored, and answer from their results.
      return giveUp("AI ล้มเหลวกลางคัน");
    }

    // Collect text blocks
    const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
    const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");

    // Tool calls are only run when the model stopped in order to call them —
    // after a max_tokens cut the last call's input can be truncated, and a
    // refusal isn't a request to act.
    if (toolUseBlocks.length > 0 && response.stop_reason !== "tool_use") {
      return giveUp(`AI ตอบไม่จบ (${response.stop_reason}) · ไม่ได้ทำ: ${describeTools(toolUseBlocks)}`);
    }

    if (toolUseBlocks.length === 0) {
      const reply = textBlocks.map((b) => b.text).join("").trim();
      // An empty turn (or a refusal) after tools ran must not tell the customer
      // to "try again" — that can re-issue a quotation that already went out.
      if (!reply || response.stop_reason === "refusal") {
        return giveUp(`AI ไม่ได้ให้คำตอบ (${response.stop_reason})`);
      }
      return { reply, toolsUsed };
    }

    // Add assistant response to messages
    messages.push({ role: "assistant", content: response.content });

    // Execute each tool call
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    const skipped: Anthropic.ToolUseBlock[] = [];
    for (const toolUse of toolUseBlocks) {
      // Out of time for this delivery: don't start more external calls; the
      // owner is told which ones were skipped and follows up by hand.
      if (opts.deadline !== undefined && opts.deadline - Date.now() < MIN_TOOL_MS) {
        skipped.push(toolUse);
        continue;
      }
      const result = await executeToolCall(toolUse.name, toolUse.input as Record<string, unknown>, ctx);
      toolsUsed.push({ name: toolUse.name, input: toolUse.input as Record<string, unknown>, result });
      toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: String(result) });
    }

    if (skipped.length > 0) {
      console.warn("[AED] out of time — skipped tools:", JSON.stringify(skipped.map((t) => ({ name: t.name, input: t.input }))));
      return giveUp(`หมดเวลา · ไม่ได้ทำ: ${describeTools(skipped)}`);
    }

    // Add tool results
    messages.push({ role: "user", content: toolResults });
  }

  return giveUp(iterations >= MAX_ITERATIONS ? `AI เรียก tool เกิน ${MAX_ITERATIONS} รอบ` : "หมดเวลาก่อน AI ตอบ");
}

// Tool calls as the owner reads them in an alert — the inputs carry what they
// need to finish by hand (product, quantity, customer name).
function describeTools(blocks: Anthropic.ToolUseBlock[]): string {
  return blocks.map((b) => `${b.name} ${JSON.stringify(b.input).slice(0, 300)}`).join(", ");
}

// ─── Tool dispatcher ──────────────────────────────────────────────────────────

async function executeToolCall(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  try {
    switch (name) {
      case "get_customer_info":
        return await handleGetCustomerInfo(ctx);

      case "update_customer_info":
        return await handleUpdateCustomerInfo(ctx, input as Parameters<typeof handleUpdateCustomerInfo>[1]);

      case "calculate_price":
        return await handleCalculatePrice(input as unknown as Parameters<typeof handleCalculatePrice>[0]);

      case "create_quotation":
        return await handleCreateQuotation(ctx, input as unknown as Parameters<typeof handleCreateQuotation>[1]);

      case "escalate_to_human":
        return await handleEscalateToHuman(ctx, input as unknown as Parameters<typeof handleEscalateToHuman>[1]);

      case "schedule_followup":
        return await handleScheduleFollowup(ctx, input as unknown as Parameters<typeof handleScheduleFollowup>[1]);

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    console.error(`[AED] Tool ${name} error:`, err);
    return `Tool error: ${String(err)}`;
  }
}
