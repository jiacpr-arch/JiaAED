import { describe, it, expect } from "vitest";
import { isValidPhone, isValidEmail, clean, hashIp } from "./lead-validation";

describe("isValidPhone", () => {
  it("accepts a normal Thai mobile number", () => {
    expect(isValidPhone("0812345678", 8)).toBe(true);
  });

  it("accepts numbers with separators and a country code", () => {
    expect(isValidPhone("+66 81-234-5678", 8)).toBe(true);
    expect(isValidPhone("(02) 123 4567", 8)).toBe(true);
  });

  it("rejects letters and stray symbols", () => {
    expect(isValidPhone("0812abc678", 8)).toBe(false);
    expect(isValidPhone("0812345678; DROP TABLE", 8)).toBe(false);
  });

  it("enforces the route-specific minimum length", () => {
    // full lead form requires 8+, partial capture allows 6+
    expect(isValidPhone("12345", 8)).toBe(false);
    expect(isValidPhone("123456", 6)).toBe(true);
    expect(isValidPhone("12345", 6)).toBe(false);
  });

  it("rejects anything past the max length", () => {
    expect(isValidPhone("1".repeat(21), 8)).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("accepts well-formed addresses", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("first.last@example.co.th")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(isValidEmail("nope")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a b@c.com")).toBe(false);
    expect(isValidEmail("@b.com")).toBe(false);
  });
});

describe("clean", () => {
  it("trims and returns the value", () => {
    expect(clean("  hi  ")).toBe("hi");
  });

  it("returns null for blank, whitespace, or non-strings", () => {
    expect(clean("")).toBeNull();
    expect(clean("   ")).toBeNull();
    expect(clean(null)).toBeNull();
    expect(clean(undefined)).toBeNull();
    expect(clean(12345)).toBeNull();
  });

  it("caps length at the max", () => {
    expect(clean("abcdef", 3)).toBe("abc");
  });
});

describe("hashIp", () => {
  it("returns null for a null ip", () => {
    expect(hashIp(null)).toBeNull();
  });

  it("produces a stable, truncated hash for the same ip", () => {
    const a = hashIp("1.2.3.4");
    const b = hashIp("1.2.3.4");
    expect(a).toBe(b);
    expect(a).toHaveLength(32);
  });

  it("produces different hashes for different ips", () => {
    expect(hashIp("1.2.3.4")).not.toBe(hashIp("5.6.7.8"));
  });
});
