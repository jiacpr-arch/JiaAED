"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { AedDeal, AedCustomer } from "@/lib/aed/types";

async function markDealStage(dealId: string, stage: "won" | "lost") {
  "use server";
  const db = createAdminClient();
  await db.from("aed_deals").update({ stage, closed_at: new Date().toISOString() }).eq("id", dealId);
  redirect(`/admin/deals/${dealId}`);
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DealDetailPage({ params }: Props) {
  const { id } = await params;
  const db = createAdminClient();

  const { data: deal } = await db.from("aed_deals").select("*").eq("id", id).maybeSingle();
  if (!deal) notFound();

  const d = deal as AedDeal;

  const { data: customer } = d.customer_id
    ? await db.from("aed_customers").select("*").eq("id", d.customer_id).maybeSingle()
    : { data: null };

  const { data: messages } = d.conversation_id
    ? await db
        .from("aed_messages")
        .select("direction, sender_type, content_text, created_at")
        .eq("conversation_id", d.conversation_id)
        .order("created_at", { ascending: true })
        .limit(30)
    : { data: null };

  const c = customer as AedCustomer | null;

  const markWon = markDealStage.bind(null, d.id, "won");
  const markLost = markDealStage.bind(null, d.id, "lost");

  const field = (label: string, value: string | null | undefined) =>
    value ? (
      <div key={label}>
        <p className="text-xs text-neutral-400">{label}</p>
        <p className="text-sm text-neutral-100 mt-0.5 break-all">{value}</p>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/deals" className="text-neutral-400 hover:text-neutral-200 text-sm">← กลับ</Link>
        <h1 className="text-xl font-bold text-neutral-100 font-mono">{d.id.slice(0, 8)}</h1>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          d.stage === "won" ? "bg-green-400/10 text-green-400" :
          d.stage === "lost" ? "bg-red-400/10 text-red-400" :
          "bg-yellow-400/10 text-yellow-400"}`}>
          {d.stage}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deal info */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">ข้อมูล Deal</h2>
          {field("สินค้า", d.product_id)}
          {field("จำนวน", String(d.quantity))}
          {field("ราคาต่อเครื่อง", d.unit_price != null ? d.unit_price.toLocaleString("th-TH") + " ฿" : null)}
          {field("ยอดรวม (รวม VAT)", d.total_amount != null ? d.total_amount.toLocaleString("th-TH") + " ฿" : null)}
          {field("สถานะชำระ", d.payment_status)}
          {field("ชำระเมื่อ", d.paid_at ? new Date(d.paid_at).toLocaleString("th-TH") : null)}
          {field("เลขที่ใบเสนอราคา", d.flowaccount_quotation_number)}
          {field("เลขที่ใบเสร็จ", d.flowaccount_receipt_id)}
          {field("Stripe Payment Link", d.stripe_payment_link_url)}
          {field("หมายเหตุ", d.notes)}
          {field("สร้างเมื่อ", new Date(d.created_at).toLocaleString("th-TH"))}
        </div>

        {/* Customer info */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">ข้อมูลลูกค้า</h2>
          {c ? (
            <>
              {field("ชื่อ", c.full_name)}
              {field("เบอร์โทร", c.phone)}
              {field("อีเมล", c.email)}
              {field("บริษัท", c.company_name)}
              {field("เลขผู้เสียภาษี", c.tax_id)}
              {field("ที่อยู่", c.address)}
              {field("ประเภท", c.customer_type)}
              {field("LINE User ID", c.line_user_id)}
              <Link href="/admin/customers" className="text-xs text-yellow-400 hover:underline block pt-1">
                ดูข้อมูลลูกค้าทั้งหมด →
              </Link>
            </>
          ) : (
            <p className="text-neutral-500 text-sm">ไม่พบข้อมูลลูกค้า</p>
          )}
        </div>
      </div>

      {/* Actions */}
      {d.stage !== "won" && d.stage !== "lost" && (
        <div className="flex gap-3">
          <form action={markWon}>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-500 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              ✅ Mark Won
            </button>
          </form>
          <form action={markLost}>
            <button
              type="submit"
              className="bg-red-700 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              ❌ Mark Lost
            </button>
          </form>
        </div>
      )}

      {/* Recent messages */}
      {messages && messages.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-200 mb-3">ข้อความล่าสุด</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3 max-h-96 overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                    m.direction === "outbound"
                      ? "bg-yellow-400/10 text-yellow-100 border border-yellow-500/20"
                      : "bg-neutral-800 text-neutral-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content_text}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {new Date(m.created_at).toLocaleTimeString("th-TH")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
