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

// Only documents for models we currently sell. The Amoul i7/i9 manual, spec
// sheet and CE / ISO 13485 (Ambulanc) / EN 1789 certificates were removed with
// the product (อย. suspended its advertising, ก.ค. 2026) — the web chat lists
// this catalog to customers, so nothing here may describe a withdrawn model.
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
  {
    id: "fda-yuwell-aed",
    title: "ใบรับแจ้งรายการละเอียด อย. 65-2-2-2-0013415 (Yuwell AED)",
    description:
      "ใบรับแจ้งรายการละเอียดนำเข้าเครื่องมือแพทย์จากสำนักงานคณะกรรมการอาหารและยา (อย.) — เครื่องกระตุกหัวใจไฟฟ้าชนิดอัตโนมัติ Yuwell/PRIMEDIC HeartSave นำเข้าโดย บริษัท ยูเวล เมดิคอล (ไทยแลนด์) จำกัด · ใช้ได้ถึง 31 ธ.ค. 2569",
    href: "/documents/fda-yuwell-aed-65-2-2-2-0013415.pdf",
    category: "certificate",
    mime: "application/pdf",
    sizeLabel: "242 KB",
    language: "th",
    updatedAt: "2026-07-19",
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
