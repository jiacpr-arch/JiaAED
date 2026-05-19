import Link from "next/link";
import type { Metadata } from "next";
import {
  documents,
  documentCategoryLabel,
  documentCategoryIcon,
  type DocumentItem,
} from "@/lib/aed/documents";
import { fetchUploadedDocuments } from "@/lib/aed/db-documents";

export const metadata: Metadata = {
  title: "เอกสารดาวน์โหลด — คู่มือ สเปค ใบรับรอง | JiaAED",
  description:
    "ดาวน์โหลดคู่มือการใช้งาน AED Amoul i7 ภาษาไทย, สเปคทางเทคนิคสำหรับ TOR/ใบเสนอราคา, ใบรับรอง CE Mark, ISO 13485 และ EN 1789:2020",
  alternates: { canonical: "/docs" },
};

// Re-fetch uploaded documents at most every 60s so admin uploads appear
// without a redeploy. Static built-in documents are always shown.
export const revalidate = 60;

const ORDER: DocumentItem["category"][] = [
  "manual",
  "specification",
  "brochure",
  "certificate",
  "other",
];

function group(items: DocumentItem[]): Record<DocumentItem["category"], DocumentItem[]> {
  const out = {} as Record<DocumentItem["category"], DocumentItem[]>;
  for (const c of ORDER) out[c] = [];
  for (const d of items) out[d.category].push(d);
  return out;
}

function fileTypeLabel(mime: string): string {
  if (mime === "application/pdf") return "PDF";
  if (mime.endsWith("wordprocessingml.document") || mime === "application/msword") return "DOCX";
  if (mime === "image/png") return "PNG";
  if (mime === "image/jpeg") return "JPG";
  return mime.split("/")[1]?.toUpperCase().slice(0, 6) || "FILE";
}

export default async function DocsPage() {
  const uploaded = await fetchUploadedDocuments();
  const all = [...documents, ...uploaded];
  const grouped = group(all);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">❤️</span>
            <span className="font-bold text-xl text-yellow-400">JiaAED</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-yellow-400">หน้าหลัก</Link>
            <Link href="/articles" className="text-sm text-gray-400 hover:text-yellow-400">บทความ</Link>
            <Link href="/#contact" className="text-sm text-gray-400 hover:text-yellow-400">ติดต่อ</Link>
          </div>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-yellow-950 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-yellow-400/20">
            📚 Document Center
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">เอกสารดาวน์โหลด</h1>
          <p className="text-gray-400 max-w-2xl">
            คู่มือการใช้งาน คุณลักษณะเฉพาะ (TOR-ready) และใบรับรองมาตรฐานของ AED Amoul i7 — สำหรับใช้งานจริง การจัดซื้อภาครัฐ หรือแนบใบเสนอราคา
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-10">
          {ORDER.filter((c) => grouped[c].length > 0).map((cat) => (
            <div key={cat}>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>{documentCategoryIcon[cat]}</span>
                <span>{documentCategoryLabel[cat]}</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {grouped[cat].map((d) => (
                  <a
                    key={d.id}
                    href={d.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-yellow-400/40 rounded-xl p-5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-white">{d.title}</h3>
                      <span className="shrink-0 text-[10px] font-bold bg-yellow-400/10 text-yellow-400 px-2 py-1 rounded border border-yellow-400/20">
                        {fileTypeLabel(d.mime)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3 leading-relaxed">{d.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {d.sizeLabel} · {d.language.toUpperCase()} · อัปเดต {d.updatedAt}
                      </span>
                      <span className="text-yellow-400 font-semibold">ดาวน์โหลด →</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold text-white mb-3">ต้องการเอกสารอื่นๆ?</h2>
          <p className="text-gray-400 mb-6">
            ใบรับรองเพิ่มเติม รายการอุปกรณ์เสริม หรือเอกสารสำหรับโครงการจัดซื้อ — ทีมงานยินดีจัดส่งให้
          </p>
          <Link
            href="/#contact"
            className="inline-block bg-yellow-400 text-gray-950 font-bold px-6 py-3 rounded-full hover:bg-yellow-300 transition-colors"
          >
            ติดต่อทีมงาน
          </Link>
        </div>
      </section>
    </div>
  );
}
