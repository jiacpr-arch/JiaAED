import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { articles, articleCover } from "@/lib/aed/articles";

export const metadata: Metadata = {
  title: "บทความ AED — ความรู้และวิธีใช้ | JiaAED",
  description:
    "บทความเกี่ยวกับเครื่อง AED วิธีการใช้งาน การบำรุงรักษา และมาตรฐานความปลอดภัย",
  alternates: { canonical: "/articles" },
  openGraph: {
    title: "บทความ AED — ความรู้และวิธีใช้ | JiaAED",
    description: "บทความเกี่ยวกับเครื่อง AED วิธีการใช้งาน การบำรุงรักษา และมาตรฐานความปลอดภัย",
    images: [{ url: "/images/aed-i7-poster.jpg", width: 1179, height: 1651, alt: "AED Amoul i7" }],
  },
};

export default function ArticlesIndex() {
  const sorted = [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <SiteHeader />

      <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-yellow-950 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-yellow-400/20">
            ✍️ บทความ
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">บทความความรู้เกี่ยวกับ AED</h1>
          <p className="text-gray-400 max-w-2xl">
            ความรู้พื้นฐาน วิธีใช้ การบำรุงรักษา และมาตรฐานความปลอดภัย
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-5">
          {sorted.map((a) => (
            <Link
              key={a.slug}
              href={`/articles/${a.slug}`}
              className="flex bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-yellow-400/40 rounded-xl overflow-hidden transition-colors"
            >
              <div className="relative w-28 sm:w-44 flex-shrink-0">
                <Image
                  src={articleCover(a.slug)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="176px"
                />
              </div>
              <div className="p-5 sm:p-6 min-w-0">
                <div className="flex flex-wrap gap-2 mb-2">
                  {a.tags.map((t) => (
                    <span key={t} className="text-[10px] font-semibold bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-400/20">
                      {t}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{a.title}</h2>
                <p className="text-gray-400 text-sm mb-3 leading-relaxed">{a.description}</p>
                <div className="text-xs text-gray-500 flex gap-3">
                  <span>{a.publishedAt}</span>
                  <span>·</span>
                  <span>อ่าน ~{a.readMinutes} นาที</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
