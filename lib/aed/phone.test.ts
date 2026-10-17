import { describe, expect, it } from "vitest";
import { phoneE164Digits } from "./phone";

describe("phoneE164Digits", () => {
  it.each([
    ["0812345678", "66812345678"],
    ["081-234-5678", "66812345678"],
    ["+66 81 234 5678", "66812345678"],
    ["+66 081 234 5678", "66812345678"],
    ["0066812345678", "66812345678"],
    ["66812345678", "66812345678"],
    ["812345678", "66812345678"],
    ["02-123-4567", "6621234567"],
    ["(02) 123 4567", "6621234567"],
    ["0661234567", "66661234567"],
    ["+1 415 555 0100", "14155550100"],
  ])("%s → %s", (input, expected) => {
    expect(phoneE164Digits(input)).toBe(expected);
  });

  it("rejects things that can't be a phone number", () => {
    expect(phoneE164Digits("")).toBeNull();
    expect(phoneE164Digits("12345")).toBeNull();
    expect(phoneE164Digits("08123456789012")).toBeNull();
  });
});
