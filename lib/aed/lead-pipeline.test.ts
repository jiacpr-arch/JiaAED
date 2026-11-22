import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  STAGE_SIGNALS,
  formatOutcome,
  stageEventId,
  FUNNEL,
  LEAD_STATUSES,
  campaignKey,
  conversionActionFor,
  conversionOrderId,
  funnelBy,
  parseStatusChange,
  type LeadRow,
} from "./lead-pipeline";

describe("lead pipeline", () => {
  it("statuses match the SQL CHECK constraint", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/aed_leads_pipeline.sql"), "utf8");
    const inCheck = [...sql.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    for (const s of LEAD_STATUSES) expect(inCheck).toContain(s);
    expect(FUNNEL[0]).toBe("new");
    expect(FUNNEL).not.toContain("lost");
  });

  it("requires an amount at revenue stages and a reason when lost", () => {
    expect(parseStatusChange({ status: "contract_signed" })).toEqual({ error: "value_required" });
    expect(parseStatusChange({ status: "payment_received", value_thb: "0" })).toEqual({ error: "value_required" });
    expect(parseStatusChange({ status: "lost" })).toEqual({ error: "lost_reason_required" });
    expect(parseStatusChange({ status: "won" })).toEqual({ error: "invalid_status" });
    expect(parseStatusChange({ status: "contract_signed", value_thb: "22000" })).toMatchObject({ status: "contract_signed", valueThb: 22000 });
    expect(parseStatusChange({ status: "lost", lost_reason: " ราคาสูง " })).toMatchObject({ lostReason: "ราคาสูง" });
  });

  it("drops a value on stages that don't carry money", () => {
    expect(parseStatusChange({ status: "contacted", value_thb: "500" })).toMatchObject({ valueThb: null });
  });

  it("never sends contract and payment to the same Google Ads action", () => {
    const env = { GOOGLE_ADS_CONVERSION_ACTION_ID: "111" };
    expect(conversionActionFor("contract_signed", env)).toBe("111");
    expect(conversionActionFor("payment_received", env)).toBeNull();
    expect(conversionActionFor("qualified_lead", env)).toBeNull();
    expect(conversionActionFor("payment_received", { ...env, GOOGLE_ADS_PAYMENT_ACTION_ID: "222" })).toBe("222");
    expect(conversionOrderId("abc", "contract_signed")).toBe("lead:abc:contract_signed");
  });

  it("counts a lead at stage N as having reached every earlier stage, and skips spam", () => {
    const row = (status: string, campaign: string | null, contract = 0, paid = 0): LeadRow => ({
      status, source: "gps_rental_form", utm_source: campaign ? "google" : null, utm_campaign: campaign,
      contract_value_thb: contract || null, paid_value_thb: paid || null,
    });
    const rows = [
      row("new", "gps_rent"),
      row("quotation_sent", "gps_rent"),
      row("payment_received", "gps_rent", 22000, 22000),
      row("lost", "gps_rent"),
      row("spam", "gps_rent"),
      row("contacted", null),
    ];
    const [rent, organic] = funnelBy(rows, campaignKey);
    expect(rent.key).toBe("google / gps_rent");
    expect(rent.leads).toBe(4);
    expect(rent.spam).toBe(1);
    expect(rent.reached).toEqual([4, 2, 2, 2, 1, 1]);
    expect(rent.paidValue).toBe(22000);
    expect(organic.key).toMatch(/ไม่มี UTM/);
  });
});

describe("follow-up signals", () => {
  it("covers qualified → payment and never names Purchase", () => {
    expect(Object.keys(STAGE_SIGNALS).sort()).toEqual(["contract_signed", "payment_received", "qualified_lead", "quotation_sent"]);
    for (const s of Object.values(STAGE_SIGNALS)) expect(s!.meta).not.toBe("Purchase");
  });

  it("stage event ids are stable per lead + stage", () => {
    expect(stageEventId("abc", "quotation_sent")).toBe("lead:abc:quotation_sent");
  });

  it("formats the outcome for the history row", () => {
    expect(formatOutcome({ ads: null, ga4: "queued", meta: "skipped_no_consent" })).toBe("ga4=queued meta=skipped_no_consent");
    expect(formatOutcome({ ads: null, ga4: null, meta: null })).toBeNull();
  });
});
