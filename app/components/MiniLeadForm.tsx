"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/aed/analytics-client";

type State = "idle" | "submitting" | "success" | "error";

const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;

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

export function MiniLeadForm({ variant = "mini" }: { variant?: string } = {}) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const startedRef = useRef(false);
  const viewedRef = useRef(false);
  const formRef = useRef<HTMLFormElement | null>(null);

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
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [variant]);

  const focusedFieldsRef = useRef<Set<string>>(new Set());
  const submittedRef = useRef(false);

  useEffect(() => {
    function onBeforeUnload() {
      if (!startedRef.current || submittedRef.current) return;
      const form = formRef.current;
      if (!form || typeof navigator.sendBeacon !== "function") return;
      const fd = new FormData(form);
      const phone = String(fd.get("phone") || "").trim();
      const fullName = String(fd.get("fullName") || "").trim();
      if (!phone) return;

      trackEvent("lead_form_abandon", { variant }, { beacon: true });

      const { gclid, utm } = readTracking();
      const payload = JSON.stringify({
        variant,
        fullName,
        phone,
        gclid,
        utm,
        pageUrl: window.location.href,
      });
      try {
        navigator.sendBeacon(
          "/api/aed/lead-partial",
          new Blob([payload], { type: "application/json" }),
        );
      } catch {
        // swallow
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [variant]);

  function onFieldFocus(e: React.FocusEvent<HTMLFormElement>) {
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent("lead_form_start", { variant });
    }
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const fieldName = (target as HTMLInputElement | HTMLTextAreaElement).name;
    if (!fieldName || fieldName === "hp_field") return;
    if (focusedFieldsRef.current.has(fieldName)) return;
    focusedFieldsRef.current.add(fieldName);
    trackEvent("lead_form_field_focus", { variant, field: fieldName });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "submitting") return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const fullName = String(fd.get("fullName") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const hp = String(fd.get("hp_field") || "");

    if (!phone) {
      setErrorMsg("กรุณากรอกเบอร์โทร");
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
          source: variant === "ads_mini" ? "ads_mini_form" : "mini_form",
          fullName,
          phone,
          gclid,
          utm,
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
        setErrorMsg(json.message || "ส่งไม่สำเร็จ ลองใหม่หรือทักทาง LINE");
        setState("error");
        return;
      }

      submittedRef.current = true;

      // Only count submissions that actually stored a lead. Honeypot/bot trips
      // return ok:true with `skipped`, and must not fire a phantom conversion.
      if (!json.skipped) {
        trackEvent("lead_form_submit", { variant, product_id: "none" });

        const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
        if (typeof gtag === "function") {
          gtag("event", "lead_form_submit", { variant });
          const gAdsId = process.env.NEXT_PUBLIC_GADS_ID;
          const leadLabel = process.env.NEXT_PUBLIC_GADS_LEAD_CONVERSION_LABEL;
          if (gAdsId && leadLabel) {
            gtag("event", "conversion", {
              send_to: `${gAdsId}/${leadLabel}`,
            });
          }
        }
      }

      setState("success");
      form.reset();
    } catch (err) {
      console.error("[mini lead form] failed:", err);
      setErrorMsg("เครือข่ายขัดข้อง ลองใหม่อีกครั้ง");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl border border-green-400/40 bg-green-400/5 px-5 py-4 text-center">
        <p className="text-green-300 font-semibold">✅ ได้รับเบอร์แล้ว — ทีมงานจะโทรกลับภายใน 24 ชม.</p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onFocus={onFieldFocus}
      className="rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/5 to-transparent p-5 md:p-6"
      noValidate
    >
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px" }}>
        <label>
          ห้ามกรอก
          <input type="text" name="hp_field" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="text-center mb-3">
        <p className="font-bold text-white text-lg">📞 ฝากเบอร์ ทีมงานโทรกลับ</p>
        <p className="text-xs text-gray-500">ใช้เวลา 5 วินาที · ตอบใน 24 ชั่วโมง</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          name="fullName"
          placeholder="ชื่อ (ไม่บังคับ)"
          autoComplete="name"
          className="flex-1 rounded-xl bg-gray-950 border border-gray-700 px-4 py-3 text-white placeholder:text-gray-600 focus:border-yellow-400 focus:outline-none"
        />
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          required
          placeholder="เบอร์โทร *"
          autoComplete="tel"
          className="flex-1 rounded-xl bg-gray-950 border border-gray-700 px-4 py-3 text-white placeholder:text-gray-600 focus:border-yellow-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === "submitting"}
          className="bg-yellow-400 text-yellow-900 font-bold px-6 py-3 rounded-xl hover:bg-yellow-300 transition-colors disabled:opacity-60"
        >
          {state === "submitting" ? "กำลังส่ง…" : "📨 ส่ง"}
        </button>
      </div>
      {state === "error" && errorMsg && (
        <p className="text-red-300 text-sm mt-2 text-center">{errorMsg}</p>
      )}
    </form>
  );
}
