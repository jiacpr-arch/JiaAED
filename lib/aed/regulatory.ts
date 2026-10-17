// ─── Per-brand Thai medical-device registration (อย.) + advertising licence (ฆพ.) ─
// Single source of truth so the อย./ฆพ. numbers are never scattered across the UI.
// Each brand needs its OWN registration — do NOT reuse one brand's numbers for another.
//
// `published` gates every public assertion of a brand's registration number (hero
// badge, spec cards, JSON-LD identifiers, footer, and search-indexing of the
// brand's detail page). While false, the brand's products/prices still show, but
// we render `pendingNote` instead of a (fabricated) number — claiming an อย./ฆพ.
// number you don't hold is a Thai FDA/advertising violation.
//
// Copy elsewhere (FAQs, bots, articles, documents) builds its wording from the
// helpers below instead of re-typing a number or an expiry date, so flipping
// `published` or renewing a licence updates every page and both bots at once
// (catalog-consistency.test.ts guards this).

// One ฆพ. advertising licence: its number, the models it names, and its expiry.
export type AdLicense = {
  number: string; // e.g. "2475/2569" (rendered as "ฆพ.2475/2569")
  covers: string; // models the licence names, e.g. "HeartSave Y0/Y2"
  validUntil: string; // ISO "YYYY-MM-DD"
  documentHref?: string; // scan of the licence under /public, for procurement
};

export type BrandRegulatory = {
  brand: string;
  fda: string | null; // เลขที่ใบรับแจ้ง อย. (null until confirmed)
  adLicense: string | null; // primary ใบอนุญาตโฆษณา ฆพ. (null until confirmed)
  adLicenses: AdLicense[]; // every ฆพ. licence, with coverage + expiry
  published: boolean; // true => assert numbers publicly + allow indexing
  pendingNote: string; // shown while not published
  fdaValidUntil?: string; // อย. ใช้ได้ถึง, ISO "YYYY-MM-DD"
  validUntil?: string; // the same date as Thai long text (derived from fdaValidUntil)
  importer?: string; // registrant/importer named on the อย. notification
  advertiser?: string; // holder of the ฆพ. licences
  certificateHref?: string; // public copy of the อย. notification (under /public)
  disclaimer?: string; // full registration/importer statement (legal footnote)
};

const TH_MONTHS_LONG = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const TH_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

// "2026-12-31" → "31 ธ.ค. 2569" (short) / "31 ธันวาคม 2569" (long). Buddhist
// year, no Intl dependency so server and client render the same string.
export function thaiDate(iso: string, style: "short" | "long" = "short"): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = style === "long" ? TH_MONTHS_LONG : TH_MONTHS_SHORT;
  return `${d} ${months[m - 1]} ${y + 543}`;
}

// Amoul i7 — REMOVED (ก.ค. 2026). อย. สั่งระงับการโฆษณาเครื่องมือแพทย์รุ่นนี้
// (ทะเบียน อย. 68-2-2-2-0005243 · ใบโฆษณา ฆพ.743/2569) จึงถอดสินค้าและการโฆษณา
// ทั้งหมดออกจากเว็บ **ห้ามนำเลขทะเบียน/ใบโฆษณาชุดนี้กลับมาแสดงบนเว็บอีก** —
// การแสดงเลขใบโฆษณาของรุ่นที่ถูกสั่งระงับ ยังถือเป็นการโฆษณา
// รุ่นที่ขายอยู่ปัจจุบันคือ Yuwell Y2 / PRIMEDIC HeartSave ด้านล่าง

// อย. ครอบคลุมทั้งตระกูล HeartSave Y&YA (Y0/Y8/YA8 + แบต + แผ่น CPR) นำเข้าโดย
// บ.ยูเวล เมดิคอล (ไทยแลนด์) — ใช้กับทั้ง PRIMEDIC Y0/Y8 และ Yuwell GPS บนเว็บ.
//
// ฆพ. (ใบอนุญาตโฆษณา ออกให้ บ.เจี่ยรักษา จำกัด):
//   • ฆพ.2475/2569 — HeartSave Y0 + Y2 · ออก 17 ก.ค. 2569 · ใช้ได้ถึง 16 ก.ค. 2572
//   • ฆพ.287/2567  — HeartSave Y8 · ใช้ได้ถึง 21 ก.พ. 2570 (คนละใบ — ระบุไว้ใน disclaimer)
// ทั้งสองใบระบุสื่อ "เว็บไซต์ www.jia1669.com" — ดู docs/owner-fill-in-checklist.md
const PRIMEDIC_FDA = "65-2-2-2-0013415";
const PRIMEDIC_FDA_VALID_UNTIL = "2026-12-31";
const PRIMEDIC_IMPORTER = "บริษัท ยูเวล เมดิคอล (ไทยแลนด์) จำกัด";
const PRIMEDIC_ADVERTISER = "บริษัท เจี่ยรักษา จำกัด";
const PRIMEDIC_AD_LICENSES: AdLicense[] = [
  {
    number: "2475/2569",
    covers: "HeartSave Y0/Y2",
    validUntil: "2029-07-16",
    documentHref: "/documents/khop-2475-2569-y0-y2.jpg",
  },
  {
    number: "287/2567",
    covers: "HeartSave Y8",
    validUntil: "2027-02-21",
    documentHref: "/documents/khop-287-2567-y8.jpg",
  },
];

