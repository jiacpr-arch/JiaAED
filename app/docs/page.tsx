import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import {
  documents,
  documentCategoryLabel,
  documentCategoryIcon,
  type DocumentItem,
} from "@/lib/aed/documents";

export const metadata: Metadata = {
  title: "เอกสารดาวน์โหลด — คู่มือ สเปค ใบรับรอง | JiaAED",
  description:
    "ดาวน์โหลดคู่มือการใช้งาน AED Amoul i7 ภาษาไทย, สเปคทางเทคนิคสำหรับ TOR/ใบเสนอราคา, ใบรับรอง CE Mark, ISO 13485 และ EN 1789:2020",
  alternates: { canonical: "/docs" },
  openGraph: {
    title: "เอกสารดาวน์โหลด — คู่มือ สเปค ใบรับรอง | JiaAED",
    description: "ดาวน์โหลดคู่มือการใช้งาน AED, สเปคสำหรับ TOR/ใบเสนอราคา และใบรับรองมาตรฐาน",
    images: [{ url: "/images/aed-i7-poster.jpg", width: 1179, height: 1651, alt: "AED Amoul i7" }],
  },
};

const ORDER: DocumentItem["category"][] = [
  "manual",
  "specification",
  "brochure",
  "certificate",
  "other",
];

function group(): Record<DocumentItem["category"], DocumentItem[]> {
  const out = {} as Record<DocumentItem["category"], DocumentItem[]>;
  for (const c of ORDER) out[c] = [];
  for (const d of documents) out[d.category].push(d);
  return out;
}

function fileTypeLabel(mime: DocumentItem["mime"]): string {
  if (mime === "application/pdf") return "PDF";
  return "DOCX";
}

export default function DocsPage() {
  const grouped = group();

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <SiteHeader />

      <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-yellow-950 py-12 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_220px] gap-8 items-center">
          <div>
            <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-yellow-400/20">
              📚 Document Center
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-3">เอกสารดาวน์โหลด</h1>
            <p className="text-gray-400 max-w-2xl">
              คู่มือการใช้งาน คุณลักษณะเฉพาะ (TOR-ready) และใบรับรองมาตรฐานของ AED Amoul i7 — สำหรับใช้งานจริง การจัดซื้อภาครัฐ หรือแนบใบเสนอราคา
            </p>
          </div>
          <div className="hidden md:block rounded-2xl overflow-hidden border border-gray-800 bg-white">
            <Image
              src="/images/product-main.png"
              alt="เครื่อง AED Amoul i7"
              width={440}
              height={440}
              className="w-full h-auto"
            />
          </div>
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
                    data-doc-download={d.id}
                    data-doc-category={d.category}
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

      <SiteFooter />
    </div>
  );
}
