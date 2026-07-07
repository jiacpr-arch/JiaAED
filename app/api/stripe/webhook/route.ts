/**
 * Stripe Webhook — DECOMMISSIONED
 * POST /api/stripe/webhook
 *
 * Stripe ถูกลบออกจากระบบแล้ว (ดู commit #84 "ลบ Stripe — ใช้ LINE @jiacpr แทน").
 * ปัจจุบันการชำระเงินทำผ่าน LINE @jiacpr ไม่ผ่าน Stripe อีกต่อไป
 *
 * แต่ Stripe Dashboard ยังตั้ง webhook destination ชี้มาที่ URL นี้อยู่ จึงยิง event
 * เข้ามาเรื่อย ๆ และได้ 404 (เพราะไม่มี route) ทำให้ Stripe ส่งอีเมลแจ้ง delivery failure
 *
 * route นี้เป็น "tombstone" — รับแล้วตอบ 200 เฉย ๆ เพื่อให้ Stripe หยุด retry/หยุดส่งอีเมล
 * ไม่ประมวลผล payload และไม่ต้องใช้ secret ใด ๆ
 *
 * วิธีปิดถาวร: ลบ webhook endpoint ออกจาก Stripe Dashboard
 *   Developers → Webhooks → เลือก endpoint นี้ → Delete
 * เมื่อลบใน Dashboard เรียบร้อยแล้ว สามารถลบไฟล์นี้ทิ้งได้
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Acknowledge and drop. Stripe treats any 2xx as a successful delivery and
// stops retrying, which ends the failed-delivery email notifications.
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { received: true, note: "Stripe integration decommissioned; payments handled via LINE @jiacpr." },
    { status: 200 },
  );
}

// Friendly response for a manual browser/health check.
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { status: "decommissioned", note: "This Stripe webhook endpoint is retired. Remove it from the Stripe Dashboard." },
    { status: 200 },
  );
}
