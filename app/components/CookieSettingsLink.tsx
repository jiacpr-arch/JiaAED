"use client";

import { OPEN_CONSENT_SETTINGS_EVENT } from "@/lib/aed/consent";

/** Footer link that re-opens the cookie banner so consent can be changed or withdrawn. */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_SETTINGS_EVENT))}
    >
      ตั้งค่าคุกกี้
    </button>
  );
}
