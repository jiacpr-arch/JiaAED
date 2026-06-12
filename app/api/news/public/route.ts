import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type",
} as const;

const MAX_LIMIT = 60;
const DEFAULT_LIMIT = 20;

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const rawLimit = Number(params.get("limit"));
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
      : DEFAULT_LIMIT;
  const topic = params.get("topic");

  const supabase = createAdminClient();
  let query = supabase
    .from("aed_news_items")
    .select("id,source_title,source_url,source_name,topic,our_blurb,published_at")
    .eq("hidden", false)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (topic) query = query.eq("topic", topic);

  const { data, error } = await query;

  if (error) {
    console.error("[news/public][GET] supabase error:", error.message);
    return NextResponse.json(
      { ok: false, error: "database_error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  const items = data ?? [];
  return NextResponse.json(
    { ok: true, count: items.length, items },
    {
      headers: {
        ...CORS_HEADERS,
        "cache-control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
