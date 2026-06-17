"use client";

import { useEffect, useState } from "react";
import { getOrAssignHeadlineVariant, type HeadlineVariant } from "@/lib/aed/ab-variant";
import { trackEvent } from "@/lib/aed/analytics-client";

const COPY: Record<HeadlineVariant, { line1: string; accent: string; line2: string }> = {
  a: { line1: "เครื่องกระตุกหัวใจไฟฟ้า", accent: "Amoul i7 · PRIMEDIC", line2: "2 แบรนด์ให้เลือก" },
  b: { line1: "ช่วยชีวิตได้ใน 7 วินาที", accent: "Amoul i7 · PRIMEDIC", line2: "พร้อมใช้ทันที" },
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
