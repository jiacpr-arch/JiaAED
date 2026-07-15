"use client";

import { useEffect, useState } from "react";
import { getOrAssignHeadlineVariant, type HeadlineVariant } from "@/lib/aed/ab-variant";
import { trackEvent } from "@/lib/aed/analytics-client";

const COPY: Record<HeadlineVariant, { line1: string; accent: string; line2: string }> = {
  a: { line1: "หัวใจหยุดเต้น", accent: "Yuwell · PRIMEDIC HeartSave", line2: "ช่วยได้ก่อนรถพยาบาลมา" },
  b: { line1: "ช่วยชีวิตได้ทันที", accent: "PRIMEDIC HeartSave · Yuwell Y2", line2: "พร้อมใช้ทันที" },
};

export function HeroHeadline() {
  const [variant, setVariant] = useState<HeadlineVariant>("a");

  useEffect(() => {
    const v = getOrAssignHeadlineVariant();
    setVariant(v);
    trackEvent("hero_headline_view", { variant: v });
  }, []);

  const c = COPY[variant];
  return (
    <h1
      data-headline-variant={variant}
      className="text-4xl md:text-5xl font-black mb-4 leading-tight"
    >
      {c.line1}<br />
      {/* Split the brand accent — the Yuwell/PRIMEDIC family shows in its red casing. */}
      {c.accent.split(" · ").map((part, i) => (
        <span key={part}>
          {i > 0 && <span className="text-gray-500"> · </span>}
          <span className="text-red-400">
            {part}
          </span>
        </span>
      ))}
      <br />
      {c.line2}
    </h1>
  );
}
