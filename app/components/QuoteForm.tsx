"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/aed/analytics-client";
import { readFbTracking, newEventId, fireMetaLead } from "@/lib/aed/fb-tracking";

const LINE_OA = "https://line.me/R/ti/p/@273fzpzs";
const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;
const UNIT_OPTIONS = ["1 เครื่อง", "2–10 เครื่อง", "มากกว่า 10 เครื่อง"] as const;

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

// Org-level quote form: organization + unit count + special requirements up front.
// Posts to the same /api/aed/lead endpoint as LeadForm.
export function QuoteForm({
  variant = "quote_form",
  productId = "",
}: {
  variant?: string;
  productId?: string;
}) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const viewedRef = useRef(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  function handleFieldFocus() {
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent("lead_form_start", { variant });
    }
  }

  useEffect(() => {
    function onBeforeUnload() {
      if (!startedRef.current || submittedRef.current) return;
      trackEvent("lead_form_abandon", { variant }, { beacon: true });
      const form = formRef.current;
      if (!form || typeof navigator.sendBeacon !== "function") return;
      const fd = new FormData(form);
      const phone = String(fd.get("phone") || "").trim();
      const email = String(fd.get("email") || "").trim();
      if (!phone && !email) return;
      const { gclid, utm } = readTracking();
      const payload = JSON.stringify({
        variant,
        fullName: String(fd.get("fullName") || "").trim(),
        phone,
        email,
        company: String(fd.get("company") || "").trim(),
        productId,
        unitCount: String(fd.get("unitCount") || "").trim(),
        message: String(fd.get("message") || "").trim(),
        gclid,
        utm,
        pageUrl: window.location.href,
      });
      try {
        navigator.sendBeacon("/api/aed/lead-partial", new Blob([payload], { type: "application/json" }));
      } catch {
        // best-effort
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [variant, productId]);

  useEffect(() => {
    const el = formRef.current;
    if (!el || viewedRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !viewedRef.current) {
            viewedRef.current = true;
            trackEvent("lead_form_view", { variant });
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [variant]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "submitting") return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const fullName = String(fd.get("fullName") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const company = String(fd.get("company") || "").trim();
    const unitCount = String(fd.get("unitCount") || "").trim();
    const requirements = String(fd.get("message") || "").trim();
    const hp = String(fd.get("hp_field") || "");

    if (!phone && !email) {
      setErrorMsg("กรุณากรอกเบอร์โทรหรืออีเมลอย่างน้อย 1 อย่าง");
      setState("error");
      return;
    }

    setState("submitting");
    setErrorMsg(null);

    const { gclid, utm } = readTracking();
    const fb = readFbTracking();
    const eventId = newEventId();
    const message = requirements ? `ความต้องการพิเศษ: ${requirements}` : "";

    try {
      const res = await fetch("/api/aed/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source: variant,
          fullName,
          phone,
          email,
          company,
          productId,
          unitCount,
          message,
          gclid,
          utm,
          fbclid: fb.fbclid,
          fbc: fb.fbc,
          fbp: fb.fbp,
          eventId,
          pageUrl: typeof window !== "undefined" ? window.location.href : null,
          hp,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        skipped?: string;
      };

      if (!res.ok || !json.ok) {
        setErrorMsg(json.message || "ส่งไม่สำเร็จ ลองใหม่อีกครั้งหรือทักทาง LINE");
        setState("error");
        return;
      }

      submittedRef.current = true;
      if (!json.skipped) {
        trackEvent("lead_form_submit", { variant, product_id: productId || "none" });
        const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
        if (typeof gtag === "function") {
          gtag("event", "lead_form_submit", { product_id: productId || null });
          const gAdsId = process.env.NEXT_PUBLIC_GADS_ID;
          const leadLabel = process.env.NEXT_PUBLIC_GADS_LEAD_CONVERSION_LABEL;
          if (gAdsId && leadLabel) {
            gtag("event", "conversion", { send_to: `${gAdsId}/${leadLabel}` });
          }
        }
        fireMetaLead(eventId);
      }

      setState("success");
      form.reset();
    } catch (err) {
      console.error("[quote form] submit failed:", err);
      setErrorMsg("เกิดข้อผิดพลาดเครือข่าย ลองใหม่อีกครั้ง");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/5 p-8 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h3 className="text-2xl font-bold text-white mb-2">รับข้อมูลแล้ว!</h3>
        <p className="text-gray-300 mb-6">
          ทีมงานเจี่ยรักษาจะจัดทำ Proposal และติดต่อกลับโดยเร็วที่สุด — หากเร่งด่วนคุยทาง LINE ได้ทันที
        </p>
        <a
          href={LINE_OA}
          target="_blank"
          rel="noopener noreferrer"
          data-line-cta="quote_success"
          className="inline-block bg-[#06C755] text-white font-bold px-8 py-3 rounded-full hover:bg-[#05a847] transition-colors"
        >
          💬 ทักทาง LINE
        </a>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onFocus={handleFieldFocus}
      className="rounded-2xl border border-gray-800 bg-gray-900 p-6 md:p-8 space-y-4"
      noValidate
    >
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px" }}>
        <label>
          กรอกตรงนี้ห้ามกรอก
          <input type="text" name="hp_field" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field label="ชื่อองค์กร / บริษัท" name="company" placeholder="บริษัท..." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="ชื่อผู้ติดต่อ" name="fullName" placeholder="คุณ..." />
        <Field label="เบอร์โทร" name="phone" type="tel" placeholder="08x-xxx-xxxx" inputMode="tel" autoComplete="tel" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="อีเมล" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
        <div>
          <label htmlFor="unitCount" className="block text-sm font-semibold text-gray-300 mb-2">
            จำนวนเครื่อง AED ที่ต้องการ
          </label>
          <select
            id="unitCount"
            name="unitCount"
            defaultValue=""
            className="w-full rounded-xl bg-gray-950 border border-gray-700 px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
          >
            <option value="">— เลือก —</option>
            {UNIT_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-gray-300 mb-2">
          รายละเอียดเพิ่มเติม / ความต้องการพิเศษ
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          placeholder="เช่น ต้องการแพ็กเกจไหน, จุดติดตั้ง, นัดสำรวจพื้นที่ ฯลฯ"
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
        {state === "submitting" ? "กำลังส่ง..." : "📨 ขอรับใบเสนอราคา"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        ⚡ ทีมงานเจี่ยรักษาจัดทำ Proposal + ราคาพิเศษองค์กร · ใช้ข้อมูลเพื่อติดต่อเรื่อง AED เท่านั้น
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
