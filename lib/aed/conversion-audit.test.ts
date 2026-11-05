import { describe, it, expect, vi } from "vitest";
import {
  auditConversions,
  formatConversionAuditReport,
  isConversionAuditOk,
  runConversionAudit,
  type AuditClient,
} from "./conversion-audit";

describe("offline conversion audit", () => {
  it("does not require raw browser/chat leads to have offline uploads", async () => {
    const gte = vi.fn().mockResolvedValue({ data: [], error: null });
    const select = vi.fn(() => ({ gte }));
    const from = vi.fn((table: string) => {
      if (table !== "aed_conversion_log") throw new Error("Raw leads are not offline outcomes");
      return { select };
    });
    const result = await runConversionAudit({ from });
    expect(from).toHaveBeenCalledExactlyOnceWith("aed_conversion_log");
    expect(select).toHaveBeenCalledExactlyOnceWith("status");
    expect(result).toEqual({ totalUploads: 0, sentUploads: 0, unsentUploads: 0, statusBreakdown: {} });
    expect(isConversionAuditOk(result)).toBe(true);
    const report = formatConversionAuditReport(result);
    expect(report).toContain("ไม่มีรายการอัปโหลดในบันทึก");
    expect(report).not.toContain("🚨");
    expect(report).not.toContain("✅");
    expect(report).not.toContain("webhook");
  });

  it("summarizes accepted offline upload attempts without claiming attribution", () => {
    const result = auditConversions([{ status: "sent" }, { status: "sent" }]);
    expect(result).toEqual({ totalUploads: 2, sentUploads: 2, unsentUploads: 0, statusBreakdown: { sent: 2 } });
    expect(isConversionAuditOk(result)).toBe(true);
    const report = formatConversionAuditReport(result);
    expect(report).toContain("ส่ง API สำเร็จ 2/2 ครั้ง");
    expect(report).toContain("ไม่รวม Lead Form Submit");
    expect(report).toContain("ไม่ยืนยันว่ายอดขายทุกครั้งถูกส่งหรือ Google นับ attribution แล้ว");
  });

  it.each(["failed", "skipped_no_attribution", "skipped_no_action_id", "skipped_no_creds", "unknown"])(
    "retains an alert for an explicit offline outcome with status %s even among successful uploads",
    (status) => {
      const result = auditConversions([{ status: "sent" }, { status: "sent" }, { status }]);
      expect(result.unsentUploads).toBe(1);
      expect(isConversionAuditOk(result)).toBe(false);
      expect(formatConversionAuditReport(result)).toContain("🚨");
      expect(formatConversionAuditReport(result)).toContain(`${status}: 1`);
    },
  );

  it("names missing action and credential configuration separately", () => {
    const report = formatConversionAuditReport(auditConversions([
      { status: "skipped_no_action_id" }, { status: "skipped_no_creds" },
    ]));
    expect(report).toContain("GOOGLE_ADS_CONVERSION_ACTION_ID");
    expect(report).toContain("ยังไม่ได้ตั้งค่า Google Ads API ครบ");
  });

  it("reports query errors instead of treating unavailable logs as a healthy empty window", async () => {
    const client: AuditClient = {
      from: () => ({ select: () => ({
        gte: async () => ({ data: null, error: { message: "mock database failure" } }),
      }) }),
    };
    await expect(runConversionAudit(client)).rejects.toThrow("Conversion audit query failed");
  });
});
