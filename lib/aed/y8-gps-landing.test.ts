import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { VALID_PRODUCT_IDS } from "./lead-validation";
import {
  CLOUD_SCREENSHOT,
  CLOUD_SNAPSHOT,
  DASHBOARD_ACCESS_NOTE,
  Y8_GPS_PHOTOS,
  Y8_GPS_PRICE_CONDITIONS,
  Y8_GPS_SEGMENTS,
} from "./y8-gps-landing";
import { PRIMEDIC_REGULATORY } from "./regulatory";

describe("HeartSave Y8 GPS landing config", () => {
  it("snapshot counts add up and carry a date", () => {
    expect(CLOUD_SNAPSHOT.normal + CLOUD_SNAPSHOT.alert).toBe(CLOUD_SNAPSHOT.total);
    expect(CLOUD_SNAPSHOT.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("never points the dashboard at the illustrative mock-up", () => {
    expect(CLOUD_SCREENSHOT?.src).not.toBe("/images/cloud-dashboard.png");
    if (CLOUD_SCREENSHOT) {
      expect(CLOUD_SCREENSHOT.src).toMatch(/redacted/);
      expect(existsSync(join(process.cwd(), "public", CLOUD_SCREENSHOT.src))).toBe(true);
    }
  });

  it("product photos exist", () => {
    for (const p of Object.values(Y8_GPS_PHOTOS)) {
      expect(existsSync(join(process.cwd(), "public", p.src))).toBe(true);
    }
  });

  it("price line states VAT and that the quote/contract decides", () => {
    expect(Y8_GPS_PRICE_CONDITIONS).toContain("ไม่รวม VAT");
    expect(Y8_GPS_PRICE_CONDITIONS).toContain("เงินประกัน");
    expect(Y8_GPS_PRICE_CONDITIONS).toContain("สัญญา");
  });

  it("lead sources fit the API and product id is accepted", () => {
    for (const s of Object.values(Y8_GPS_SEGMENTS)) {
      expect(s.source.length).toBeLessThanOrEqual(30); // aed_leads.source is clipped at 30
      expect(VALID_PRODUCT_IDS.has(s.productId)).toBe(true);
    }
    expect(Y8_GPS_SEGMENTS.rent.source).not.toBe(Y8_GPS_SEGMENTS.org.source);
  });

  it("dashboard access is tied to the tier that includes it", () => {
    expect(DASHBOARD_ACCESS_NOTE).toContain("ELITE");
  });

  it("a ฆพ. licence naming Y8 exists for the footnote", () => {
    expect(PRIMEDIC_REGULATORY.adLicenses.some((l) => /Y8/.test(l.covers))).toBe(true);
  });
});
