import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "./system-prompt";
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
        product_id: { type: "string", enum: ["i7", "i7-cabinet", "i7-floor"], description: "รหัสสินค้า" },
        quantity: { type: "number", description: "จำนวนเครื่อง" },
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
        product_id: { type: "string", enum: ["i7", "i7-cabinet", "i7-floor"] },
        quantity: { type: "number" },
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
}

export async function runAI(
  userMessage: string,
  ctx: ToolContext,
): Promise<OrchestratorResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const toolsUsed: AiToolCall[] = [];

  // Build conversation history from DB
  const history = await getRecentMessages(ctx.conversation.id, 20);
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.sender_type === "customer" ? "user" : "assistant",
    content: m.content_text ?? "",
  }));

  // Append current user message
  messages.push({ role: "user", content: userMessage });

  const systemPrompt = buildSystemPrompt(ctx.customer.full_name);

  // Tool calling loop
  let iterations = 0;
  const MAX_ITERATIONS = 8;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      tools: AED_TOOLS,
      messages,
    });

    // Collect text blocks
    const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
    const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");

    if (response.stop_reason === "end_turn" || toolUseBlocks.length === 0) {
      const reply = textBlocks.map((b) => b.text).join("").trim();
      return { reply: reply || "ขออภัย ไม่สามารถตอบได้ในขณะนี้ กรุณาลองใหม่อีกครั้งครับ", toolsUsed };
    }

    // Add assistant response to messages
    messages.push({ role: "assistant", content: response.content });

    // Execute each tool call
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUseBlocks) {
      const result = await executeToolCall(toolUse.name, toolUse.input as Record<string, unknown>, ctx);
      toolsUsed.push({ name: toolUse.name, input: toolUse.input as Record<string, unknown>, result });
      toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: String(result) });
    }

    // Add tool results
    messages.push({ role: "user", content: toolResults });
  }

  return { reply: "ขออภัย เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้งครับ", toolsUsed };
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
