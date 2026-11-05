// Audit explicit offline conversion upload attempts, not raw enquiries.
// Browser Lead Form Submit is a separate WEBPAGE action and has no row in this
// server upload log. Absence of an offline upload for a raw lead is intentional.
// Historical log rows may include raw leads from the old automatic uploader;
// this audit checks delivery status only, not whether an outcome qualified.
import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_DAYS = 30;

export type ConversionLogRow = { status: string };

export type ConversionAuditResult = {
  totalUploads: number;
  sentUploads: number;
  unsentUploads: number;
  statusBreakdown: Record<string, number>;
};

/** Summarize attempted offline outcomes; a sent row is API acceptance, not attribution. */
export function auditConversions(logs: ConversionLogRow[]): ConversionAuditResult {
  const statusBreakdown: Record<string, number> = {};
  for (const log of logs) {
    statusBreakdown[log.status] = (statusBreakdown[log.status] ?? 0) + 1;
  }
  const sentUploads = statusBreakdown.sent ?? 0;
  return {
    totalUploads: logs.length,
    sentUploads,
    unsentUploads: logs.length - sentUploads,
    statusBreakdown,
  };
}

export function isConversionAuditOk(result: ConversionAuditResult): boolean {
  // An explicit offline outcome that failed or was skipped still needs attention,
  // even if most attempts succeeded or there were no new website enquiries.
  return result.unsentUploads === 0;
}

export function formatConversionAuditReport(result: ConversionAuditResult): string {
  const ok = isConversionAuditOk(result);
  const header = result.totalUploads === 0
    ? `ℹ️ Google Ads offline (${WINDOW_DAYS} วัน): ไม่มีรายการอัปโหลดในบันทึก`
    : `${ok ? "✅" : "🚨"} Google Ads offline (${WINDOW_DAYS} วัน): ส่ง API สำเร็จ ${result.sentUploads}/${result.totalUploads} ครั้ง`;
  const breakdown = Object.entries(result.statusBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => `• ${status}: ${count}`);
  const advice: string[] = [];
  if ((result.statusBreakdown.skipped_no_action_id ?? 0) > 0) {
    advice.push("⚠️ ยังไม่ได้ตั้งค่า GOOGLE_ADS_CONVERSION_ACTION_ID สำหรับผลลัพธ์ออฟไลน์");
  }
  if ((result.statusBreakdown.skipped_no_creds ?? 0) > 0) {
    advice.push("⚠️ ยังไม่ได้ตั้งค่า Google Ads API ครบ (ดู docs/google-ads-setup.md)");
  }
  if (!ok) {
    advice.push("⚠️ ตรวจรายการ failed/skipped ใน aed_conversion_log ก่อนส่งผลลัพธ์ออฟไลน์ซ้ำ");
  }
  return [
    header, "", ...breakdown, ...advice, "",
    "ตรวจเฉพาะการส่งออฟไลน์ที่มีบันทึก ไม่รวม Lead Form Submit ฝั่งเบราว์เซอร์ และไม่ยืนยันว่ายอดขายทุกครั้งถูกส่งหรือ Google นับ attribution แล้ว",
  ].join("\n");
}

/** Minimal Supabase surface this module touches (injectable for tests). */
export type AuditClient = {
  from: (table: string) => {
    select: (columns: string) => {
      gte: (col: string, val: string) => PromiseLike<{
        data: unknown[] | null;
        error?: { message: string } | null;
      }>;
    };
  };
};

export async function runConversionAudit(
  client: AuditClient = createAdminClient() as unknown as AuditClient,
  windowDays = WINDOW_DAYS,
): Promise<ConversionAuditResult> {
  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();
  const { data, error } = await client
    .from("aed_conversion_log")
    .select("status")
    .gte("created_at", since);
  if (error) throw new Error(`Conversion audit query failed: ${error.message}`);
  return auditConversions((data ?? []) as ConversionLogRow[]);
}
