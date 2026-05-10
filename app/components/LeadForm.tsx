"use client";

import { useState } from "react";
import { products } from "@/lib/aed/products";

const LINE_OA = "https://line.me/R/ti/p/@273fzpzs";
const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;

type State = "idle" | "submitting" | "success" | "error";

function readTracking() {
  if (typeof window === "undefined") return { gclid: null, utm: {} as Record<string, string> };
  try {
    const gclid = localStorage.getItem("jiaaed_gclid");
    const utm: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      const v = localStorage.getItem(`jiaaed_utm_${k}`);
      if (v) utm[k] = v;
    }
    return { gclid, utm };
  } catch {
    return { gclid: null, utm: {} as Record<string, string> };
  }
}

export function LeadForm() {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "submitting") return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const fullName = String(fd.get("fullName") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const company = String(fd.get("company") || "").trim();
    const productId = String(fd.get("productId") || "").trim();
    const message = String(fd.get("message") || "").trim();
    const hp = String(fd.get("hp_field") || "");

    if (!phone && !email) {
      setErrorMsg("กรุณากรอกเบอร์โทรหรืออีเมลอย่างน้อย 1 อย่าง");
      setState("error");
      return;
    }

    setState("submitting");
    setErrorMsg(null);

    const { gclid, utm } = readTracking();

    try {
      const res = await fetch("/api/aed/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source: "lead_form",
          fullName,
          phone,
          email,
          company,
          productId,
          message,
          gclid,
          utm,
          pageUrl: typeof window !== "undefined" ? window.location.href : null,
          hp,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };

      if (!res.ok || !json.ok) {
        setErrorMsg(json.message || "ส่งไม่สำเร็จ ลองใหม่อีกครั้งหรือทักทาง LINE");
        setState("error");
        return;
      }

      const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
      if (typeof gtag === "function") {
        gtag("event", "lead_form_submit", {
          product_id: productId || null,
        });
        const gAdsId = process.env.NEXT_PUBLIC_GADS_ID;
        const leadLabel = process.env.NEXT_PUBLIC_GADS_LEAD_CONVERSION_LABEL;
        if (gAdsId && leadLabel) {
          gtag("event", "conversion", {
            send_to: `${gAdsId}/${leadLabel}`,
          });
        }
      }

      setState("success");
      form.reset();
    } catch (err) {
      console.error("[lead form] submit failed:", err);
      setErrorMsg("เกิดข้อผิดพลาดเครือข่าย ลองใหม่อีกครั้ง");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/5 p-8 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h3 className="text-2xl font-bold text-white mb-2">ได้รับข้อมูลแล้ว!</h3>
        <p className="text-gray-300 mb-6">
          ทีมงานเจี่ยรักษาจะติดต่อกลับภายใน 24 ชั่วโมง — หากเร่งด่วนคุยทาง LINE ได้ทันที
        </p>
        <a
          href={LINE_OA}
          target="_blank"
          rel="noopener noreferrer"
          data-line-cta="lead_success"
          className="inline-block bg-[#06C755] text-white font-bold px-8 py-3 rounded-full hover:bg-[#05a847] transition-colors"
        >
          💬 ทักทาง LINE
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-gray-800 bg-gray-900 p-6 md:p-8 space-y-4"
      noValidate
    >
      {/* honeypot — hidden from real users */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px" }}>
        <label>
          กรอกตรงนี้ห้ามกรอก
          <input type="text" name="hp_field" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="ชื่อ-นามสกุล" name="fullName" placeholder="คุณ..." />
        <Field label="บริษัท / องค์กร (ถ้ามี)" name="company" placeholder="บริษัท..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="เบอร์โทร"
          name="phone"
          type="tel"
          placeholder="08x-xxx-xxxx"
          inputMode="tel"
          autoComplete="tel"
        />
        <Field
          label="อีเมล"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">รุ่นที่สนใจ</label>
        <select
          name="productId"
          defaultValue=""
          className="w-full rounded-xl bg-gray-950 border border-gray-700 px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
        >
          <option value="">— ยังไม่ระบุ —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.subtitle}) — ฿{p.price.toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">ข้อความ (ถ้ามี)</label>
        <textarea
          name="message"
          rows={3}
          placeholder="อยากทราบราคาพิเศษสำหรับองค์กร, ต้องการนัดสาธิต, ฯลฯ"
          className="w-full rounded-xl bg-gray-950 border border-gray-700 px-4 py-3 text-white focus:border-yellow-400 focus:outline-none resize-y"
        />
      </div>

      {state === "error" && errorMsg && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full bg-yellow-400 text-yellow-900 font-bold text-lg py-4 rounded-full hover:bg-yellow-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state === "submitting" ? "กำลังส่ง..." : "📨 ส่งข้อมูลให้เจี่ยติดต่อกลับ"}
      </button>

      <p className="text-xs text-gray-500 text-center">
        เราใช้ข้อมูลของคุณเพื่อติดต่อกลับเรื่องสินค้า AED Amoul i7 เท่านั้น
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  inputMode,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  inputMode?: "tel" | "text" | "email" | "numeric";
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-gray-300 mb-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className="w-full rounded-xl bg-gray-950 border border-gray-700 px-4 py-3 text-white placeholder:text-gray-600 focus:border-yellow-400 focus:outline-none"
      />
    </div>
  );
}
