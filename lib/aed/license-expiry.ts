// ─── Weekly license-expiry watchdog ────────────────────────────────────────────
// A public-facing อย./ฆพ. number that has quietly expired is an advertising-law
// violation from the moment it lapses — this already happened once for real:
// Amoul i7's ad license was suspended by Thai FDA and the product had to be
// pulled site-wide (see the comment on PRIMEDIC_REGULATORY in regulatory.ts).
// This cron reads the structured expiry dates added there (PRIMEDIC_LICENSE_
// EXPIRIES) and alerts the owner well before any of them lapse.
//
// Pure date math is separated from the cron's I/O so it's unit-testable
// without a network or DB — same split as ai-seo-health.ts / conversion-audit.ts.

const URGENT_THRESHOLD_DAYS = 60; // matches the <60-day red-flag rule already
// used by hand in docs/rental-ops-kit.md's conditional formatting

export type LicenseExpiryStatus = {
  label: string;
  validUntil: string;
  daysLeft: number;
  urgent: boolean;
};

/** Whole days from `now` to `dateISO` (negative if already past). */
export function daysUntil(dateISO: string, now: Date): number {
  const target = new Date(`${dateISO}T00:00:00Z`);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export type LicenseExpiryInput = { label: string; validUntil: string };

/** Days-left + urgency for every license, soonest-expiring first. */
export function checkLicenseExpiries(
  licenses: LicenseExpiryInput[],
  now: Date,
): LicenseExpiryStatus[] {
  return licenses
    .map((l) => {
      const daysLeft = daysUntil(l.validUntil, now);
      return { label: l.label, validUntil: l.validUntil, daysLeft, urgent: daysLeft <= URGENT_THRESHOLD_DAYS };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export function formatLicenseExpiryReport(results: LicenseExpiryStatus[]): string {
  const anyUrgent = results.some((r) => r.urgent);
  const icon = anyUrgent ? "🚨" : "✅";

  const header = anyUrgent
    ? `${icon} ใบอนุญาต อย./ฆพ.: มีใบใกล้หมดอายุ (≤${URGENT_THRESHOLD_DAYS} วัน) ${results.filter((r) => r.urgent).length} ใบ`
    : `${icon} ใบอนุญาต อย./ฆพ.: ยังไม่มีใบไหนใกล้หมดอายุ`;

  const lines = results.map((r) => {
    const daysLabel =
      r.daysLeft < 0
        ? `หมดอายุแล้ว ${Math.abs(r.daysLeft)} วัน — ถอดเลขนี้ออกจากเว็บทันที!`
        : `เหลือ ${r.daysLeft} วัน (ถึง ${r.validUntil})`;
    return `${r.urgent ? "🔴" : "✓"} ${r.label} — ${daysLabel}`;
  });

  return [header, "", ...lines].join("\n");
}
