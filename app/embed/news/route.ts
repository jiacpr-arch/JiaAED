import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com";
const MAX_LIMIT = 30;
const DEFAULT_LIMIT = 5;

type NewsRow = {
  id: string;
  source_title: string;
  source_url: string;
  source_name: string | null;
  topic: string | null;
  our_blurb: string;
  published_at: string | null;
};

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

const THEMES = {
  dark: {
    bg: "#0a0a0f",
    card: "#16161d",
    border: "#2a2a33",
    text: "#f3f4f6",
    muted: "#9ca3af",
    accent: "#facc15",
  },
  light: {
    bg: "#ffffff",
    card: "#f9fafb",
    border: "#e5e7eb",
    text: "#111827",
    muted: "#6b7280",
    accent: "#ca8a04",
  },
} as const;

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const rawLimit = Number(params.get("limit"));
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
      : DEFAULT_LIMIT;
  const theme = THEMES[params.get("theme") === "light" ? "light" : "dark"];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("aed_news_items")
    .select("id,source_title,source_url,source_name,topic,our_blurb,published_at")
    .eq("hidden", false)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[embed/news] supabase error:", error.message);
  }
  const items = (data ?? []) as NewsRow[];

  const cards = items
    .map((n) => {
      const meta = [
        n.topic ? `<span class="topic">${escape(n.topic)}</span>` : "",
        n.published_at ? `<span class="date">${fmtDate(n.published_at)}</span>` : "",
      ]
        .filter(Boolean)
        .join("");
      return `<article class="card">
        <div class="meta">${meta}</div>
        <p class="blurb">${escape(n.our_blurb)}</p>
        <a class="src" href="${escape(n.source_url)}" target="_blank" rel="nofollow noopener noreferrer">
          อ่านข่าวต้นฉบับ${n.source_name ? ` (${escape(n.source_name)})` : ""} →
        </a>
      </article>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>ข่าวจาก JiaAED</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif;
    background: ${theme.bg}; color: ${theme.text};
    padding: 12px; font-size: 14px; line-height: 1.6;
  }
  .card {
    background: ${theme.card}; border: 1px solid ${theme.border};
    border-radius: 10px; padding: 14px 16px; margin-bottom: 10px;
  }
  .meta { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
  .topic {
    font-size: 10px; font-weight: 600; color: ${theme.accent};
    border: 1px solid ${theme.accent}33; background: ${theme.accent}1a;
    padding: 1px 8px; border-radius: 99px;
  }
  .date { font-size: 10px; color: ${theme.muted}; }
  .blurb { margin-bottom: 8px; }
  .src { font-size: 12px; color: ${theme.accent}; text-decoration: none; }
  .src:hover { text-decoration: underline; }
  .empty { color: ${theme.muted}; font-size: 13px; }
  .credit {
    text-align: center; font-size: 11px; color: ${theme.muted}; margin-top: 4px;
  }
  .credit a { color: ${theme.accent}; text-decoration: none; font-weight: 600; }
</style>
</head>
<body>
${cards || `<p class="empty">ยังไม่มีข่าวในขณะนี้</p>`}
<p class="credit">ข่าวโดย <a href="${SITE}/news" target="_blank" rel="noopener">JiaAED</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
      "content-security-policy": "frame-ancestors *",
      "x-robots-tag": "noindex",
    },
  });
}
