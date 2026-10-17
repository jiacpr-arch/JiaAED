"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { setPixelConsent } from "../openai-ads";
import { OpenAIAds } from "./OpenAIAds";
import { GoogleTags } from "./GoogleTags";
import { MetaPixel } from "./MetaPixel";
import { PostHogInit } from "./PostHogInit";
import {
  OPEN_CONSENT_SETTINGS_EVENT,
  clearTrackingData,
  readConsent,
  writeConsent,
  type ConsentChoice,
} from "@/lib/aed/consent";

/**
 * PDPA cookie-consent gate. Marketing/analytics trackers (Google tag, Meta
 * Pixel, PostHog) load ONLY after the visitor accepts — a previously saved
 * choice is honoured on later visits without re-asking. The footer's
 * "ตั้งค่าคุกกี้" link re-opens the banner; withdrawing consent clears the
 * trackers' cookies and stored ad ids and reloads so their scripts unload.
 * Server-side ad reporting (Meta CAPI, Google enhanced conversions) follows the
 * same choice via hasMarketingConsent(). Nothing loads on /admin.
 */
export function CookieConsent() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentChoice | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    setReady(true);
    const open = () => setSettingsOpen(true);
    window.addEventListener(OPEN_CONSENT_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_SETTINGS_EVENT, open);
  }, []);

  const choose = (value: ConsentChoice) => {
    const withdrawing = consent === "granted" && value === "denied";
    writeConsent(value);
    setSettingsOpen(false);
    if (value === "denied") setPixelConsent(false);
    if (withdrawing) {
      clearTrackingData();
      // Already-loaded tag scripts can't be unloaded in place.
      window.location.reload();
      return;
    }
    setConsent(value);
  };

  // Admin pages handle lead PII; keep third-party scripts off them entirely.
  if (pathname?.startsWith("/admin")) return null;

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

      {ready && (consent === null || settingsOpen) && (
        <div className="cookie-consent-shell">
          <div className="cookie-consent-card" role="dialog" aria-label="ตั้งค่าคุกกี้">
            <p className="cookie-consent-label">ความเป็นส่วนตัว</p>
            <p className="cookie-consent-copy">
              หากกด &quot;ยอมรับทั้งหมด&quot; เราจะใช้คุกกี้และเครื่องมือวัดผล/โฆษณา (เช่น Google Analytics/Ads, Meta และ
              PostHog) เพื่อวัดการเข้าชมและผลโฆษณา และแจ้งการกดติดต่อ/การส่งฟอร์มให้แพลตฟอร์มโฆษณา
              (ข้อมูลติดต่อถูกเข้ารหัสแบบ hash ก่อนส่ง) หากเลือก &quot;ใช้เท่าที่จำเป็น&quot; จะไม่มีการส่งข้อมูลเหล่านี้
              เปลี่ยนใจได้ทุกเมื่อจากลิงก์ &quot;ตั้งค่าคุกกี้&quot; ด้านล่างของหน้า อ่านรายละเอียดใน{" "}
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
