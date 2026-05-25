import type { GrowthConfig } from "./lib/types";

// Copy this to `growth.config.ts` in your project and fill the env vars.
// This is the ONLY file you change per brand — events, weights, copy, channels.
export const config: GrowthConfig = {
  brand: "PharmRoo",
  locale: "th-TH",
  timezone: "Asia/Bangkok",

  // Send to one or many channels. Mix LINE + Telegram freely.
  channels: [
    {
      kind: "telegram",
      botToken: process.env.GK_TELEGRAM_BOT_TOKEN ?? "",
      chatId: process.env.GK_TELEGRAM_CHAT_ID ?? "",
    },
    {
      kind: "line",
      accessToken: process.env.GK_LINE_CHANNEL_ACCESS_TOKEN ?? "",
      to: process.env.GK_LINE_OWNER_ID ?? "",
    },
  ],

  store: {
    kind: "supabase",
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    table: "growth_events",
  },

  scoring: {
    weights: {
      engaged_session: 1,
      scroll_depth_50: 1,
      scroll_depth_75: 2,
      scroll_depth_100: 1,
      price_view: 2,
      lead_form_view: 1,
      lead_form_field_focus: 1,
      lead_form_start: 3,
      line_click: 5,
    },
    triggerEvents: ["line_click", "lead_form_start", "lead_form_field_focus"],
    hotThreshold: 7,
    lookbackMinutes: 30,
  },

  digest: {
    conversionEvents: ["line_click", "lead_form_submit"],
    funnel: ["engaged_session", "price_view", "lead_form_start", "lead_form_submit"],
    minVisitsForAlert: 50,
  },

  llm: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    model: "claude-sonnet-4-5",
    maxTokens: 1024,
    systemPrompt: [
      "คุณคือนักวิเคราะห์การตลาดดิจิทัลที่ช่วยร้าน PharmRoo ดูข้อมูลแล้วแนะนำ action items",
      "",
      "กฎการตอบ:",
      "- ภาษาไทยล้วน กระชับ ตัดสินใจได้ทันที",
      "- ใส่ KPI หลัก 3-4 บรรทัด พร้อม trend",
      "- recommendation 3-5 ข้อ แยก priority: 🔴 ด่วน / 🟡 กลาง / 🟢 รอได้",
      "- แต่ละข้อ: ปัญหา + เหตุผลจาก data + วิธีแก้ที่ทำได้เลย",
      "- ห้ามใช้ markdown (แชตไม่รองรับ) ใช้ emoji + เว้นบรรทัดแทน",
      "- ความยาวรวมไม่เกิน 1500 ตัวอักษร",
      "- ถ้า data น้อยเกินไป (visits < 50) ให้บอกตรงๆ ว่ายังประเมินไม่ได้",
    ].join("\n"),
  },
};
