"use client";

import { useEffect, useState } from "react";
import { getOrAssignHeroVariant, type HeroVariant } from "@/lib/aed/ab-variant";
import { trackEvent } from "@/lib/aed/analytics-client";

const LINE_OA = "https://line.me/R/oaMessage/@jiacpr/?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%88+AED+%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A";

const COPY: Record<HeroVariant, string> = {
  a: "📋 ขอใบเสนอราคา AED ใน 5 นาที",
  b: "🎁 รับส่วนลดวันนี้ ทาง LINE",
};

export function HeroCta() {
  const [variant, setVariant] = useState<HeroVariant>("a");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const v = getOrAssignHeroVariant();
    setVariant(v);
    setMounted(true);
    trackEvent("hero_cta_view", { variant: v });
  }, []);

  return (
    <a
      href={LINE_OA}
      target="_blank"
      rel="noopener noreferrer"
      data-line-cta="hero"
      data-variant={mounted ? variant : "a"}
      className="relative bg-[#06C755] text-white font-bold text-xl px-8 py-5 rounded-full hover:bg-[#05a847] transition-all hover:scale-[1.02] text-center shadow-2xl shadow-[#06C755]/40 ring-4 ring-[#06C755]/20 hover:ring-[#06C755]/40"
    >
      <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
        ตอบไว 24ชม.
      </span>
      {COPY[variant]}
    </a>
  );
}
