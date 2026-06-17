type LineMessage = Record<string, unknown>;

/**
 * Resolve the full set of admin LINE user IDs that should receive notifications.
 *
 * Recipients come from two env vars, merged and de-duplicated:
 *  - AED_OWNER_LINE_USER_ID    — the primary owner (single ID, kept for back-compat)
 *  - AED_ADMIN_LINE_USER_IDS   — extra admins (comma/space/newline separated list)
 *
 * To add another admin: grab their LINE userId (from the follow-webhook log or
 * the "✅🎉 มีคนแอด LINE จริง!" alert) and append it to AED_ADMIN_LINE_USER_IDS.
 */
function getRecipients(): string[] {
  const owner = process.env.AED_OWNER_LINE_USER_ID ?? "";
  const extra = process.env.AED_ADMIN_LINE_USER_IDS ?? "";

  const ids = [owner, ...extra.split(/[,\s]+/)]
    .map((id) => id.trim())
    .filter(Boolean);

  return [...new Set(ids)];
}

async function pushMessages(messages: LineMessage[]): Promise<void> {
  const token = process.env.AED_LINE_CHANNEL_ACCESS_TOKEN ?? "";
  const recipients = getRecipients();

  if (!token || recipients.length === 0) {
    console.warn("[AED] admin notify skipped — env vars not set");
    return;
  }

  const messagesToSend = messages.slice(0, 5);

  // One push per recipient so a single bad/blocked ID can't drop the whole batch.
  await Promise.all(
    recipients.map(async (to) => {
      const res = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ to, messages: messagesToSend }),
      });

      if (!res.ok) console.error(`[AED] admin push failed (${to.slice(0, 8)}…):`, res.status, await res.text());
    }),
  );
}

async function pushToOwner(text: string): Promise<void> {
  await pushMessages([{ type: "text", text }]);
}

function bkkNow(): string {
  return new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

function normalizeThaiPhone(phone: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("66") && digits.length >= 10) digits = "0" + digits.slice(2);
  if (digits.length < 9 || digits.length > 11) return null;
  return digits;
}

function infoRow(label: string, value: string): LineMessage {
  return {
    type: "box",
    layout: "baseline",
    spacing: "sm",
    contents: [
      { type: "text", text: label, color: "#888888", size: "sm", flex: 2 },
      { type: "text", text: value, color: "#111111", size: "sm", flex: 5, wrap: true },
    ],
  };
}

// ─── Escalation (existing — keep plain text) ───────────────────────────────────

export async function notifyEscalation(p: {
  reason: string;
  urgency: "high" | "medium" | "low";
  summary: string;
  customerName: string | null;
  lineUserId: string;
}): Promise<void> {
  const icon = { high: "🔴", medium: "🟡", low: "🟢" }[p.urgency];
  await pushToOwner(
    [
      `${icon} Escalation (${p.urgency.toUpperCase()})`,
      ``,
      `👤 ลูกค้า: ${p.customerName ?? "ไม่ทราบชื่อ"}`,
      `📋 เหตุผล: ${p.reason}`,
      `📝 สรุป: ${p.summary}`,
      `🔗 LINE ID: ${p.lineUserId}`,
      `⏰ ${bkkNow()}`,
    ].join("\n"),
  );
}

// ─── New Quotation (upgrade to Flex with Pay button) ───────────────────────────

export async function notifyNewQuotation(p: {
  customerName: string | null;
  productName: string;
  quantity: number;
  grandTotal: number;
  quotationNumber: string;
  paymentLinkUrl: string;
}): Promise<void> {
  const total = `฿${p.grandTotal.toLocaleString("th-TH")}`;

  const bubble = {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#06C755",
      paddingAll: "md",
      contents: [
        { type: "text", text: "🎉 ใบเสนอราคาใหม่", weight: "bold", size: "lg", color: "#FFFFFF" },
        { type: "text", text: p.quotationNumber, size: "xs", color: "#FFFFFFCC" },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        infoRow("👤 ลูกค้า", p.customerName ?? "ลูกค้าใหม่"),
        infoRow("📦 สินค้า", `${p.productName} × ${p.quantity} เครื่อง`),
        infoRow("💰 รวม", `${total} (รวม VAT)`),
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#06C755",
          height: "sm",
          action: { type: "uri", label: "💳 เปิดลิงก์ชำระเงิน", uri: p.paymentLinkUrl },
        },
      ],
    },
  };

  await pushMessages([{ type: "flex", altText: `🎉 ใบเสนอราคาใหม่ ${total}`, contents: bubble }]);
}

// ─── Payment Received (keep plain text) ────────────────────────────────────────

export async function notifyPaymentReceived(p: {
  customerName: string | null;
  productName: string;
  quantity: number;
  grandTotal: number;
  dealId: string;
}): Promise<void> {
  await pushToOwner(
    [
      `✅ ชำระเงินแล้ว — แพ็คของด้วยนะครับ!`,
      `👤 ${p.customerName ?? "ลูกค้า"}`,
      `📦 ${p.productName} × ${p.quantity} เครื่อง`,
      `💰 ${p.grandTotal.toLocaleString("th-TH")} บาท`,
      `🆔 ${p.dealId.slice(0, 8)}`,
    ].join("\n"),
  );
}

