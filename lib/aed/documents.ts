export type DocumentItem = {
  id: string;
  title: string;
  description: string;
  /** Path under /public — served directly by Next.js */
  href: string;
  category: "manual" | "specification" | "certificate" | "brochure" | "other";
  mime: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  sizeLabel: string;
  language: "th" | "en" | "th-en";
  updatedAt: string;
};

// NOTE (ก.ค. 2026): เอกสารของ AED Amoul i7 (คู่มือ i7/i9, สเปค i7, ใบรับรอง CE
// 705577, ISO ของ Ambulanc, EN 1789 ของ i7/i9) ถูกถอดออกจากรายการดาวน์โหลด —
// อย. สั่งระงับการโฆษณาผลิตภัณฑ์ Amoul ทั้งหมด และใบรับรองเหล่านั้นเป็นของ Amoul
// ไม่ใช่ของ Yuwell/PRIMEDIC HeartSave จึงต้องไม่นำมาแสดงกับรุ่นปัจจุบัน.
export const documents: DocumentItem[] = [
  {
    id: "aed-y2-specification-2026",
    title: "คุณลักษณะเฉพาะ AED รุ่น Y2 (สำหรับ TOR/ใบเสนอราคา)",
    description:
      "เอกสารสเปคทางเทคนิคแบบละเอียดของ Yuwell/PRIMEDIC HeartSave Y2 (จอสี EKG) สำหรับใช้แนบใบเสนอราคา/TOR ของหน่วยงานราชการและองค์กร",
    href: "/documents/aed-y2-specification-2026.docx",
    category: "specification",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    sizeLabel: "18 KB",
    language: "th",
    updatedAt: "2026-07-11",
  },
];

export const documentCategoryLabel: Record<DocumentItem["category"], string> = {
  manual: "คู่มือการใช้งาน",
  specification: "คุณลักษณะเฉพาะ (TOR)",
  certificate: "ใบรับรอง",
  brochure: "โบรชัวร์",
  other: "อื่นๆ",
};

export const documentCategoryIcon: Record<DocumentItem["category"], string> = {
  manual: "📘",
  specification: "📋",
  certificate: "🏅",
  brochure: "📄",
  other: "📎",
};

export function findDocument(id: string): DocumentItem | undefined {
  return documents.find((d) => d.id === id);
}
