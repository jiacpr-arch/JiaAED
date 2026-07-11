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

export const documents: DocumentItem[] = [
  {
    id: "user-manual-aed-i7-i9-th",
    title: "คู่มือการใช้งาน AED i7 / i9 (ภาษาไทย)",
    description:
      "คู่มือฉบับเต็มภาษาไทย — การติดตั้ง การใช้งาน การกู้ชีพ การบำรุงรักษา ข้อมูลจำเพาะ และการแก้ปัญหา (Rev.01)",
    href: "/documents/aed-i7-i9-user-manual-th.pdf",
    category: "manual",
    mime: "application/pdf",
    sizeLabel: "3.4 MB",
    language: "th",
    updatedAt: "2025-01-01",
  },
  {
    id: "aed-i7-specification-2025",
    title: "คุณลักษณะเฉพาะ AED รุ่น i7 (สำหรับ TOR/ใบเสนอราคา)",
    description:
      "เอกสารสเปคทางเทคนิคแบบละเอียดสำหรับใช้แนบใบเสนอราคา/TOR ของหน่วยงานราชการและองค์กร (Rev.2025 v1.1)",
    href: "/documents/aed-i7-specification-2025.docx",
    category: "specification",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    sizeLabel: "29 KB",
    language: "th",
    updatedAt: "2025-01-01",
  },
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
    id: "ce-mark-aed-i7-i9",
    title: "CE Mark — Declaration of Conformity",
    description:
      "Declaration of Conformity ตามมาตรฐาน Council Directive 93/42/EEC สำหรับ AED รุ่น i7 / i9 / i7 Plus / i9 Plus · EC Certificate No. 705577 (BSI Notified Body 2797)",
    href: "/documents/ce-mark-aed-i7-i9.pdf",
    category: "certificate",
    mime: "application/pdf",
    sizeLabel: "201 KB",
    language: "en",
    updatedAt: "2024-08-24",
  },
  {
    id: "iso-13485-ambulanc",
    title: "ใบรับรอง ISO 13485:2016",
    description:
      "Certificate of Registration ระบบบริหารคุณภาพเครื่องมือแพทย์ของ Ambulanc (Shenzhen) Tech. Co., Ltd. — Certificate No. MD 743586 · หมดอายุ 19 ก.ย. 2027",
    href: "/documents/iso-13485-ambulanc-exp-2027.pdf",
    category: "certificate",
    mime: "application/pdf",
    sizeLabel: "866 KB",
    language: "en",
    updatedAt: "2024-07-25",
  },
  {
    id: "en-1789-test-report-i7-i9",
    title: "EN 1789:2020 Test Report — รถพยาบาล",
    description:
      "รายงานผลทดสอบมาตรฐาน EN 1789:2020 สำหรับอุปกรณ์ที่ติดตั้งในรถพยาบาล โดย SGS-CSTC · Report No. SZES231200758104",
    href: "/documents/en-1789-aed-i7-i9.pdf",
    category: "certificate",
    mime: "application/pdf",
    sizeLabel: "1.3 MB",
    language: "en",
    updatedAt: "2024-04-24",
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
