import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { VALID_PRODUCT_IDS } from "./lead-validation";
import {
  APP_SCREENSHOTS,
  CLOUD_DEVICE_SCREENSHOT,
  CLOUD_GALLERY,
  CLOUD_SCREENSHOT,
  CLOUD_SNAPSHOT,
  DASHBOARD_ACCESS_NOTE,
  MONITORING_LEAD,
  SELF_TEST_INTERVAL,
  monitoringSteps,
} from "./monitoring-page";

const shots = [CLOUD_SCREENSHOT, CLOUD_DEVICE_SCREENSHOT, ...CLOUD_GALLERY, ...APP_SCREENSHOTS];

describe("/aed/monitoring page config", () => {
  it("snapshot counts add up and carry a date", () => {
    expect(CLOUD_SNAPSHOT.normal + CLOUD_SNAPSHOT.alert).toBe(CLOUD_SNAPSHOT.total);
    expect(CLOUD_SNAPSHOT.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("only shows redacted screenshots, never the illustrative mock-up", () => {
    for (const shot of shots) {
      expect(shot.src).not.toBe("/images/cloud-dashboard.png");
      expect(shot.src).toMatch(/-redacted\.png$/);
      expect(existsSync(join(process.cwd(), "public", shot.src))).toBe(true);
    }
  });

  it("redacted screenshots carry no embedded metadata and match their declared size", async () => {
    for (const shot of shots) {
      const m = await sharp(join(process.cwd(), "public", shot.src)).metadata();
      expect([m.width, m.height]).toEqual([shot.width, shot.height]);
      expect(m.exif).toBeUndefined();
      expect(m.xmp).toBeUndefined();
    }
  });

  it("Self-test claim comes from the verified spec list", () => {
    expect(SELF_TEST_INTERVAL).toBe("ทุก 24 ชั่วโมง");
    expect(monitoringSteps[0].desc).toContain(SELF_TEST_INTERVAL);
  });

  it("dashboard access is tied to the tier that includes it", () => {
    expect(DASHBOARD_ACCESS_NOTE).toContain("ELITE");
  });

  it("lead source fits the API and product id is accepted", () => {
    expect(MONITORING_LEAD.source.length).toBeLessThanOrEqual(30);
    expect(VALID_PRODUCT_IDS.has(MONITORING_LEAD.productId)).toBe(true);
  });
});
