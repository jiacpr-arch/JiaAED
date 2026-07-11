import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { articles, findArticle, articleCover } from "@/lib/aed/articles";
import { renderMarkdown } from "@/lib/aed/markdown";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} | JiaAED`,
    description: article.description,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt,
      tags: article.tags,
    },
  };
}

export default async function ArticlePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) notFound();

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <SiteHeader />

      <article className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/articles" className="text-sm text-yellow-400 hover:text-yellow-300 mb-6 inline-block">
            ← บทความทั้งหมด
          </Link>

          <div className="flex flex-wrap gap-2 mb-3">
            {article.tags.map((t) => (
              <span key={t} className="text-[10px] font-semibold bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-400/20">
                {t}
              </span>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-black mb-3">{article.title}</h1>
          <p className="text-lg text-gray-400 mb-3 leading-relaxed">{article.description}</p>
          <div className="text-xs text-gray-500 mb-6 flex gap-3 border-b border-gray-800 pb-6">
            <span>{article.publishedAt}</span>
            <span>·</span>
            <span>อ่าน ~{article.readMinutes} นาที</span>
          </div>

          <div className="relative w-full h-52 md:h-72 rounded-2xl overflow-hidden border border-gray-800 mb-8">
            <Image
              src={articleCover(article.slug)}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>

          <div className="article-content">{renderMarkdown(article.content)}</div>

          <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <Link href="/articles" className="text-sm text-yellow-400 hover:text-yellow-300">
              ← บทความอื่นๆ
            </Link>
            <Link
              href="/#contact"
              className="bg-yellow-400 text-gray-950 font-bold px-5 py-2.5 rounded-full hover:bg-yellow-300 transition-colors text-sm"
            >
              ขอใบเสนอราคา →
            </Link>
          </div>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
