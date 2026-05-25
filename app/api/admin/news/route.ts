import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorized } from "@/lib/aed/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("aed_news_items")
    .select("id,source_title,source_url,source_name,topic,our_blurb,published_at,hidden,created_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[admin/news][GET] supabase error:", error.message);
    return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, news: data ?? [] });
}

export async function PATCH(req: Request) {
  if (!isAuthorized(req)) return unauthorized();

  let body: { id?: string; hidden?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const id = body.id;
  if (!id || typeof body.hidden !== "boolean") {
    return NextResponse.json({ ok: false, error: "id_and_hidden_required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("aed_news_items")
    .update({ hidden: body.hidden })
    .eq("id", id);

  if (error) {
    console.error("[admin/news][PATCH] supabase error:", error.message);
    return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "no_id" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("aed_news_items").delete().eq("id", id);
  if (error) {
    console.error("[admin/news][DELETE] supabase error:", error.message);
    return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
