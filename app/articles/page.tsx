import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { PageHero } from "@/app/components/PageHero";
import { articles, articleCover } from "@/lib/aed/articles";

export const metadata: Metadata = {
  title: "บทความ AED — ความรู้และวิธีใช้ | JiaAED",
  description:
    "บทความเกี่ยวกับเครื่อง AED วิธีการใช้งาน การบำรุงรักษา และมาตรฐานความปลอดภัย",
  alternates: { canonical: "/articles" },
  openGraph: {
    title: "บทความ AED — ความรู้และวิธีใช้ | JiaAED",
    description: "บทความเกี่ยวกับเครื่อง AED วิธีการใช้งาน การบำรุงรักษา และมาตรฐานความปลอดภัย",
    images: [{ url: "/images/primedic-y2-open.jpg", width: 1254, height: 1254, alt: "AED Yuwell Y2" }],
  },
};

export default function ArticlesIndex() {
  const sorted = [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <SiteHeader />

      <PageHero
        badge="✍️ บทความ"
        title="บทความความรู้เกี่ยวกับ AED"
        subtitle="ความรู้พื้นฐาน วิธีใช้ การบำรุงรักษา และมาตรฐานความปลอดภัย"
      />

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
