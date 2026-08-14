"use client";

import { useEffect, useState } from "react";
import { getOrAssignHeadlineVariant, type HeadlineVariant } from "@/lib/aed/ab-variant";
import { trackEvent } from "@/lib/aed/analytics-client";

const COPY: Record<HeadlineVariant, { line1: string; accent: string; line2: string }> = {
  a: { line1: "พร้อมช่วยชีวิต", accent: "ก่อนรถพยาบาลมา", line2: "" },
  b: { line1: "ทุกวินาทีสำคัญ", accent: "AED ที่ทุกคนใช้ได้", line2: "" },
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
      <span className="text-red-400">{c.accent}</span>
      {c.line2 && <><br />{c.line2}</>}
    </h1>
  );
}