// ─── New Lead (upgrade to Flex with Call/Email buttons) ────────────────────────

export async function notifyNewLead(p: {
  source: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  productId: string | null;
  message: string | null;
  gclid: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  unitCount?: string | null;
}): Promise<void> {
  const adSource = p.gclid
    ? `Google Ads (gclid: ${p.gclid.slice(0, 12)}…)`
    : p.utmSource
    ? `${p.utmSource}${p.utmCampaign ? ` / ${p.utmCampaign}` : ""}`
    : "organic / direct";

  const cleanPhone = normalizeThaiPhone(p.phone);

  const rows: LineMessage[] = [
    infoRow("👤 ชื่อ", p.fullName ?? "ไม่ระบุ"),
    infoRow("📞 โทร", p.phone ?? "-"),
    infoRow("✉️ Email", p.email ?? "-"),
  ];
  if (p.company) rows.push(infoRow("🏢 บริษัท", p.company));
  if (p.productId) rows.push(infoRow("📦 รุ่น", p.productId));
  if (p.unitCount) rows.push(infoRow("🔢 จำนวนเครื่อง", p.unitCount));
  if (p.message) rows.push(infoRow("💬 ข้อความ", p.message));
  rows.push(infoRow("🌐 ที่มา", adSource));
  rows.push(infoRow("⏰ เวลา", bkkNow()));

  const actions: LineMessage[] = [];
  if (cleanPhone) {
    actions.push({
      type: "button",
      style: "primary",
      color: "#06C755",
      height: "sm",
      action: { type: "uri", label: `📞 โทร ${p.phone}`, uri: `tel:${cleanPhone}` },
    });
  }
  // No email button: LINE Flex URI actions only accept http/https/tel/line
  // schemes — a `mailto:` uri makes LINE reject the whole push with 400, so the
  // owner gets nothing. The email is shown in the body row above; the admin can
  // long-press to copy it. (Keep this in mind before adding any uri action here.)

  const bubble = {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#FFC107",
      paddingAll: "md",
      contents: [
        { type: "text", text: "🎯 Lead ใหม่", weight: "bold", size: "lg", color: "#111111" },
        { type: "text", text: p.source, size: "xs", color: "#333333" },
      ],
    },
    body: { type: "box", layout: "vertical", spacing: "sm", contents: rows },
    ...(actions.length > 0
      ? { footer: { type: "box", layout: "vertical", spacing: "sm", contents: actions } }
      : {}),
  };

  await pushMessages([
    { type: "flex", altText: `🎯 Lead ใหม่: ${p.fullName ?? "ลูกค้า"}`, contents: bubble },
  ]);
}

// ─── New LINE Follow (keep plain text) ─────────────────────────────────────────

export async function notifyNewFollow(lineUserId: string): Promise<void> {
  // This fires from the LINE follow webhook — a *confirmed* friend-add, the
  // real conversion. Make it stand out from the "clicked the LINE button"
  // hot-lead alerts so a genuine add is never lost in the noise.
  await pushToOwner(
    [
      `✅🎉 มีคนแอด LINE จริง!`,
      `ลูกค้าเพิ่มเพื่อนเรียบร้อย — รีบทักก่อนเงียบ`,
      ``,
      `🔗 LINE ID: ${lineUserId}`,
      `⏰ ${bkkNow()}`,
    ].join("\n"),
  );
}

// ─── Analytics digest + alert (plain text) ─────────────────────────────────────

export async function notifyAnalyticsDigest(text: string): Promise<void> {
  await pushToOwner(text);
}

export async function notifyAnalyticsAlert(text: string): Promise<void> {
  await pushToOwner(text);
}

export async function notifyAbandonedForm(p: {
  variant: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  productId: string | null;
  message: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  pageUrl: string | null;
  unitCount?: string | null;
}): Promise<void> {
  const lines: string[] = [`⚠️ Form ทิ้งกลางทาง (${p.variant})`];
  if (p.fullName) lines.push(`ชื่อ: ${p.fullName}`);
  const phone = normalizeThaiPhone(p.phone);
  if (phone) lines.push(`โทร: ${phone}`);
  if (p.email) lines.push(`อีเมล: ${p.email}`);
  if (p.company) lines.push(`บริษัท: ${p.company}`);
  if (p.productId) lines.push(`สนใจ: ${p.productId}`);
  if (p.unitCount) lines.push(`จำนวนเครื่อง: ${p.unitCount}`);
  if (p.message) lines.push(`ข้อความ: ${p.message.slice(0, 120)}`);
  if (p.utmSource) {
    const src = p.utmCampaign ? `${p.utmSource} / ${p.utmCampaign}` : p.utmSource;
    lines.push(`Source: ${src}`);
  }
  lines.push(`⏰ ${bkkNow()}`);
  lines.push(`💡 ลองโทร/อีเมลตามดูภายใน 1 ชม.`);
  await pushToOwner(lines.join("\n"));
}
