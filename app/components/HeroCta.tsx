"use client";

import { useEffect, useState } from "react";
import { getOrAssignHeroVariant, type HeroVariant } from "@/lib/aed/ab-variant";
import { track } from "@vercel/analytics";

const LINE_OA = "https://line.me/R/ti/p/@273fzpzs";

const COPY: Record<HeroVariant, string> = {
  a: "💬 คุยกับ AI เจี่ย — ฟรี!",
  b: "📋 ขอใบเสนอราคา ฟรี!",
};

export function HeroCta() {
  const [variant, setVariant] = useState<HeroVariant>("a");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const v = getOrAssignHeroVariant();
    setVariant(v);
    setMounted(true);
    track("hero_cta_view", { variant: v });
  }, []);

  return (
    <a
      href={LINE_OA}
      target="_blank"
      rel="noopener noreferrer"
      data-line-cta="hero"
      data-variant={mounted ? variant : "a"}
      className="bg-[#06C755] text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-[#05a847] transition-colors text-center shadow-lg"
    >
      {COPY[variant]}
    </a>
  );
}
