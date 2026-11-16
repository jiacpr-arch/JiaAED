import { describe, expect, it } from "vitest";
import { RENT_BOOKING_URL, SHORT_RENTAL_MAX_DAYS, rentalKnowledgeBlock } from "./rental";
import { HOLD_MAX_RETURN_DAYS } from "./rental-holds";

describe("short-rental booking link", () => {
  it("matches the card-hold limit", () => {
    expect(SHORT_RENTAL_MAX_DAYS).toBe(HOLD_MAX_RETURN_DAYS);
  });
  it("points at JIA Rental's real-AED group and reaches the bots", () => {
    expect(RENT_BOOKING_URL).toMatch(/^https:\/\/rent\.jiacpr\.com\/.*#group-aed-device$/);
    expect(rentalKnowledgeBlock()).toContain(RENT_BOOKING_URL);
  });
});
