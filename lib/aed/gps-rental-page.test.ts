import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { VALID_PRODUCT_IDS } from "./lead-validation";
import { RENTAL_PRICES, STANDARD_MONTHLY } from "./rental-prices";
import {
  ENTERPRISE_GROUPS,
  ENTERPRISE_ITEMS,
  FROM_MONTHLY,
  GPS_LIMITS,
  GPS_RENTAL_FAQS,
  GPS_RENTAL_LEAD,
  PACKAGES,
  PRICE_NOTE,
  PRODUCT_FEATURES,
  PRODUCT_PHOTOS,
  SERVICE_ITEMS,
  TRAINING_NOTE,
} from "./gps-rental-page";

// Every visible string on the landing page that makes a claim.
const allCopy = JSON.stringify({ GPS_RENTAL_FAQS, PACKAGES, PRODUCT_FEATURES, SERVICE_ITEMS, TRAINING_NOTE, ENTERPRISE_GROUPS, ENTERPRISE_ITEMS, PRICE_NOTE });

describe("/aed/gps-rental landing content", () => {
  it("advertises the STANDARD plan price, never the unbacked ฿1,990", () => {
    expect(FROM_MONTHLY).toBe(STANDARD_MONTHLY);
    expect(allCopy).not.toMatch(/1,990|1990/);
    expect(PRICE_NOTE).toContain(`฿${RENTAL_PRICES.annual.toLocaleString("en-US")}`);
    expect(PRICE_NOTE).toContain("ไม่รวม VAT");
    expect(PRICE_NOTE).toContain("เงินประกัน");
  });

  it("shows the required GPS limitations", () => {
    expect(GPS_LIMITS.join(" ")).toMatch(/ไม่ได้ยืนยันตำแหน่งของผู้ป่วย/);
    expect(GPS_LIMITS.join(" ")).toMatch(/ไม่ใช่ระบบ GPS Tracking สดต่อเนื่อง/);
    expect(GPS_LIMITS.join(" ")).toMatch(/ไม่ได้เชื่อมกับศูนย์ 1669 อัตโนมัติ/);
  });

  it("makes none of the claims the brief forbids", () => {
    expect(allCopy).not.toMatch(/เรียลไทม์|real-?time|ตลอด 24 ชั่วโมง|ฟรีทุกแพ็กเกจ|เชื่อม(ต่อ)?กับ 1669/i);
    // No government body named as partner/endorser.
    expect(allCopy).not.toMatch(/สพฉ|สถาบันการแพทย์ฉุกเฉิน|กระทรวงสาธารณสุข|สปสช/);
  });

  it("uses only photos that exist and are this unit (no colour-screen Y2 shots)", () => {
    for (const p of PRODUCT_PHOTOS) {
      expect(existsSync(join(process.cwd(), "public", p.src))).toBe(true);
      expect(p.src).not.toMatch(/y2|primedic-y8\.png|primedic-kit/);
    }
  });

  it("covers the ten FAQ topics from the brief", () => {
    expect(GPS_RENTAL_FAQS).toHaveLength(10);
  });

  it("lead source fits the API and product id is accepted", () => {
    expect(GPS_RENTAL_LEAD.source.length).toBeLessThanOrEqual(30);
    expect(VALID_PRODUCT_IDS.has(GPS_RENTAL_LEAD.productId)).toBe(true);
  });
});
