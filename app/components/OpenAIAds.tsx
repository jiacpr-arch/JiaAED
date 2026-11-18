"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setPixelConsent, pixelPageView, trackPixelContact } from "../openai-ads";
export function OpenAIAds() {
  const path = usePathname();
  useEffect(() => {
    document.addEventListener("click", trackPixelContact, true);
    return () => {
      document.removeEventListener("click", trackPixelContact, true);
    };
  }, []);
  useEffect(() => {
    setPixelConsent(true);
    pixelPageView(path);
    return () => setPixelConsent(false);
  }, [path]);
  return null;
}
