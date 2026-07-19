import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "ข่าวและความตระหนักเรื่องหัวใจหยุดเต้น | JiaAED",
  description:
    "ข่าวที่เกี่ยวข้องกับภาวะหัวใจหยุดเต้นเฉียบพลัน การกู้ชีพ CPR และเครื่อง AED พร้อมมุมให้ความรู้จาก JiaAED",
  alternates: { canonical: "/news" },
  openGraph: {
    title: "ข่าวและความตระหนักเรื่องหัวใจหยุดเต้น | JiaAED",
    description: "ข่าวภาวะหัวใจหยุดเต้นเฉียบพลัน การกู้ชีพ CPR และเครื่อง AED พร้อมมุมให้ความรู้จาก JiaAED",
    images: [{ url: "/images/aed-i7-poster.jpg", width: 1179, height: 1651, alt: "AED Amoul i7" }],
  },
};

type NewsRow = {
  id: string;
  source_title: string;
  source_url: string;
  source_name: string | null;
  topic: string | null;
  our_blurb: string;
  published_at: string | null;
  created_at: string;
};

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

async function getNews(): Promise<NewsRow[]> {
  // Any Supabase problem (missing env, network, query error) degrades to the
  // page's empty state instead of a 500 — news is never worth killing the page.
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("aed_news_items")
      .select("id,source_title,source_url,source_name,topic,our_blurb,published_at,created_at")
      .eq("hidden", false)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) {
      console.error("[news] query error:", error.message);
      return [];
    }
    return (data ?? []) as NewsRow[];
  } catch (e) {
    console.error("[news] failed to load:", e instanceof Error ? e.message : e);
    return [];
  }
}

export default async function NewsPage() {
  const items = await getNews();

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <SiteHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-yellow-950 py-12 px-4">
        <div className="absolute inset-0 opacity-15">
          <Image src="/images/lifestyle-cpr.png" alt="" fill className="object-cover object-center" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-yellow-400/20">
            📰 ข่าว &amp; ความตระหนัก
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">
            ข่าวเรื่องหัวใจหยุดเต้นเฉียบพลันและการกู้ชีพ
          </h1>
          <p className="text-gray-400 max-w-2xl">
            เรารวบรวมข่าวที่เกี่ยวข้องกับภาวะหัวใจหยุดเต้นเฉียบพลัน การทำ CPR และการใช้เครื่อง AED
            พร้อมมุมให้ความรู้ เพื่อสร้างความตระหนักว่าการช่วยชีวิตในนาทีแรกสำคัญแค่ไหน
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-5">
          {items.length === 0 && (
            <p className="text-gray-500 text-sm">
              ยังไม่มีข่าวในขณะนี้ — ระบบจะอัปเดตข่าวที่เกี่ยวข้องให้อัตโนมัติทุกวัน
            </p>
          )}

          {items.map((n) => (
            <article
              key={n.id}
              className="block bg-gray-900 border border-gray-800 rounded-xl p-6"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {n.topic && (
                  <span className="text-[10px] font-semibold bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-400/20">
                    {n.topic}
                  </span>
                )}
                {n.published_at && (
                  <span className="text-[10px] text-gray-500">{fmtDate(n.published_at)}</span>
                )}
              </div>

              <p className="text-white leading-relaxed mb-3">{n.our_blurb}</p>

              <div className="text-xs text-gray-500 mb-3">
                อ้างอิงข่าว: <span className="text-gray-400">{n.source_title}</span>
              </div>

              <a
                href={n.source_url}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="text-sm text-yellow-400 hover:text-yellow-300 inline-flex items-center gap-1"
              >
                อ่านข่าวต้นฉบับ{n.source_name ? ` (${n.source_name})` : ""} →
              </a>
            </article>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-10 bg-gray-900 border border-yellow-400/20 rounded-xl p-6 text-center">
          <p className="text-gray-300 mb-4">
            ทุกวินาทีมีค่าเมื่อหัวใจหยุดเต้น — การมีเครื่อง AED พร้อมใช้ในที่ทำงานหรือสถานที่สาธารณะ
            ช่วยเพิ่มโอกาสรอดได้
          </p>
          <Link
            href="/#brands"
            className="inline-block bg-yellow-400 text-gray-950 font-bold px-6 py-2.5 rounded-full hover:bg-yellow-300 transition-colors"
          >
            ดูเครื่อง AED
          </Link>
        </div>

        <p className="max-w-3xl mx-auto mt-6 text-center text-[11px] text-gray-600 leading-relaxed">
          หมายเหตุ: ข้อความสรุปเป็นมุมให้ความรู้ของ JiaAED ลิขสิทธิ์ข่าวต้นฉบับเป็นของสำนักข่าวที่อ้างอิง
          กรุณากดลิงก์เพื่ออ่านรายละเอียดจากแหล่งข่าวโดยตรง
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
