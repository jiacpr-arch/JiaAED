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

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
  }).format(d);
}

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-white">📰 ข่าว &amp; ความตระหนัก</h2>
          <Link href="/news" className="text-sm text-yellow-400 hover:text-yellow-300 font-semibold">
            ดูทั้งหมด →
          </Link>
        </div>
        <ul className="space-y-4">
          {items.map((n) => (
            <li key={n.id} className="border-b border-gray-800 last:border-0 pb-4 last:pb-0">
              {n.topic && (
                <span className="text-xs font-bold bg-yellow-400/15 text-yellow-400 px-2.5 py-1 rounded-full">
                  {n.topic}
                </span>
              )}
              <p className="text-base text-gray-100 mt-2 leading-relaxed">{n.our_blurb}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-gray-950 to-gray-900 border-t border-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-block bg-yellow-400/10 text-yellow-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-yellow-400/20">
            📰 ข่าว &amp; ความตระหนัก
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
            ข่าวหัวใจหยุดเต้น &amp; การกู้ชีพล่าสุด
          </h2>
          <p className="text-gray-400 text-base md:text-lg mt-4 max-w-2xl mx-auto">
            เหตุการณ์จริงที่เกิดขึ้นรอบตัว — ตอกย้ำว่าทุกวินาทีมีค่า และการมีเครื่อง AED พร้อมใช้ช่วยเพิ่มโอกาสรอด
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((n) => (
            <a
              key={n.id}
              href={n.source_url}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col hover:border-yellow-400/50 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {n.topic && (
                  <span className="text-xs font-bold bg-yellow-400/15 text-yellow-400 px-3 py-1 rounded-full">
                    {n.topic}
                  </span>
                )}
                {n.published_at && (
                  <span className="text-xs text-gray-500">{fmtDate(n.published_at)}</span>
                )}
              </div>
              <p className="text-lg text-gray-100 font-medium leading-relaxed flex-1">{n.our_blurb}</p>
              <span className="text-sm text-yellow-400 group-hover:text-yellow-300 mt-5 font-semibold">
                อ่านข่าวต้นฉบับ{n.source_name ? ` · ${n.source_name}` : ""} →
              </span>
            </a>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/news"
            className="inline-block bg-yellow-400 text-gray-950 font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition-colors"
          >
            ดูข่าวทั้งหมด
          </Link>
        </div>
      </div>
    </section>
  );
}
