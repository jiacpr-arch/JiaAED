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
        <div className="cookie-consent-shell">
          <div className="cookie-consent-card">
            <p className="cookie-consent-label">ความเป็นส่วนตัว</p>
            <p className="cookie-consent-copy">
              เราใช้คุกกี้เพื่อวิเคราะห์การใช้งานและปรับปรุงประสบการณ์ของคุณ
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
