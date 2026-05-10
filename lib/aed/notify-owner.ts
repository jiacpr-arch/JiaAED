async function pushToOwner(text: string): Promise<void> {
  const token = process.env.AED_LINE_CHANNEL_ACCESS_TOKEN ?? "";
  const ownerId = process.env.AED_OWNER_LINE_USER_ID ?? "";

  if (!token || !ownerId) {
    console.warn("[AED] owner notify skipped — env vars not set");
    return;
  }

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to: ownerId, messages: [{ type: "text", text }] }),
  });

  if (!res.ok) console.error("[AED] owner push failed:", res.status, await res.text());
}

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
      `⏰ ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`,
    ].join("\n"),
  );
}

export async function notifyNewQuotation(p: {
  customerName: string | null;
  productName: string;
  quantity: number;
  grandTotal: number;
  quotationNumber: string;
  paymentLinkUrl: string;
}): Promise<void> {
  await pushToOwner(
    [
      `🎉 ใบเสนอราคาใหม่!`,
      `👤 ${p.customerName ?? "ลูกค้าใหม่"}`,
      `📦 ${p.productName} × ${p.quantity} เครื่อง`,
      `💰 ${p.grandTotal.toLocaleString("th-TH")} บาท (รวม VAT)`,
      `📋 ${p.quotationNumber}`,
      `💳 ${p.paymentLinkUrl}`,
    ].join("\n"),
  );
}

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
}): Promise<void> {
  const adSource = p.gclid
    ? `Google Ads (gclid: ${p.gclid.slice(0, 12)}…)`
    : p.utmSource
    ? `${p.utmSource}${p.utmCampaign ? ` / ${p.utmCampaign}` : ""}`
    : "organic / direct";

  await pushToOwner(
    [
      `🎯 Lead ใหม่ (${p.source})`,
      ``,
      `👤 ${p.fullName ?? "ไม่ระบุชื่อ"}`,
      `📞 ${p.phone ?? "-"}`,
      `✉️ ${p.email ?? "-"}`,
      p.company ? `🏢 ${p.company}` : null,
      p.productId ? `📦 ${p.productId}` : null,
      p.message ? `💬 ${p.message}` : null,
      `🌐 ${adSource}`,
      `⏰ ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`,
    ]
      .filter((x): x is string => !!x)
      .join("\n"),
  );
}

export async function notifyNewFollow(lineUserId: string): Promise<void> {
  await pushToOwner(
    [`👋 ลูกค้าใหม่ทัก LINE`, `ID: ${lineUserId}`, `⏰ ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`].join("\n"),
  );
}
