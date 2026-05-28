import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 10;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

type Row = {
  source_title: string;
  source_url: string;
  source_name: string | null;
  topic: string | null;
  our_blurb: string;
  published_at: string | null;
  created_at: string;
};

const DATE_FMT = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "short",
  day: "numeric",
});

function fmtDate(iso: string | null): string {
  if (!iso) return "ไม่ระบุวันที่";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "ไม่ระบุวันที่";
  return DATE_FMT.format(d);
}

function renderContext(rows: Row[]): string {
  const today = DATE_FMT.format(new Date());

  const header = [
    "สรุปข่าวประจำวันจาก JiaAED — ข่าวหัวใจหยุดเต้นเฉียบพลัน / CPR / เครื่อง AED",
    `อัปเดตเมื่อ: ${today} (เวลาประเทศไทย)`,
    `จำนวน: ${rows.length} ข่าวล่าสุด`,
    "",
    "บริบทการใช้งาน: ใช้เป็น context ป้อนให้ AI ฝั่งปลายทาง สรุปต่อหรือตอบคำถามผู้ใช้ได้",
    "หมายเหตุ: blurb เป็นมุมให้ความรู้ที่ JiaAED เขียนเอง ไม่ใช่ข้อความต้นฉบับของสำนักข่าว",
    "หากต้องการรายละเอียดข่าว ให้แนะนำผู้ใช้กดลิงก์ต้นฉบับเสมอ",
    "",
    "---",
    "",
  ].join("\n");

  if (rows.length === 0) {
    return header + "ยังไม่มีข่าวในขณะนี้\n";
  }

  const body = rows
    .map((r, i) => {
      const topic = r.topic?.trim() || "การกู้ชีพ";
      const date = fmtDate(r.published_at ?? r.created_at);
      const lines = [
        `${i + 1}. [${topic}] ${date}`,
        `สรุป: ${r.our_blurb}`,
        `อ้างอิงพาดหัวข่าว: ${r.source_title}`,
      ];
      if (r.source_name) lines.push(`สำนักข่าว: ${r.source_name}`);
      lines.push(`ลิงก์ต้นฉบับ: ${r.source_url}`);
      return lines.join("\n");
    })
    .join("\n\n");

  return header + body + "\n";
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("aed_news_items")
    .select("source_title,source_url,source_name,topic,our_blurb,published_at,created_at")
    .eq("hidden", false)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  if (error) {
    console.error("[news/context] supabase error:", error.message);
    return new Response("error: failed to load news\n", {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const body = renderContext((data ?? []) as Row[]);

  return new Response(body, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
