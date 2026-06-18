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

export const AMOUL_REGULATORY: BrandRegulatory = {
  brand: "Amoul i7",
  fda: "68-2-2-2-0005243",
  adLicense: "743/2569",
  published: true,
  pendingNote: "",
};

export const PRIMEDIC_REGULATORY: BrandRegulatory = {
  brand: "PRIMEDIC HeartSave",
  // อย. ครอบคลุมทั้งตระกูล HeartSave Y&YA (Y0/Y8/YA8 + แบต + แผ่น CPR) นำเข้าโดย
  // บ.ยูเวล เมดิคอล (ไทยแลนด์) — ใช้กับทั้ง PRIMEDIC Y0/Y8 และ Yuwell GPS บนเว็บ.
  // TODO(owner): ยังไม่มี ฆพ. (ใบอนุญาตโฆษณา) — เมื่อได้เลขจริงเติมที่ `adLicense`
  // แล้ว UI จะแสดง ฆพ. เพิ่มเองอัตโนมัติ (regLine + การ์ดสเปก + JSON-LD).
  fda: "65-2-2-2-0013415",
  adLicense: null,
  published: true,
  pendingNote: "อยู่ระหว่างยืนยันเลขทะเบียน — สอบถามสถานะล่าสุดทาง LINE",
  validUntil: "31 ธันวาคม 2569",
  disclaimer:
    "เครื่อง AED Yuwell/PRIMEDIC HeartSave (Y0/Y8) ขึ้นทะเบียน อย. เลขที่ 65-2-2-2-0013415 (ใช้ได้ถึง 31 ธ.ค. 2569) นำเข้าโดย บริษัท ยูเวล เมดิคอล (ไทยแลนด์) จำกัด",
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
