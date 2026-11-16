"use client";

// /admin — start page. Instead of a menu of tools, it asks "วันนี้จะทำอะไร?"
// and lists what needs attention (late returns, expiring card holds, overdue
// rent, pads/batteries about to expire) with a button straight to the fix.

import { useEffect, useState } from "react";
import Link from "next/link";
import { checkUnitExpiries } from "@/lib/aed/unit-expiry";
import { lateDays, type HoldRow } from "@/lib/aed/rental-holds";
import type { AedUnit } from "@/lib/aed/units";
import { AdminShell, Card, useAdmin } from "./ui";

const TASKS = [
  { href: "/admin/billing?new=subscribe", icon: "💳", title: "ส่งลิงก์ตัดบัตรรายเดือน", desc: "ลูกค้าเซ็นสัญญาเช่า / เช่าซื้อแล้ว" },
  { href: "/admin/billing?new=hold", icon: "🎪", title: "เช่าอีเวนต์ (กันวงเงินบัตร)", desc: "เช่า 1–6 วัน ไม่ต้องรับมัดจำเงินสด" },
  { href: "/admin/billing?view=holds", icon: "📦", title: "ลูกค้าคืนเครื่องอีเวนต์", desc: "เก็บค่าเช่า แล้วปล่อยวงเงินที่เหลือ" },
  { href: "/admin/billing?new=convert", icon: "🔁", title: "ลูกค้าเช่าอยากซื้อเครื่อง", desc: "เปลี่ยนเป็นซื้อ หักเงินประกันให้" },
  { href: "/admin/billing?view=orders", icon: "↩️", title: "คืนเงิน / จบสัญญาเช่า", desc: "ออเดอร์ออนไลน์ หรือ FLEX คืนเครื่อง" },
  { href: "/admin/units", icon: "🔋", title: "ทะเบียนเครื่อง / แผ่น / แบต", desc: "เพิ่ม แก้ไข ดูวันหมดอายุ" },
  { href: "/admin/documents", icon: "📁", title: "อัปโหลดเอกสาร", desc: "คู่มือ สเปค ใบรับรอง บนเว็บ" },
  { href: "/admin/news", icon: "📰", title: "ซ่อน / แสดงข่าว", desc: "ข่าวที่ระบบดึงมาอัตโนมัติ" },
  { href: "/admin/analytics", icon: "📊", title: "ดูสถิติเว็บ", desc: "คนเข้าเว็บ กด LINE ส่งฟอร์ม" },
];

type Todo = { tone: "red" | "yellow"; text: string; href: string; cta: string };

export default function AdminHome() {
  return (
    <AdminShell title="วันนี้จะทำอะไร?" subtitle="กดเลือกงานที่ต้องการ ระบบจะพาทำทีละขั้นตอน" wide>
      <TodoList />
      <h2 className="text-lg font-bold mb-3 mt-8">เลือกงาน</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TASKS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group rounded-2xl border-2 border-gray-800 bg-gray-900 p-5 flex gap-4 items-start hover:border-yellow-400 transition-colors"
          >
            <span className="text-3xl leading-none" aria-hidden>
              {t.icon}
            </span>
            <span className="flex-1">
              <span className="block font-bold text-lg group-hover:text-yellow-300">{t.title}</span>
              <span className="block text-sm text-gray-400 mt-1">{t.desc}</span>
            </span>
            <span className="text-gray-600 group-hover:text-yellow-400 text-xl" aria-hidden>
              →
            </span>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}

function TodoList() {
  const { expire } = useAdmin();
  const [todos, setTodos] = useState<Todo[] | null>(null);

  useEffect(() => {
    (async () => {
      const list: Todo[] = [];
      const [billing, units] = await Promise.all([
        fetch("/api/admin/rental-billing").then((r) => (r.status === 401 ? "401" : r.json())).catch(() => null),
        fetch("/api/admin/units").then((r) => (r.status === 401 ? "401" : r.json())).catch(() => null),
      ]);
      if (billing === "401" || units === "401") return expire();

      if (billing?.ok) {
        const holds = billing.holds as HoldRow[];
        const now = Date.now();
        for (const h of holds) {
          const who = h.company_name || h.customer_name || "ลูกค้า";
          if (h.status === "expired") {
            list.push({ tone: "red", text: `${who}: วงเงินบัตรหมดอายุ ยังไม่ได้เก็บค่าเช่า`, href: "/admin/billing?view=holds", cta: "ดู" });
          } else if (h.status === "authorized") {
            const late = lateDays(h.return_date);
            const left = h.capture_before ? new Date(h.capture_before).getTime() - now : Infinity;
            if (late > 0) list.push({ tone: "red", text: `${who}: เลยกำหนดคืนเครื่อง ${late} วัน`, href: "/admin/billing?view=holds", cta: "จัดการ" });
            else if (left < 24 * 3_600_000)
              list.push({ tone: "red", text: `${who}: วงเงินบัตรจะหมดอายุภายใน 24 ชม. — เก็บค่าเช่าก่อน`, href: "/admin/billing?view=holds", cta: "เก็บเงิน" });
          }
        }
        const pastDue = (billing.rows as { status: string; company_name: string | null; customer_name: string | null }[]).filter((r) => r.status === "past_due");
        for (const r of pastDue) {
          list.push({ tone: "yellow", text: `${r.company_name || r.customer_name || "ลูกค้า"}: ค้างชำระค่าเช่ารายเดือน`, href: "/admin/billing?view=monthly", cta: "ดู" });
        }
      }

      if (units?.ok) {
        const urgent = checkUnitExpiries(units.units as AedUnit[], new Date()).filter((s) => s.urgent);
        if (urgent.length > 0) {
          const expired = urgent.filter((s) => s.daysLeft < 0).length;
          list.push({
            tone: expired > 0 ? "red" : "yellow",
            text: `แผ่น/แบตใกล้หมดอายุ ${urgent.length} รายการ${expired > 0 ? ` (หมดแล้ว ${expired})` : ""}`,
            href: "/admin/units?filter=urgent",
            cta: "ดูรายการ",
          });
        }
      }
      setTodos(list);
    })();
  }, [expire]);

  if (todos === null) return <Card className="text-gray-500">กำลังเช็กงานค้าง…</Card>;
  if (todos.length === 0)
    return (
      <Card className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          🎉
        </span>
        <span className="text-green-300 font-semibold">ไม่มีงานค้างด่วน</span>
      </Card>
    );
  return (
    <Card>
      <h2 className="font-bold mb-3">⏰ ต้องจัดการ ({todos.length})</h2>
      <ul className="space-y-2">
        {todos.map((t, i) => (
          <li
            key={i}
            className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${t.tone === "red" ? "bg-red-500/10 text-red-200" : "bg-yellow-400/10 text-yellow-100"}`}
          >
            <span className="text-sm">{t.text}</span>
            <Link href={t.href} className="shrink-0 text-sm font-bold underline underline-offset-4">
              {t.cta} →
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
