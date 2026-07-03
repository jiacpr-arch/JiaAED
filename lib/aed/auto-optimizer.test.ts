import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { buildNewHeroCtaFile, extractCopy } from "./auto-optimizer";
import {
  buildNewHeroHeadlineFile,
  extractHeadline,
} from "./auto-optimizer-headline";

// These functions do string surgery on real TSX source files and their output
// is committed + auto-merged to main by the optimizer crons — a corrupted
// rewrite ships straight to production. Test them against the REAL component
// files, not synthetic fixtures, so drift in the component shape fails here
// before it fails in the cron.

const heroCtaSrc = readFileSync(
  join(__dirname, "../../app/components/HeroCta.tsx"),
  "utf8",
);
const heroHeadlineSrc = readFileSync(
  join(__dirname, "../../app/components/HeroHeadline.tsx"),
  "utf8",
);

describe("HeroCta rewrite (buildNewHeroCtaFile)", () => {
  it("extractCopy finds both live variants", () => {
    expect(extractCopy(heroCtaSrc, "a").length).toBeGreaterThan(0);
    expect(extractCopy(heroCtaSrc, "b").length).toBeGreaterThan(0);
  });

  it("replaces only the loser variant line and keeps the file valid", () => {
    const oldCopy = extractCopy(heroCtaSrc, "b");
    const newCopy = "🧪 ทดสอบข้อความใหม่ ทาง LINE";
    const out = buildNewHeroCtaFile(heroCtaSrc, { loser: "b", oldCopy, newCopy });

    expect(extractCopy(out, "b")).toBe(newCopy);
    expect(extractCopy(out, "a")).toBe(extractCopy(heroCtaSrc, "a")); // untouched
    // Only the one line changed
    const diffLines = out
      .split("\n")
      .filter((l, i) => l !== heroCtaSrc.split("\n")[i]);
    expect(diffLines).toHaveLength(1);
  });

  it("throws when the old copy no longer matches (stale read)", () => {
    expect(() =>
      buildNewHeroCtaFile(heroCtaSrc, {
        loser: "a",
        oldCopy: "ข้อความที่ไม่มีอยู่จริง",
        newCopy: "ใหม่",
      }),
    ).toThrow(/Cannot find loser line/);
  });

  it("throws when the needle is ambiguous (appears twice)", () => {
    const oldCopy = extractCopy(heroCtaSrc, "a");
    const needle = `  a: ${JSON.stringify(oldCopy)},`;
    const doubled = heroCtaSrc + `\n// duplicate for ambiguity:\n${needle}\n`;
    expect(() =>
      buildNewHeroCtaFile(doubled, { loser: "a", oldCopy, newCopy: "ใหม่" }),
    ).toThrow(/Ambiguous/);
  });
});

describe("HeroHeadline rewrite (buildNewHeroHeadlineFile)", () => {
  it("extractHeadline finds both live variants", () => {
    for (const v of ["a", "b"] as const) {
      const h = extractHeadline(heroHeadlineSrc, v);
      expect(h.line1.length).toBeGreaterThan(0);
      expect(h.accent.length).toBeGreaterThan(0);
      expect(h.line2.length).toBeGreaterThan(0);
    }
  });

  it("replaces the loser block and leaves the winner untouched", () => {
    const newHeadline = {
      line1: "ทดสอบบรรทัดหนึ่ง",
      accent: "ทดสอบแบรนด์",
      line2: "ทดสอบบรรทัดสอง",
      rationale: "test",
    };
    const out = buildNewHeroHeadlineFile(heroHeadlineSrc, {
      loser: "b",
      newHeadline,
    });

    expect(extractHeadline(out, "b")).toEqual({
      line1: newHeadline.line1,
      accent: newHeadline.accent,
      line2: newHeadline.line2,
    });
    expect(extractHeadline(out, "a")).toEqual(extractHeadline(heroHeadlineSrc, "a"));
  });

  it("round-trips: rewriting with the extracted current values is a no-op", () => {
    const current = extractHeadline(heroHeadlineSrc, "a");
    const out = buildNewHeroHeadlineFile(heroHeadlineSrc, {
      loser: "a",
      newHeadline: { ...current, rationale: "noop" },
    });
    expect(out).toBe(heroHeadlineSrc);
  });

  it("throws when the variant block cannot be found", () => {
    expect(() =>
      buildNewHeroHeadlineFile("const x = 1;", {
        loser: "a",
        newHeadline: { line1: "x", accent: "y", line2: "z", rationale: "" },
      }),
    ).toThrow(/Cannot find/);
  });
});
