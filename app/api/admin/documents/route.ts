import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorized } from "@/lib/aed/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

const BUCKET = "aed-documents";
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
]);
const ALLOWED_CATEGORIES = new Set([
  "manual",
  "specification",
  "certificate",
  "brochure",
  "other",
]);

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

function sanitizeFilename(name: string): string {
  // Strip path components and replace anything not [a-zA-Z0-9._-] with "_"
  const base = name.split(/[/\\]/).pop() ?? "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("aed_documents")
    .select("id,title,description,category,public_url,storage_path,mime,size_bytes,language,is_published,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/documents][GET] supabase error:", error.message);
    return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, documents: data ?? [] });
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return unauthorized();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_form" }, { status: 400 });
  }

  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim() || null;
  const categoryRaw = String(form.get("category") ?? "other").trim();
  const language = String(form.get("language") ?? "th").trim().slice(0, 8);

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ ok: false, error: "no_title" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ ok: false, error: "empty_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 413 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { ok: false, error: "unsupported_type", detail: file.type },
      { status: 415 },
    );
  }
  const category = ALLOWED_CATEGORIES.has(categoryRaw) ? categoryRaw : "other";

  const supabase = createAdminClient();
  const safeName = sanitizeFilename(file.name);
  const storagePath = `${category}/${Date.now()}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const uploadRes = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadRes.error) {
    console.error("[admin/documents][POST] upload error:", uploadRes.error.message);
    return NextResponse.json({ ok: false, error: "upload_failed" }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const publicUrl = pub.publicUrl;

  const insertRes = await supabase
    .from("aed_documents")
    .insert({
      title,
      description,
      category,
      storage_path: storagePath,
      public_url: publicUrl,
      mime: file.type,
      size_bytes: file.size,
      language,
      is_published: true,
    })
    .select()
    .single();

  if (insertRes.error) {
    // Try to roll back the upload to avoid orphan files.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    console.error("[admin/documents][POST] insert error:", insertRes.error.message);
    return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, document: insertRes.data });
}

export async function DELETE(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "no_id" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: existing, error: findErr } = await supabase
    .from("aed_documents")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (findErr) {
    console.error("[admin/documents][DELETE] find error:", findErr.message);
    return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  await supabase.storage.from(BUCKET).remove([existing.storage_path]);
  const { error: delErr } = await supabase.from("aed_documents").delete().eq("id", id);
  if (delErr) {
    console.error("[admin/documents][DELETE] delete error:", delErr.message);
    return NextResponse.json({ ok: false, error: "database_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
