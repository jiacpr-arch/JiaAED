// ─── Per-brand Thai medical-device registration (อย.) + advertising licence (ฆพ.) ─
// Single source of truth so the อย./ฆพ. numbers are never scattered across the UI.
// Each brand needs its OWN registration — do NOT reuse one brand's numbers for another.
//
// `published` gates every public assertion of a brand's registration number (hero
// badge, spec cards, JSON-LD identifiers, footer, and search-indexing of the
// brand's detail page). While false, the brand's products/prices still show, but
// we render `pendingNote` instead of a (fabricated) number — claiming an อย./ฆพ.
// number you don't hold is a Thai FDA/advertising violation.

export type BrandRegulatory = {
  brand: string;
  fda: string | null; // เลขที่ใบรับแจ้ง อย. (null until confirmed)
  adLicense: string | null; // ใบอนุญาตโฆษณา ฆพ. (null until confirmed)
  published: boolean; // true => assert numbers publicly + allow indexing
  pendingNote: string; // shown while not published
  validUntil?: string; // อย. ใช้ได้ถึง (shown on the brand's own page once published)
  disclaimer?: string; // full registration/importer statement (legal footnote)
};

// Amoul i7 — REMOVED (ก.ค. 2026). อย. สั่งระงับการโฆษณาเครื่องมือแพทย์รุ่นนี้
// (ทะเบียน อย. 68-2-2-2-0005243 · ใบโฆษณา ฆพ.743/2569) จึงถอดสินค้าและการโฆษณา
// ทั้งหมดออกจากเว็บ **ห้ามนำเลขทะเบียน/ใบโฆษณาชุดนี้กลับมาแสดงบนเว็บอีก** —
// การแสดงเลขใบโฆษณาของรุ่นที่ถูกสั่งระงับ ยังถือเป็นการโฆษณา
// รุ่นที่ขายอยู่ปัจจุบันคือ Yuwell Y2 / PRIMEDIC HeartSave ด้านล่าง

export const PRIMEDIC_REGULATORY: BrandRegulatory = {
  brand: "PRIMEDIC HeartSave",
  // อย. ครอบคลุมทั้งตระกูล HeartSave Y&YA (Y0/Y8/YA8 + แบต + แผ่น CPR) นำเข้าโดย
  // บ.ยูเวล เมดิคอล (ไทยแลนด์) — ใช้กับทั้ง PRIMEDIC Y0/Y8 และ Yuwell GPS บนเว็บ.
  //
  // ฆพ. (ใบอนุญาตโฆษณา ออกให้ บ.เจี่ยรักษา จำกัด):
  //   • ฆพ.2475/2569 — HeartSave Y0 + Y2 · ออก 17 ก.ค. 2569 · ใช้ได้ถึง 16 ก.ค. 2572
  //   • ฆพ.287/2567  — HeartSave Y8 · ใช้ได้ถึง 21 ก.พ. 2570 (คนละใบ — ระบุไว้ใน disclaimer)
  // ทั้งสองใบระบุสื่อ "เว็บไซต์ www.jia1669.com" — ดู docs/owner-fill-in-checklist.md
  fda: "65-2-2-2-0013415",
  adLicense: "2475/2569",
  published: true,
  pendingNote: "",
  validUntil: "31 ธันวาคม 2569",
  disclaimer:
    "เครื่อง AED Yuwell/PRIMEDIC HeartSave ขึ้นทะเบียน อย. เลขที่ 65-2-2-2-0013415 (ใช้ได้ถึง 31 ธ.ค. 2569) นำเข้าโดย บริษัท ยูเวล เมดิคอล (ไทยแลนด์) จำกัด · ใบอนุญาตโฆษณา ฆพ.2475/2569 (HeartSave Y0/Y2) และ ฆพ.287/2567 (HeartSave Y8) โดย บริษัท เจี่ยรักษา จำกัด",
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

// ─── Structured expiry dates, for the weekly license-expiry cron ──────────────
// BrandRegulatory.validUntil is a single free-text Thai date covering only the
// อย. registration — the two ฆพ. advertising-license expiries above (2029-07-16
// and 2027-02-21) exist only in the comment on PRIMEDIC_REGULATORY and were
// never machine-readable. Displaying an expired ฆพ./อย. number publicly is an
// advertising-law violation the moment it happens — see the Amoul i7 note above
// (its ad license was suspended and the product had to be pulled site-wide).
// This is purely additive: no existing field changes, so every consumer of
// PRIMEDIC_REGULATORY (StructuredData, SiteFooter, llms.txt, sitemap, etc.) is
// unaffected.

export type LicenseExpiry = {
  label: string;
  validUntil: string; // ISO "YYYY-MM-DD" — parseable, unlike BrandRegulatory.validUntil
};

// Gated by `published` like every other public assertion of these numbers —
// while unpublished, nothing is displayed, so there's nothing to alert on.
export const PRIMEDIC_LICENSE_EXPIRIES: LicenseExpiry[] = PRIMEDIC_REGULATORY.published
  ? [
      { label: `อย. ${PRIMEDIC_REGULATORY.fda}`, validUntil: "2026-12-31" },
      { label: "ฆพ.2475/2569 (HeartSave Y0/Y2)", validUntil: "2029-07-16" },
      { label: "ฆพ.287/2567 (HeartSave Y8)", validUntil: "2027-02-21" },
    ]
  : [];
