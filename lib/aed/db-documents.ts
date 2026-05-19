import { createAdminClient } from "@/lib/supabase/admin";
import type { DocumentItem } from "./documents";

type DbRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  public_url: string;
  mime: string;
  size_bytes: number;
  language: string;
  created_at: string;
};

function fmtSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

const ALLOWED_CATEGORIES: DocumentItem["category"][] = [
  "manual",
  "specification",
  "certificate",
  "brochure",
  "other",
];

function toCategory(c: string): DocumentItem["category"] {
  return (ALLOWED_CATEGORIES as string[]).includes(c)
    ? (c as DocumentItem["category"])
    : "other";
}

function toLanguage(l: string): DocumentItem["language"] {
  if (l === "en" || l === "th" || l === "th-en") return l;
  return "th";
}

/**
 * Fetch published documents uploaded via /admin/documents.
 * Returns [] on any failure (e.g. table doesn't exist yet, Supabase down) —
 * the static documents in lib/aed/documents.ts always render.
 */
export async function fetchUploadedDocuments(): Promise<DocumentItem[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("aed_documents")
      .select("id,title,description,category,public_url,mime,size_bytes,language,created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[docs] fetch uploaded docs error:", error.message);
      return [];
    }
    const rows = (data ?? []) as DbRow[];
    return rows.map((r) => ({
      id: `db-${r.id}`,
      title: r.title,
      description: r.description ?? "",
      href: r.public_url,
      category: toCategory(r.category),
      mime: r.mime,
      sizeLabel: fmtSize(r.size_bytes),
      language: toLanguage(r.language),
      updatedAt: r.created_at.slice(0, 10),
    }));
  } catch (e) {
    console.error("[docs] fetch uploaded docs threw:", (e as Error).message);
    return [];
  }
}
