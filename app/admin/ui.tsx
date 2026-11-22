"use client";

// Shared building blocks for the /admin pages. The goal is a back office the
// team can use without training: one login, one menu, and every multi-field
// job broken into numbered steps with a clear "ถัดไป" button.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { JiaAedLogo } from "@/app/components/JiaAedLogo";
import { LOGIN_ERRORS, adminLogin, adminLogout, forgetLegacyToken } from "./admin-session";

// ─── Styles ──────────────────────────────────────────────────────────────────

export const inputCls =
  "w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-base text-white mt-1.5 focus:border-yellow-400 focus:outline-none disabled:opacity-50";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 bg-yellow-400 text-gray-950 font-bold px-6 py-3 rounded-xl hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 border border-gray-700 text-gray-200 font-semibold px-5 py-3 rounded-xl hover:border-gray-500 hover:text-white disabled:opacity-40 transition-colors";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 bg-red-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-400 disabled:opacity-40 transition-colors";
export const btnSmall =
  "inline-flex items-center justify-center gap-1 text-sm font-semibold px-3 py-2 rounded-lg border border-gray-700 text-gray-200 hover:border-yellow-400 hover:text-yellow-300 disabled:opacity-40 transition-colors";

// ─── Menu ────────────────────────────────────────────────────────────────────

export const ADMIN_MENU = [
  { href: "/admin", icon: "🏠", label: "หน้าแรก" },
  { href: "/admin/leads", icon: "📋", label: "Leads" },
  { href: "/admin/billing", icon: "💳", label: "รับชำระเงิน" },
  { href: "/admin/units", icon: "🔋", label: "ทะเบียนเครื่อง" },
  { href: "/admin/documents", icon: "📁", label: "เอกสาร" },
  { href: "/admin/news", icon: "📰", label: "ข่าว" },
  { href: "/admin/analytics", icon: "📊", label: "สถิติเว็บ" },
] as const;

// ─── Session ─────────────────────────────────────────────────────────────────

type AdminCtx = {
  /** Call when an /api/admin request answers 401 — shows the login again. */
  expire: () => void;
};
const Ctx = createContext<AdminCtx>({ expire: () => {} });
export const useAdmin = () => useContext(Ctx);

/**
 * Page frame for every admin page: checks the session cookie once, shows the
 * login card when needed, and renders the menu + page title. Children mount
 * only after sign-in, so they can load their data in a plain useEffect.
 */
export function AdminShell({
  title,
  subtitle,
  actions,
  wide,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  const [state, setState] = useState<"checking" | "in" | "out">("checking");
  const pathname = usePathname();

  useEffect(() => {
    forgetLegacyToken();
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => setState(d?.authenticated ? "in" : "out"))
      .catch(() => setState("out"));
  }, []);

  const expire = useCallback(() => setState("out"), []);
  const logout = async () => {
    await adminLogout();
    setState("out");
  };

  if (state === "checking") {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-500 flex items-center justify-center">กำลังโหลด…</div>
    );
  }
  if (state === "out") return <LoginCard onDone={() => setState("in")} />;

  return (
    <Ctx.Provider value={{ expire }}>
      <div className="min-h-screen bg-gray-950 text-white font-sans pb-16">
        <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-4 pt-3 flex items-center justify-between gap-3">
            <Link href="/admin" className="flex items-center gap-2 shrink-0">
              <JiaAedLogo className="h-7 w-auto" />
              <span className="font-bold text-lg text-yellow-400">หลังบ้าน</span>
            </Link>
            <button onClick={logout} className="text-sm text-gray-400 hover:text-yellow-400">
              ออกจากระบบ
            </button>
          </div>
          <nav className="max-w-6xl mx-auto px-2 flex gap-1 overflow-x-auto py-2" aria-label="เมนูหลังบ้าน">
            {ADMIN_MENU.map((m) => {
              const active = m.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(m.href);
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 text-sm px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    active ? "bg-yellow-400 text-gray-950 font-bold" : "text-gray-300 hover:bg-gray-900"
                  }`}
                >
                  <span aria-hidden>{m.icon}</span> {m.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className={`${wide ? "max-w-6xl" : "max-w-3xl"} mx-auto px-4 pt-8`}>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
              {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
            </div>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </Ctx.Provider>
  );
}

function LoginCard({ onDone }: { onDone: () => void }) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setBusy(true);
    setError(null);
    const result = await adminLogin(token.trim());
    setBusy(false);
    if (result !== "ok") return setError(LOGIN_ERRORS[result]);
    onDone();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm space-y-5">
        <div className="flex items-center gap-2">
          <JiaAedLogo className="h-8 w-auto" />
          <span className="font-bold text-xl text-yellow-400">หลังบ้าน</span>
        </div>
        <label className="block text-sm font-semibold">
          รหัสผ่านแอดมิน
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ADMIN_TOKEN"
            className={inputCls}
            autoFocus
          />
        </label>
        {error && <Notice kind="error">{error}</Notice>}
        <button type="submit" disabled={busy || !token.trim()} className={`${btnPrimary} w-full`}>
          {busy ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
        </button>
        <p className="text-xs text-gray-500">เข้าครั้งเดียวใช้ได้ทุกเมนู 7 วัน</p>
      </form>
    </div>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

export function Notice({ kind, children, onClose }: { kind: "error" | "ok" | "warn" | "info"; children: ReactNode; onClose?: () => void }) {
  const cls = {
    error: "bg-red-500/10 border-red-500/40 text-red-200",
    ok: "bg-green-500/10 border-green-500/40 text-green-200",
    warn: "bg-yellow-500/10 border-yellow-500/40 text-yellow-100",
    info: "bg-gray-900 border-gray-700 text-gray-300",
  }[kind];
  const icon = { error: "⚠️", ok: "✅", warn: "💡", info: "ℹ️" }[kind];
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm flex gap-3 items-start ${cls}`} role={kind === "error" ? "alert" : "status"}>
      <span aria-hidden>{icon}</span>
      <div className="flex-1 min-w-0">{children}</div>
      {onClose && (
        <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="ปิด">
          ✕
        </button>
      )}
    </div>
  );
}

