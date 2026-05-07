import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata = {
  title: "Admin | JiaAED",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-bold text-yellow-400 text-lg">JiaAED Admin</span>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin" className="text-neutral-300 hover:text-yellow-400 transition-colors">
                ภาพรวม
              </Link>
              <Link href="/admin/deals" className="text-neutral-300 hover:text-yellow-400 transition-colors">
                Deals
              </Link>
              <Link href="/admin/customers" className="text-neutral-300 hover:text-yellow-400 transition-colors">
                ลูกค้า
              </Link>
            </nav>
          </div>
          <a
            href="/api/admin/logout"
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            ออกจากระบบ
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
