"use client";

import { useEffect, useState } from "react";
import { setPixelConsent } from "../openai-ads";
import { OpenAIAds } from "./OpenAIAds";
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
    let saved: string | null = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* Storage is optional. */ }
    if (saved === "granted" || saved === "denied") setConsent(saved);
    setReady(true);
  }, []);

  const choose = (value: Exclude<Consent, null>) => {
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* Storage is optional. */ }
    if (value === "denied") setPixelConsent(false);
    setConsent(value);
  };

  return (
    <>
      {consent === "granted" && (
        <>
          <OpenAIAds />
          <GoogleTags />
          <MetaPixel />
          <PostHogInit />
        </>
      )}

      {ready && consent === null && (
        <div className="cookie-consent-shell">
          <div className="cookie-consent-card">
            <p className="cookie-consent-label">ความเป็นส่วนตัว</p>
            <p className="cookie-consent-copy">
              เราใช้คุกกี้และ OpenAI Pixel เพื่อวัดการเข้าชม การกดติดต่อ และการส่งคำขอสำเร็จ โดยไม่ส่งรายละเอียดฟอร์มหรือข้อมูลส่วนบุคคล
              อ่านรายละเอียดใน{" "}
              <a href="/privacy">
                นโยบายความเป็นส่วนตัว
              </a>
            </p>
            <div className="cookie-consent-actions">
              <button
                onClick={() => choose("granted")}
                className="cookie-consent-accept"
              >
                ยอมรับทั้งหมด
              </button>
              <button
                onClick={() => choose("denied")}
                className="cookie-consent-essential"
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
