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
};

export const AMOUL_REGULATORY: BrandRegulatory = {
  brand: "Amoul i7",
  fda: "68-2-2-2-0005243",
  adLicense: "743/2569",
  published: true,
  pendingNote: "",
};

export const PRIMEDIC_REGULATORY: BrandRegulatory = {
  brand: "PRIMEDIC HeartSave",
  // TODO(owner): paste PRIMEDIC's real อย. / ฆพ. numbers here, then flip
  // `published: true`. Until then the UI shows products + prices but NOT a number.
  fda: null,
  adLicense: null,
  published: false,
  pendingNote: "อยู่ระหว่างยืนยันเลขทะเบียน — สอบถามสถานะล่าสุดทาง LINE",
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
