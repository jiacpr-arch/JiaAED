import Link from "next/link";

export const metadata = {
  title: "ชำระเงินสำเร็จ | JiaAED",
  description: "ขอบคุณสำหรับการชำระเงิน — ทีมงาน JiaAED จะดำเนินการต่อให้ครับ",
};

interface SearchParams {
  searchParams: Promise<{ deal_id?: string }>;
}

export default async function PaymentSuccessPage({ searchParams }: SearchParams) {
  const { deal_id } = await searchParams;
  const lineUrl = process.env.NEXT_PUBLIC_LINE_OA_URL ?? "https://line.me/R/ti/p/@273fzpzs";

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full bg-neutral-900 border border-yellow-500/30 rounded-2xl p-8 sm:p-12 shadow-2xl text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-3">
          ชำระเงินสำเร็จแล้ว
        </h1>
        <p className="text-neutral-300 mb-6 leading-relaxed">
          ขอบคุณที่ไว้วางใจ JiaAED ครับ 🙏
          <br />
          ระบบกำลังออกใบเสร็จและแจ้งทีมงานให้ดำเนินการจัดส่ง
          <br />
          คุณจะได้รับข้อความยืนยันทาง LINE เร็ว ๆ นี้
        </p>

        {deal_id && (
          <p className="text-xs text-neutral-500 mb-6 font-mono">
            Reference: {deal_id.slice(0, 8)}
          </p>
        )}

        <div className="space-y-3">
          <a
            href={lineUrl}
            className="block w-full bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            กลับไปที่ LINE OA
          </a>
          <Link
            href="/"
            className="block w-full border border-neutral-700 hover:border-yellow-500/50 text-neutral-200 py-3 px-6 rounded-lg transition-colors"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    </main>
  );
}
