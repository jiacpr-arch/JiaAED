import { describe, it, expect } from "vitest";
import {
  auditConversions,
  leadWasReported,
  hashEmail,
  hashPhone,
  formatConversionAuditReport,
  isConversionAuditOk,
  type LeadRow,
  type ConversionLogRow,
} from "./conversion-audit";

// ads-round2 sizes CPL-based budget changes off Google Ads conversion data.
// If aed_leads and aed_conversion_log silently drift apart (a real lead never
// makes it to a 'sent' row), that budget math runs blind. This is the
// reconciliation logic that catches the drift — pin exactly what counts as
// "matched" so a bug here can't quietly report false confidence.

describe("leadWasReported", () => {
  it("matches on identical gclid", () => {
    const lead: LeadRow = { id: "1", gclid: "abc123", email: null, phone: null };
    const logs: ConversionLogRow[] = [{ status: "sent", gclid: "abc123", email_hash: null, phone_hash: null }];
    expect(leadWasReported(lead, logs)).toBe(true);
  });

  it("matches on email hash (case/whitespace-insensitive, mirrors conversion.ts)", () => {
    const lead: LeadRow = { id: "1", gclid: null, email: "  Owner@Example.com ", phone: null };
    const logs: ConversionLogRow[] = [
      { status: "sent", gclid: null, email_hash: hashEmail("owner@example.com"), phone_hash: null },
    ];
    expect(leadWasReported(lead, logs)).toBe(true);
  });

  it("matches on phone hash", () => {
    const lead: LeadRow = { id: "1", gclid: null, email: null, phone: "0909791212" };
    const logs: ConversionLogRow[] = [
      { status: "sent", gclid: null, email_hash: null, phone_hash: hashPhone("0909791212") },
    ];
    expect(leadWasReported(lead, logs)).toBe(true);
  });

  it("does not match when nothing overlaps", () => {
    const lead: LeadRow = { id: "1", gclid: "abc", email: "a@b.com", phone: "0909791212" };
    const logs: ConversionLogRow[] = [
      { status: "sent", gclid: "xyz", email_hash: hashEmail("other@b.com"), phone_hash: hashPhone("0800000000") },
    ];
    expect(leadWasReported(lead, logs)).toBe(false);
  });
});

describe("auditConversions", () => {
  it("counts a fully-reconciled window as 100%", () => {
    const leads: LeadRow[] = [{ id: "1", gclid: "g1", email: null, phone: null }];
    const logs: ConversionLogRow[] = [{ status: "sent", gclid: "g1", email_hash: null, phone_hash: null }];
    const result = auditConversions(leads, logs);
    expect(result).toMatchObject({ totalLeads: 1, matchedLeads: 1, unmatchedLeads: 0, matchRate: 1 });
  });

  it("only counts 'sent' log rows as a match — failed/skipped rows don't count", () => {
    const leads: LeadRow[] = [{ id: "1", gclid: "g1", email: null, phone: null }];
    const logs: ConversionLogRow[] = [{ status: "failed", gclid: "g1", email_hash: null, phone_hash: null }];
    const result = auditConversions(leads, logs);
    expect(result.matchedLeads).toBe(0);
    expect(result.matchRate).toBe(0);
  });

  it("treats an empty lead window as matchRate 1 (nothing to miss)", () => {
    const result = auditConversions([], [{ status: "sent", gclid: "g1", email_hash: null, phone_hash: null }]);
    expect(result.totalLeads).toBe(0);
    expect(result.matchRate).toBe(1);
  });

  it("tallies every distinct log status", () => {
    const logs: ConversionLogRow[] = [
      { status: "sent", gclid: null, email_hash: null, phone_hash: null },
      { status: "sent", gclid: null, email_hash: null, phone_hash: null },
      { status: "skipped_no_creds", gclid: null, email_hash: null, phone_hash: null },
    ];
    const result = auditConversions([], logs);
    expect(result.statusBreakdown).toEqual({ sent: 2, skipped_no_creds: 1 });
  });
});

describe("isConversionAuditOk / formatConversionAuditReport", () => {
  it("is ok at exactly the 50% threshold and above", () => {
    const result = auditConversions(
      [
        { id: "1", gclid: "g1", email: null, phone: null },
        { id: "2", gclid: "g2", email: null, phone: null },
      ],
      [{ status: "sent", gclid: "g1", email_hash: null, phone_hash: null }],
    );
    expect(result.matchRate).toBe(0.5);
    expect(isConversionAuditOk(result)).toBe(true);
  });

  it("flags below-threshold match rate as not ok, with 🚨 in the report", () => {
    const result = auditConversions(
      [
        { id: "1", gclid: "g1", email: null, phone: null },
        { id: "2", gclid: "g2", email: null, phone: null },
        { id: "3", gclid: "g3", email: null, phone: null },
      ],
      [{ status: "sent", gclid: "g1", email_hash: null, phone_hash: null }],
    );
    expect(isConversionAuditOk(result)).toBe(false);
    expect(formatConversionAuditReport(result)).toContain("🚨");
  });

  it("calls out unconfigured Google Ads creds specifically", () => {
    const result = auditConversions(
      [{ id: "1", gclid: "g1", email: null, phone: null }],
      [{ status: "skipped_no_creds", gclid: null, email_hash: null, phone_hash: null }],
    );
    const text = formatConversionAuditReport(result);
    expect(text).toContain("ยังไม่ได้ตั้งค่า Google Ads API");
  });
});
