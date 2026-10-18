// ─── Active promotions ────────────────────────────────────────────────────────
// Owner-driven marketing offers shown across the AED pages. Centralised here so
// copy/dates are edited in one place (the homepage, /aed/primedic and
// /aed/packages all read from this file).
//
// NOTE(owner): the survivor reward is a confidence/trust offer — JIA CPR rewards
// ฿10,000 when one of our AEDs is used in a real rescue and the patient survives.
// Conditions are confirmed case-by-case via LINE.

export type Promotion = {
  id: string;
  badge: string; // short chip label
  title: string;
  subtitle: string;
  points: string[];
  conditionNote: string;
};

// Training on a purchase comes with the Safety Premium package only (owner, Oct
// 2026): a machine bought on its own ships without a course — quotations for a
// bare unit carry none — and on-site training is added for a fee. FAQs, pages
// and both bots quote these strings so the offer reads the same everywhere.
// (Managed-rental training is per subscription tier instead, see ./subscription.ts.)
export const PACKAGE_TRAINING_PERK = "Mini Course CPR & AED 5–7 ท่าน (2 ชม.) สอนถึงที่ในกรุงเทพฯ";
export const TRAINING_POLICY = `แพ็ก Safety Premium รวม${PACKAGE_TRAINING_PERK} · ซื้อเครื่องเดี่ยวไม่รวมคอร์ส (เพิ่มคอร์สอบรมได้ สอบถามทีมขาย)`;

// "รอดแล้วให้ ฿10,000" — the headline trust offer.
export const survivorReward: Promotion = {
  id: "survivor-10k",
  badge: "🎉 โปรพิเศษ",
  title: "ช่วยชีวิตได้จริง รับ ฿10,000",
  subtitle:
    "เรามั่นใจในเครื่องและการอบรมของเรา — ถ้าใช้ AED ของ JIA CPR ช่วยชีวิตคนได้สำเร็จ (ผู้ป่วยรอดชีวิต) เรามอบเงิน ฿10,000 ร่วมยินดีกับทุกชีวิตที่รอด",
  points: [
    `แพ็ก Safety Premium มาพร้อม${PACKAGE_TRAINING_PERK} ฟรี`,
    "ทีมงานพร้อมให้คำปรึกษาและดูแลหลังการขายตลอดอายุการใช้งาน",
    "ยืนยันเหตุการณ์และการใช้งานจริงผ่าน LINE — รับเงินรางวัล ฿10,000",
  ],
  conditionNote:
    "เงื่อนไขเป็นไปตามที่บริษัทกำหนด · ต้องเป็นการใช้งานจริงในเหตุฉุกเฉินและยืนยันได้ · สอบถามรายละเอียดทาง LINE",
};
