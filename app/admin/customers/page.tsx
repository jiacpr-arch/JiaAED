import { createAdminClient } from "@/lib/supabase/admin";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function CustomersPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const db = createAdminClient();

  let query = db
    .from("aed_customers")
    .select("id, full_name, phone, email, company_name, customer_type, total_orders, total_lifetime_value, created_at, last_active_at")
    .order("last_active_at", { ascending: false })
    .limit(100);

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,company_name.ilike.%${q}%`,
    );
  }

  const { data: customers } = await query;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-100">ลูกค้า</h1>

      {/* Search */}
      <form method="GET" className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="ค้นหาชื่อ / เบอร์ / อีเมล / บริษัท"
          className="flex-1 bg-neutral-800 border border-neutral-700 focus:border-yellow-500 focus:outline-none rounded-lg px-4 py-2 text-neutral-100 placeholder-neutral-500 text-sm transition-colors"
        />
        <button
          type="submit"
          className="bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          ค้นหา
        </button>
        {q && (
          <a
            href="/admin/customers"
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            ล้าง
          </a>
        )}
      </form>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400 text-left">
              <th className="px-4 py-3 font-medium">ชื่อ</th>
              <th className="px-4 py-3 font-medium">เบอร์ / อีเมล</th>
              <th className="px-4 py-3 font-medium">บริษัท</th>
              <th className="px-4 py-3 font-medium">ประเภท</th>
              <th className="px-4 py-3 font-medium">สั่งซื้อ</th>
              <th className="px-4 py-3 font-medium">มูลค่า</th>
              <th className="px-4 py-3 font-medium">Active ล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            {(customers ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-500">
                  ไม่พบข้อมูล{q ? ` สำหรับ "${q}"` : ""}
                </td>
              </tr>
            )}
            {(customers ?? []).map((c) => (
              <tr
                key={c.id}
                className="border-b border-neutral-800 last:border-0 hover:bg-neutral-800/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="text-neutral-100">{c.full_name ?? "ไม่ระบุ"}</p>
                  <p className="text-neutral-500 font-mono text-xs">{c.id.slice(0, 8)}</p>
                </td>
                <td className="px-4 py-3 text-neutral-300 text-xs">
                  <p>{c.phone ?? "—"}</p>
                  <p className="text-neutral-500">{c.email ?? ""}</p>
                </td>
                <td className="px-4 py-3 text-neutral-300 text-xs">{c.company_name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.customer_type === "government"
                      ? "bg-purple-400/10 text-purple-400"
                      : c.customer_type === "corporate"
                      ? "bg-blue-400/10 text-blue-400"
                      : "bg-neutral-800 text-neutral-400"
                  }`}>
                    {c.customer_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-300 text-center">{c.total_orders}</td>
                <td className="px-4 py-3 text-neutral-100">
                  {c.total_lifetime_value > 0
                    ? c.total_lifetime_value.toLocaleString("th-TH") + " ฿"
                    : "—"}
                </td>
                <td className="px-4 py-3 text-neutral-400 text-xs">
                  {new Date(c.last_active_at).toLocaleDateString("th-TH")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
