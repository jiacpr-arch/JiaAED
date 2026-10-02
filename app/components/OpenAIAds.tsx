"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setPixelConsent, pixelPageView, trackPixelContact } from "../openai-ads";
export function OpenAIAds() {
  const path = usePathname();
  useEffect(() => {
    setPixelConsent(true);
    document.addEventListener("click", trackPixelContact, true);
    return () => {
      document.removeEventListener("click", trackPixelContact, true);
    };
  }, []);
  useEffect(() => { pixelPageView(path); }, [path]);
  return null;
}
