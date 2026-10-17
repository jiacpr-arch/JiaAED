import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { renderMarkdown, safeHref } from "./markdown";

const html = (src: string) => renderToStaticMarkup(renderMarkdown(src));

describe("safeHref", () => {
  it("allows http(s), site-relative, anchors, tel and mailto", () => {
    for (const h of ["https://jiaaed.com", "http://x.co/a", "/quote", "#models", "tel:0812345678", "mailto:a@b.co"]) {
      expect(safeHref(h)).toBe(h);
    }
  });

  it("rejects script-capable and protocol-relative hrefs", () => {
    for (const h of ["javascript:alert(1)", " JavaScript:alert(1)", "data:text/html,x", "vbscript:x", "//evil.example", "evil.example"]) {
      expect(safeHref(h)).toBeNull();
    }
  });
});

describe("renderMarkdown", () => {
  it("renders numbered lines as an ordered list", () => {
    const out = html("ขั้นตอน:\n1. วิเคราะห์\n2. แนะนำให้ช็อก\n3. หัวใจกลับมาเต้น");
    expect(out).toContain("<ol");
    expect(out.match(/<li>/g)).toHaveLength(3);
    expect(out).toContain("<li>แนะนำให้ช็อก</li>");
  });

  it("keeps bullet and numbered lists separate", () => {
    const out = html("- a\n- b\n1. one\n2. two");
    expect(out).toMatch(/<ul[^>]*><li>a<\/li><li>b<\/li><\/ul><ol[^>]*><li>one<\/li><li>two<\/li><\/ol>/);
  });

  it("renders unsafe links as plain text", () => {
    const out = html("click [here](javascript:alert(1)) or [quote](/quote)");
    expect(out).not.toContain("javascript:");
    expect(out).toContain("here");
    expect(out).toContain('href="/quote"');
  });

  it("opens external links in a new tab", () => {
    expect(html("[site](https://example.com)")).toContain('target="_blank"');
  });
});
