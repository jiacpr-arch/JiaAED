import { createAdminClient } from "@/lib/supabase/admin";

type Job = { event_id: string; lease: string };
type Result = { status: "accepted" | "failed" | "not_configured"; http: number | null };

export async function deliverRentalLine(eventId?: string): Promise<number> {
  const db = createAdminClient();
  const { data, error } = await db.rpc("aed_claim_rental_line", { p_id: eventId ?? null });
  if (error) throw new Error(`rental_line_claim_${error.code}`);
  await Promise.all(((data ?? []) as Job[]).map(async (job) => {
    let result: Result = { status: "failed", http: null };
    try {
      const { data: lead, error: readError } = await db.from("aed_leads")
        .select("full_name,phone,company_name,unit_count,message").eq("id", job.event_id).single();
      if (!readError && lead) {
        const text = [
          "🎯 คำขอราคา HeartSave Y8 GPS 4G",
          lead.message, `ชื่อ: ${lead.full_name}`, `โทร: ${lead.phone}`,
          lead.company_name && `บริษัท: ${lead.company_name}`,
          lead.unit_count && `จำนวน: ${lead.unit_count}`, `Lead ID: ${job.event_id}`,
        ].filter(Boolean).join("\n");
        result = await sendLine(job.event_id, text);
      }
    } catch {
      // A failed attempt leaves the job available for the next scheduled retry.
    }
    const { error: finishError } = await db.rpc("aed_finish_rental_line", {
      p_id: job.event_id, p_lease: job.lease, p_status: result.status, p_http: result.http,
    });
    if (finishError) throw new Error(`rental_line_finish_${finishError.code}`);
  }));
  return data?.length ?? 0;
}

async function sendLine(retryKey: string, text: string): Promise<Result> {
  const token = process.env.AED_LINE_CHANNEL_ACCESS_TOKEN;
  const recipients = [...new Set([
    process.env.AED_OWNER_LINE_USER_ID ?? "",
    ...(process.env.AED_ADMIN_LINE_USER_IDS ?? "").split(/[,\s]+/),
  ].map((id) => id.trim()).filter((id) => /^U[a-f\d]{32}$/i.test(id)))];
  if (!token || !recipients.length) return { status: "not_configured", http: null };
  const res = await fetch("https://api.line.me/v2/bot/message/multicast", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Line-Retry-Key": retryKey },
    body: JSON.stringify({ to: recipients, messages: [{ type: "text", text }] }),
    signal: AbortSignal.timeout(10_000),
  });
  const accepted = res.ok || (res.status === 409 && res.headers.has("x-line-accepted-request-id"));
  return { status: accepted ? "accepted" : "failed", http: res.status };
}