/** Numbered progress bar: ① ข้อมูล → ② ตรวจสอบ → ③ ส่งลิงก์ */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-1 sm:gap-2 mb-6 overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={s} className="flex items-center gap-1 sm:gap-2 shrink-0">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                done ? "bg-green-500 text-gray-950" : now ? "bg-yellow-400 text-gray-950" : "bg-gray-800 text-gray-500"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={`text-sm ${now ? "text-white font-semibold" : "text-gray-500"} ${now ? "" : "hidden sm:inline"}`}>{s}</span>
            {i < steps.length - 1 && <span className="w-4 sm:w-8 h-px bg-gray-700" />}
          </li>
        );
      })}
    </ol>
  );
}

/** Bottom bar of a step: ← ย้อนกลับ | ถัดไป → */
export function StepNav({
  onBack,
  onNext,
  nextLabel = "ถัดไป →",
  backLabel = "← ย้อนกลับ",
  nextDisabled,
  hint,
  danger,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  hint?: ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="mt-8 pt-5 border-t border-gray-800">
      {hint && <p className="text-sm text-gray-400 mb-3">{hint}</p>}
      <div className="flex items-center justify-between gap-3">
        {onBack ? (
          <button type="button" onClick={onBack} className={btnGhost}>
            {backLabel}
          </button>
        ) : (
          <span />
        )}
        {onNext && (
          <button type="button" onClick={onNext} disabled={nextDisabled} className={danger ? btnDanger : btnPrimary}>
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/** Big tappable option (instead of a dropdown). */
export function Choice({
  selected,
  onClick,
  title,
  desc,
  icon,
  badge,
}: {
  selected?: boolean;
  onClick: () => void;
  title: ReactNode;
  desc?: ReactNode;
  icon?: string;
  badge?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full text-left rounded-2xl border-2 p-4 sm:p-5 flex gap-4 items-start transition-colors ${
        selected ? "border-yellow-400 bg-yellow-400/10" : "border-gray-800 bg-gray-900 hover:border-gray-600"
      }`}
    >
      {icon && (
        <span className="text-3xl leading-none" aria-hidden>
          {icon}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2 flex-wrap font-bold text-base sm:text-lg">
          {title}
          {badge}
        </span>
        {desc && <span className="block text-sm text-gray-400 mt-1">{desc}</span>}
      </span>
      {selected !== undefined && (
        <span
          className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center text-xs ${
            selected ? "border-yellow-400 bg-yellow-400 text-gray-950" : "border-gray-600"
          }`}
        >
          {selected ? "✓" : ""}
        </span>
      )}
    </button>
  );
}

export function Field({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`block text-sm font-semibold ${className ?? ""}`}>
      {label}
      {children}
      {hint && <span className="block text-xs font-normal text-gray-500 mt-1">{hint}</span>}
    </label>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 ${className ?? ""}`}>{children}</div>;
}

/** Label / value rows for "ตรวจสอบก่อนยืนยัน" screens. */
export function Summary({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <dl className="divide-y divide-gray-800 rounded-xl border border-gray-800 bg-gray-950">
      {rows.map(([k, v], i) => (
        <div key={i} className="flex justify-between gap-4 px-4 py-3 text-sm">
          <dt className="text-gray-400">{k}</dt>
          <dd className="text-right font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Modal used for money actions — replaces window.prompt / confirm. */
export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto p-6"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none" aria-label="ปิด">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="text-center text-gray-500 py-10 border border-dashed border-gray-800 rounded-2xl">{children}</div>;
}

/** Small pill: สถานะ / หมวด */
export function Pill({ tone = "gray", children }: { tone?: "gray" | "green" | "red" | "yellow" | "blue"; children: ReactNode }) {
  const cls = {
    gray: "bg-gray-800 text-gray-300",
    green: "bg-green-500/15 text-green-300",
    red: "bg-red-500/15 text-red-300",
    yellow: "bg-yellow-400/15 text-yellow-300",
    blue: "bg-blue-500/15 text-blue-300",
  }[tone];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{children}</span>;
}

/** Segmented filter tabs above a list. */
export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: ReactNode }[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onChange(it.id)}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            value === it.id ? "bg-white text-gray-950" : "bg-gray-900 text-gray-300 border border-gray-800 hover:border-gray-600"
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
