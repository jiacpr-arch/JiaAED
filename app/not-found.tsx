import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { LINE_OA } from "@/lib/aed/line";

// Branded 404 — before this, dead links landed on Next's bare white default
// with no nav and no way back into the site.
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-lg text-center">
          <div className="text-7xl mb-6">🔍</div>
          <p className="text-yellow-400 font-black text-6xl mb-3">404</p>
          <h1 className="text-2xl md:text-3xl font-black mb-3">ไม่พบหน้าที่คุณต้องการ</h1>
          <p className="text-gray-400 mb-8">
            หน้านี้อาจถูกย้ายหรือลบไปแล้ว — ลองกลับหน้าแรก หรือทักถามทีมงานได้เลย
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-block bg-yellow-400 text-yellow-950 font-bold px-8 py-3.5 rounded-full hover:bg-yellow-300 transition-colors"
            >
              ← กลับหน้าแรก
            </Link>
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="not_found"
              className="inline-block bg-[#06C755] text-white font-bold px-8 py-3.5 rounded-full hover:bg-[#05a847] transition-colors"
            >
              💬 ถามทีมงานทาง LINE
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-10 text-sm text-gray-500">
            <Link href="/aed/packages" className="hover:text-yellow-400 transition-colors">แพ็กเกจ AED</Link>
            <Link href="/aed/subscription" className="hover:text-yellow-400 transition-colors">เช่า AED</Link>
            <Link href="/training" className="hover:text-yellow-400 transition-colors">อบรม CPR</Link>
            <Link href="/docs" className="hover:text-yellow-400 transition-colors">เอกสาร</Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
