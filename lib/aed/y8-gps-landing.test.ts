import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { VALID_PRODUCT_IDS } from "./lead-validation";
import {
  CLOUD_SCREENSHOT,
  CLOUD_SNAPSHOT,
  DASHBOARD_ACCESS_NOTE,
  Y8_GPS_PHOTOS,
  Y8_GPS_FROM_MONTHLY_THB,
  Y8_GPS_PRICE_CONDITIONS,
  Y8_GPS_SEGMENTS,
} from "./y8-gps-landing";
import { PRIMEDIC_REGULATORY } from "./regulatory";
import { RENTAL_PRICES, STANDARD_MONTHLY } from "./rental-prices";

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

  it("advertised price is the STANDARD plan's monthly equivalent", () => {
    expect(Y8_GPS_FROM_MONTHLY_THB).toBe(STANDARD_MONTHLY);
    expect(Y8_GPS_FROM_MONTHLY_THB).toBe(1830);
    expect(Y8_GPS_PRICE_CONDITIONS).toContain(`฿${RENTAL_PRICES.annual.toLocaleString("en-US")}`);
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

describe("HeartSave Y8 GPS jia1669.com embed", () => {
  it("snippet frames the embed route and forwards the query string", async () => {
    const { Y8_GPS_EMBED_SNIPPET, Y8_GPS_EMBED_PATH } = await import("./y8-gps-landing");
    expect(Y8_GPS_EMBED_SNIPPET).toContain(`https://jiaaed.com${Y8_GPS_EMBED_PATH}`);
    expect(Y8_GPS_EMBED_SNIPPET).toContain("window.location.search");
    expect(Y8_GPS_EMBED_SNIPPET).toContain("e.origin");
  });

  it("only jia1669.com may frame the embed", async () => {
    const config = (await import("../../next.config")).default;
    const rules = await config.headers!();
    const embed = rules.find((r) => r.source === "/aed/heartsave-y8-gps/embed");
    expect(embed?.headers[0].value).toBe("frame-ancestors 'self' https://jia1669.com https://www.jia1669.com");
    const xfo = rules.find((r) => r.headers.some((h) => h.key === "X-Frame-Options"))!;
    const re = new RegExp(`^${xfo.source}$`);
    expect(re.test("/aed/heartsave-y8-gps/embed")).toBe(false);
    expect(re.test("/aed/heartsave-y8-gps")).toBe(true);
  });
});
