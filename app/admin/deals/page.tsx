import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

const stageLabel: Record<string, string> = {
  new: "ใหม่", quoted: "เสนอราคา", negotiating: "ต่อรอง", won: "ปิดการขาย", lost: "ไม่สำเร็จ",
};
const stageColor: Record<string, string> = {
  new: "text-blue-400 bg-blue-400/10", quoted: "text-yellow-400 bg-yellow-400/10",
  negotiating: "text-orange-400 bg-orange-400/10", won: "text-green-400 bg-green-400/10",
  lost: "text-red-400 bg-red-400/10",
};
const payColor: Record<string, string> = {
  pending: "text-neutral-400", paid: "text-green-400", failed: "text-red-400",
};

interface Props {
  searchParams: Promise<{ stage?: string }>;
}

export default async function DealsPage({ searchParams }: Props) {
  const { stage } = await searchParams;
  const db = createAdminClient();

  let query = db
    .from("aed_deals")
    .select("id, stage, payment_status, product_id, quantity, total_amount, created_at, aed_customers(full_name, phone)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (stage) query = query.eq("stage", stage);

  const { data: deals } = await query;

  const stages = ["new", "quoted", "negotiating", "won", "lost"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-100">Deals</h1>

      {/* Stage filter */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/admin/deals"
          className={`px-3 py-1 rounded-full text-sm transition-colors ${!stage ? "bg-yellow-400 text-neutral-950 font-semibold" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"}`}
        >
          ทั้งหมด
        </Link>
        {stages.map((s) => (
          <Link
            key={s}
            href={`/admin/deals?stage=${s}`}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${stage === s ? "bg-yellow-400 text-neutral-950 font-semibold" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"}`}
          >
            {stageLabel[s]}
          </Link>
        ))}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400 text-left">
              <th className="px-4 py-3 font-medium">Deal ID</th>
              <th className="px-4 py-3 font-medium">ลูกค้า</th>
              <th className="px-4 py-3 font-medium">สินค้า × จำนวน</th>
              <th className="px-4 py-3 font-medium">ยอดรวม</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">ชำระ</th>
              <th className="px-4 py-3 font-medium">วันที่</th>
            </tr>
          </thead>
          <tbody>
            {(deals ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-500">
                  ไม่มีข้อมูล
                </td>
              </tr>
            )}
            {(deals ?? []).map((d) => {
              const customer = (d as { aed_customers?: { full_name?: string | null; phone?: string | null } }).aed_customers;
              return (
                <tr
                  key={d.id}
                  className="border-b border-neutral-800 last:border-0 hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link href={`/admin/deals/${d.id}`} className="text-yellow-400 hover:underline font-mono text-xs">
                      {d.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-300 text-xs">
                    <p>{customer?.full_name ?? "—"}</p>
                    <p className="text-neutral-500">{customer?.phone ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-300">{d.product_id} × {d.quantity}</td>
                  <td className="px-4 py-3 text-neutral-100">
                    {d.total_amount != null ? d.total_amount.toLocaleString("th-TH") + " ฿" : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageColor[d.stage] ?? "text-neutral-400 bg-neutral-800"}`}>
                      {stageLabel[d.stage] ?? d.stage}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs font-medium ${payColor[d.payment_status] ?? ""}`}>
                    {d.payment_status === "paid" ? "✅ ชำระแล้ว" : d.payment_status === "failed" ? "❌ ล้มเหลว" : "รอชำระ"}
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-xs">
                    {new Date(d.created_at).toLocaleDateString("th-TH")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
