"use client";

import { useEffect, useState } from "react";
import { GoogleTags } from "./GoogleTags";
import { MetaPixel } from "./MetaPixel";
import { PostHogInit } from "./PostHogInit";

const STORAGE_KEY = "jia_cookie_consent";

type Consent = "granted" | "denied" | null;

/**
 * PDPA cookie-consent gate. Marketing/analytics trackers (Google tag, Meta
 * Pixel, PostHog) load ONLY after the visitor accepts — a previously saved
 * choice is honoured on later visits without re-asking. First-party
 * server-side capture (lead forms, ad-visit attribution) is unaffected.
 */
export function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "granted" || saved === "denied") setConsent(saved);
    setReady(true);
  }, []);

  const choose = (value: Exclude<Consent, null>) => {
    localStorage.setItem(STORAGE_KEY, value);
    setConsent(value);
  };

  return (
    <>
      {consent === "granted" && (
        <>
          <GoogleTags />
          <MetaPixel />
          <PostHogInit />
        </>
      )}

      {ready && consent === null && (
        <div className="fixed bottom-0 inset-x-0 z-[60] p-3 sm:p-4">
          <div className="max-w-3xl mx-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-4 sm:p-5">
            <p className="text-sm text-gray-300 leading-relaxed">
              🍪 เว็บไซต์นี้ใช้คุกกี้เพื่อวิเคราะห์การใช้งานและปรับปรุงการโฆษณา
              อ่านรายละเอียดใน{" "}
              <a href="/privacy" className="text-yellow-400 underline hover:text-yellow-300">
                นโยบายความเป็นส่วนตัว
              </a>
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => choose("granted")}
                className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm px-5 py-2 rounded-full"
              >
                ยอมรับทั้งหมด
              </button>
              <button
                onClick={() => choose("denied")}
                className="border border-gray-600 hover:border-gray-400 text-gray-300 text-sm px-5 py-2 rounded-full"
              >
                ใช้เท่าที่จำเป็น
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