// "ฆพ.2475/2569 (HeartSave Y0/Y2) และ ฆพ.287/2567 (HeartSave Y8)". `short`
// drops the "HeartSave " prefix for tight spots (footer/badges: "(Y0/Y2)").
export function adLicensesLine(
  reg: Pick<BrandRegulatory, "adLicenses">,
  opts: { joiner?: string; short?: boolean } = {},
): string {
  const { joiner = " และ ", short = false } = opts;
  return reg.adLicenses
    .map((l) => `ฆพ.${l.number} (${short ? l.covers.replace(/^HeartSave\s+/, "") : l.covers})`)
    .join(joiner);
}

export const PRIMEDIC_REGULATORY: BrandRegulatory = {
  brand: "PRIMEDIC HeartSave",
  fda: PRIMEDIC_FDA,
  adLicense: PRIMEDIC_AD_LICENSES[0].number,
  adLicenses: PRIMEDIC_AD_LICENSES,
  published: true,
  pendingNote: "",
  fdaValidUntil: PRIMEDIC_FDA_VALID_UNTIL,
  validUntil: thaiDate(PRIMEDIC_FDA_VALID_UNTIL, "long"),
  importer: PRIMEDIC_IMPORTER,
  advertiser: PRIMEDIC_ADVERTISER,
  certificateHref: `/documents/fda-yuwell-aed-${PRIMEDIC_FDA}.pdf`,
  disclaimer: `เครื่อง AED Yuwell/PRIMEDIC HeartSave ขึ้นทะเบียน อย. เลขที่ ${PRIMEDIC_FDA} (ใช้ได้ถึง ${thaiDate(PRIMEDIC_FDA_VALID_UNTIL)}) นำเข้าโดย ${PRIMEDIC_IMPORTER} · ใบอนุญาตโฆษณา ${adLicensesLine({ adLicenses: PRIMEDIC_AD_LICENSES })} โดย ${PRIMEDIC_ADVERTISER}`,
};

// Human-readable "อย. xxx · ฆพ.yyy" line for a brand, or its pending note.
export function regLine(reg: BrandRegulatory): string {
  if (reg.published && reg.fda) {
    return reg.adLicense
      ? `อย. ${reg.fda} · ฆพ.${reg.adLicense}`
      : `อย. ${reg.fda}`;
  }
  return reg.pendingNote;
}

// "อย. 65-2-2-2-0013415 (ใช้ได้ถึง 31 ธ.ค. 2569)" — or "" while unpublished, so
// callers can drop it into running copy without leaving a dangling number.
// `prefix` replaces the leading "อย. " (e.g. "ทะเบียนเลขที่ ").
export function fdaLine(reg: BrandRegulatory, prefix = "อย. "): string {
  if (!reg.published || !reg.fda) return "";
  return reg.fdaValidUntil
    ? `${prefix}${reg.fda} (ใช้ได้ถึง ${thaiDate(reg.fdaValidUntil)})`
    : `${prefix}${reg.fda}`;
}

// The full public statement (registration + importer + ฆพ. + advertiser) for
// FAQs, bots and articles — or the pending note while unpublished.
export function regulatoryStatement(reg: BrandRegulatory): string {
  return reg.published && reg.disclaimer ? reg.disclaimer : reg.pendingNote;
}

// ─── Structured expiry dates, for the weekly license-expiry cron ──────────────
// Displaying an expired ฆพ./อย. number publicly is an advertising-law violation
// the moment it happens — see the Amoul i7 note above (its ad license was
// suspended and the product had to be pulled site-wide). Built from the same
// ISO dates the public copy renders, so the alarm can't drift from the site.

export type LicenseExpiry = {
  label: string;
  validUntil: string; // ISO "YYYY-MM-DD" — parseable, unlike BrandRegulatory.validUntil
};

// Gated by `published` like every other public assertion of these numbers —
// while unpublished, nothing is displayed, so there's nothing to alert on.
export const PRIMEDIC_LICENSE_EXPIRIES: LicenseExpiry[] = PRIMEDIC_REGULATORY.published
  ? [
      { label: `อย. ${PRIMEDIC_REGULATORY.fda}`, validUntil: PRIMEDIC_FDA_VALID_UNTIL },
      ...PRIMEDIC_AD_LICENSES.map((l) => ({
        label: `ฆพ.${l.number} (${l.covers})`,
        validUntil: l.validUntil,
      })),
    ]
  : [];
