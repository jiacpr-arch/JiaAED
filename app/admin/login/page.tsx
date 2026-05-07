export const metadata = {
  title: "เข้าสู่ระบบ Admin | JiaAED",
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-neutral-900 border border-yellow-500/30 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-yellow-400 mb-1">JiaAED Admin</h1>
        <p className="text-neutral-400 text-sm mb-6">กรุณาใส่รหัสผ่านเพื่อเข้าใช้งาน</p>

        <form action="/api/admin/login" method="POST" className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-300 mb-1" htmlFor="password">
              รหัสผ่าน
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="w-full bg-neutral-800 border border-neutral-700 focus:border-yellow-500 focus:outline-none rounded-lg px-4 py-2.5 text-neutral-100 placeholder-neutral-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-semibold py-2.5 rounded-lg transition-colors"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        {/* error shown after redirect */}
        <noscript>
          <p className="mt-4 text-red-400 text-sm text-center">
            รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่
          </p>
        </noscript>
      </div>
    </main>
  );
}
