import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

async function getStats() {
  const db = createAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();

  const [activeDeals, paidMonth, pendingFollowups, newCustomers] = await Promise.all([
    db
      .from("aed_deals")
      .select("id", { count: "exact", head: true })
      .in("stage", ["new", "quoted", "negotiating"]),
    db
      .from("aed_deals")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "paid")
      .gte("paid_at", monthStart),
    db
      .from("aed_followups")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("aed_customers")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo),
  ]);

  return {
    activeDeals: activeDeals.count ?? 0,
    paidMonth: paidMonth.count ?? 0,
    pendingFollowups: pendingFollowups.count ?? 0,
    newCustomers: newCustomers.count ?? 0,
  };
}

async function getRecentDeals() {
  const db = createAdminClient();
  const { data } = await db
    .from("aed_deals")
    .select("id, stage, payment_status, product_id, quantity, total_amount, created_at, aed_customers(full_name, phone)")
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

const stageLabel: Record<string, string> = {
  new: "ใหม่",
  quoted: "เสนอราคา",
  negotiating: "ต่อรอง",
  won: "ปิดการขาย",
  lost: "ไม่สำเร็จ",
};

const stageColor: Record<string, string> = {
  new: "text-blue-400 bg-blue-400/10",
  quoted: "text-yellow-400 bg-yellow-400/10",
  negotiating: "text-orange-400 bg-orange-400/10",
  won: "text-green-400 bg-green-400/10",
  lost: "text-red-400 bg-red-400/10",
};

export default async function AdminOverviewPage() {
  const [stats, recentDeals] = await Promise.all([getStats(), getRecentDeals()]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-neutral-100">ภาพรวม</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Deals กำลังดำเนินการ", value: stats.activeDeals, color: "text-yellow-400" },
          { label: "ปิดการขายเดือนนี้", value: stats.paidMonth, color: "text-green-400" },
          { label: "Followup รอส่ง", value: stats.pendingFollowups, color: "text-orange-400" },
          { label: "ลูกค้าใหม่ 7 วัน", value: stats.newCustomers, color: "text-blue-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-5"
          >
            <p className="text-xs text-neutral-400 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent deals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-neutral-200">Deals ล่าสุด</h2>
          <Link href="/admin/deals" className="text-sm text-yellow-400 hover:underline">
            ดูทั้งหมด →
          </Link>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                <th className="px-4 py-3 font-medium">ลูกค้า</th>
                <th className="px-4 py-3 font-medium">สินค้า</th>
                <th className="px-4 py-3 font-medium">ยอด</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="px-4 py-3 font-medium">วันที่</th>
              </tr>
            </thead>
            <tbody>
              {recentDeals.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                    ยังไม่มี deal
                  </td>
                </tr>
              )}
              {recentDeals.map((d) => {
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
                      <p className="text-neutral-300 text-xs mt-0.5">
                        {customer?.full_name ?? "ลูกค้าใหม่"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-neutral-300">
                      {d.product_id} × {d.quantity}
                    </td>
                    <td className="px-4 py-3 text-neutral-100">
                      {d.total_amount != null
                        ? d.total_amount.toLocaleString("th-TH") + " ฿"
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageColor[d.stage] ?? "text-neutral-400 bg-neutral-800"}`}>
                        {stageLabel[d.stage] ?? d.stage}
                      </span>
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
    </div>
  );
}
