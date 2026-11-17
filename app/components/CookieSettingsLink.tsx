"use client";

/** Footer link that re-opens the shared cookie settings so consent can be changed or withdrawn. */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => (window as Window & { JiaConsent?: { open: () => void } }).JiaConsent?.open()}
    >
      ตั้งค่าคุกกี้
    </button>
  );
}
