"use client";

import { useEffect, useState } from "react";
import { getOrAssignHeadlineVariant, type HeadlineVariant } from "@/lib/aed/ab-variant";
import { trackEvent } from "@/lib/aed/analytics-client";

const COPY: Record<HeadlineVariant, { line1: string; accent: string; line2: string }> = {
  a: { line1: "AED Amoul i7", accent: "เครื่องกระตุก", line2: "หัวใจไฟฟ้า" },
  b: { line1: "ช่วยชีวิตได้ใน 7 วินาที", accent: "AED Amoul i7", line2: "พร้อมใช้ทันที" },
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
      <span className="text-yellow-400">{c.accent}</span><br />
      {c.line2}
    </h1>
  );
}
