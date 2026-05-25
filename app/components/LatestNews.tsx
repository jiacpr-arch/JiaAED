import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

type NewsRow = {
  id: string;
  topic: string | null;
  our_blurb: string;
  source_url: string;
  source_name: string | null;
  published_at: string | null;
};

async function getLatest(limit: number): Promise<NewsRow[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("aed_news_items")
      .select("id,topic,our_blurb,source_url,source_name,published_at")
      .eq("hidden", false)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as NewsRow[];
  } catch {
    return [];
  }
}

/**
 * Latest curated news, for embedding on the home + ads landing pages.
 * Renders nothing until there is at least one published item, so an empty
 * feed never shows a hollow section. Pages that use this should set an ISR
 * `revalidate` so the read stays cached and fast.
 */
export async function LatestNews({
  limit = 3,
  compact = false,
}: {
  limit?: number;
  compact?: boolean;
}) {
  const items = await getLatest(limit);
  if (items.length === 0) return null;

  if (compact) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg text-white">📰 ข่าว &amp; ความตระหนัก</h2>
          <Link href="/news" className="text-xs text-yellow-400 hover:text-yellow-300">
            ดูทั้งหมด →
          </Link>
        </div>
        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n.id} className="border-b border-gray-800 last:border-0 pb-3 last:pb-0">
              {n.topic && (
                <span className="text-[10px] font-semibold bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded">
                  {n.topic}
                </span>
              )}
              <p className="text-sm text-gray-300 mt-1 leading-relaxed">{n.our_blurb}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section className="py-14 px-4 bg-gray-950 border-t border-gray-800">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">
            📰 ข่าว &amp; ความตระหนัก
          </div>
          <h2 className="text-2xl font-bold text-white">ข่าวหัวใจหยุดเต้น &amp; การกู้ชีพล่าสุด</h2>
          <p className="text-gray-500 text-sm mt-2">ทำไมการมี AED พร้อมใช้ถึงสำคัญ — อัปเดตทุกวัน</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {items.map((n) => (
            <div key={n.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col">
              {n.topic && (
                <span className="text-[10px] font-semibold bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded self-start mb-2">
                  {n.topic}
                </span>
              )}
              <p className="text-sm text-gray-300 leading-relaxed flex-1">{n.our_blurb}</p>
              <a
                href={n.source_url}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="text-xs text-yellow-400 hover:text-yellow-300 mt-3"
              >
                อ่านข่าวต้นฉบับ{n.source_name ? ` (${n.source_name})` : ""} →
              </a>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/news"
            className="inline-block border border-yellow-400/40 text-yellow-400 font-semibold px-6 py-2.5 rounded-full hover:bg-yellow-400/10 transition-colors"
          >
            ดูข่าวทั้งหมด
          </Link>
        </div>
      </div>
    </section>
  );
}
