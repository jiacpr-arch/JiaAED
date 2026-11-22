"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/aed/analytics-client";
import { hasMarketingConsent } from "@/lib/aed/consent";
import { readGaClientId } from "@/lib/aed/ga4";
import { newEventId, readFbTracking } from "@/lib/aed/fb-tracking";
import { fireLeadConversions } from "@/lib/aed/lead-conversions-client";
import { LINE_DISPLAY_ID, LINE_OA } from "@/lib/aed/line";
import { GPS_RENTAL_LEAD, QUOTE_NEEDS, type QuoteNeed } from "@/lib/aed/gps-rental-page";

const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;

function readAttribution() {
  const utm: Record<string, string> = {};
  let gclid: string | null = null;
  try {
    gclid = localStorage.getItem("jiaaed_gclid");
    for (const k of UTM_KEYS) {
      const v = localStorage.getItem(`jiaaed_utm_${k}`);
      if (v) utm[k] = v;
    }
  } catch {
    // storage blocked — the page URL (sent below) still carries the query string
  }
  return { gclid, utm };
}

// Anchors elsewhere on the page (#quote-demo, #quote-project …) preselect the need.
function needFromHash(): QuoteNeed | null {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/^#quote-(\w+)$/);
  const id = m?.[1] as QuoteNeed | undefined;
  return id && QUOTE_NEEDS.some((n) => n.id === id) ? id : null;
}

type State = "idle" | "submitting" | "done" | "error";

export function GpsQuoteForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [need, setNeed] = useState<QuoteNeed>("rent");
  const started = useRef(false);

  useEffect(() => {
    // #quote-<need> isn't an element id, so the browser won't scroll to it.
    const apply = () => {
      const n = needFromHash();
      if (!n) return;
      setNeed(n);
      document.getElementById("quote")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "submitting") return;
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) || "").trim();
    const phone = get("phone");
    if (!phone) return fail("กรุณากรอกเบอร์โทร");
    if (!fd.get("consent")) return fail("กรุณายินยอมให้ติดต่อกลับเพื่อส่งใบเสนอราคา");

    setState("submitting");
    setError(null);
    const needLabel = QUOTE_NEEDS.find((n) => n.id === need)?.label ?? need;
    const message = [
      `[เช่า AED GPS 4G] ${needLabel}`,
      get("province") && `จังหวัด: ${get("province")}`,
      get("lineId") && `LINE ID: ${get("lineId")}`,
    ]
      .filter(Boolean)
      .join(" · ");
    const { gclid, utm } = readAttribution();
    const fb = readFbTracking();
    const eventId = newEventId();

    try {
      const res = await fetch("/api/aed/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source: GPS_RENTAL_LEAD.source,
          productId: GPS_RENTAL_LEAD.productId,
          fullName: get("fullName"),
          company: get("company") || undefined,
          phone,
          unitCount: get("unitCount") || undefined,
          message,
          gclid,
          utm,
          fbclid: fb.fbclid,
          fbc: fb.fbc,
          fbp: fb.fbp,
          eventId,
          pageUrl: window.location.href,
          hp: get("hp_field"),
          marketingConsent: hasMarketingConsent(),
          gaClientId: readGaClientId(hasMarketingConsent()),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; skipped?: string; leadId?: string };
      if (!res.ok || !json.ok) {
        trackEvent("lead_form_error", { variant: GPS_RENTAL_LEAD.variant, error: json.error ?? "unknown" });
        return fail(
          json.error === "invalid_phone"
            ? "เบอร์โทรไม่ถูกต้อง กรุณาใส่เบอร์ 10 หลัก เช่น 0812345678"
            : json.error === "rate_limited"
              ? "ส่งบ่อยเกินไป กรุณาลองใหม่ภายหลัง หรือทัก LINE"
              : "ส่งไม่สำเร็จ กรุณาลองใหม่ หรือทัก LINE",
        );
      }
      // Conversions fire only for a lead the server stored — never for a honeypot skip.
      if (!json.skipped) fireLeadConversions({ variant: GPS_RENTAL_LEAD.variant, productId: GPS_RENTAL_LEAD.productId, leadId: json.leadId, eventId });
      setState("done");
    } catch {
      fail("เครือข่ายขัดข้อง ลองใหม่อีกครั้ง");
    }
  }

  function fail(msg: string) {
    setError(msg);
    setState("error");
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-teal-300 bg-teal-50 p-6 text-center" role="status" data-testid="quote-thanks">
        <p className="m-0 text-lg font-extrabold text-[#0b2545]">ขอบคุณครับ ได้รับคำขอแล้ว</p>
        <p className="m-0 mt-2 text-sm text-slate-600">ทีมงานจะติดต่อกลับเพื่อส่งใบเสนอราคาภายใน 24 ชม. (วันทำการ)</p>
        <a
          href={LINE_OA}
          target="_blank"
          rel="noopener noreferrer"
          data-line-cta="gps_rental_thanks"
          data-product="yuwell-gps"
          className="mt-4 inline-block rounded-xl bg-[#06C755] px-5 py-3 text-sm font-bold text-white"
        >
          คุยต่อทาง LINE {LINE_DISPLAY_ID}
        </a>
      </div>
    );
  }

  const input = "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 focus:border-[#0f9b8e] focus:outline-none";
  const label = "mb-1 block text-xs font-bold text-slate-600";

  return (
    <form
      onSubmit={onSubmit}
      onFocus={() => {
        if (!started.current) {
          started.current = true;
          trackEvent("lead_form_start", { variant: GPS_RENTAL_LEAD.variant });
        }
      }}
      noValidate
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
      data-testid="quote-form"
    >
      <div aria-hidden="true" style={{ display: "none" }}>
        <input type="text" name="hp_field" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className={label}>ต้องการ</legend>
        <div className="flex flex-wrap gap-2">
          {QUOTE_NEEDS.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setNeed(n.id)}
              aria-pressed={need === n.id}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${need === n.id ? "border-[#0b2545] bg-[#0b2545] text-white" : "border-slate-300 text-slate-700"}`}
            >
              {n.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="q-name">ชื่อผู้ติดต่อ</label>
          <input id="q-name" name="fullName" autoComplete="name" className={input} />
        </div>
        <div>
          <label className={label} htmlFor="q-company">บริษัท / องค์กร</label>
          <input id="q-company" name="company" autoComplete="organization" className={input} />
        </div>
        <div>
          <label className={label} htmlFor="q-phone">เบอร์โทร *</label>
          <input id="q-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className={input} placeholder="08x-xxx-xxxx" />
        </div>
        <div>
          <label className={label} htmlFor="q-line">LINE ID (ถ้ามี)</label>
          <input id="q-line" name="lineId" className={input} />
        </div>
        <div>
          <label className={label} htmlFor="q-province">จังหวัด</label>
          <input id="q-province" name="province" autoComplete="address-level1" className={input} placeholder="เช่น กรุงเทพฯ" />
        </div>
        <div>
          <label className={label} htmlFor="q-units">จำนวนเครื่อง</label>
          <select id="q-units" name="unitCount" className={input} defaultValue="1">
            <option value="1">1 เครื่อง</option>
            <option value="2-4">2–4 เครื่อง</option>
            <option value="5-9">5–9 เครื่อง</option>
            <option value="10-49">10–49 เครื่อง</option>
            <option value="50+">50 เครื่องขึ้นไป</option>
          </select>
        </div>
      </div>

      <label className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-600">
        <input type="checkbox" name="consent" value="yes" className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          ยินยอมให้ บริษัท เจี่ยรักษา จำกัด ใช้ข้อมูลนี้ติดต่อกลับเพื่อเสนอราคาและให้คำปรึกษาเรื่อง AED ตาม{" "}
          <a href="/privacy" className="underline">นโยบายความเป็นส่วนตัว</a>
        </span>
      </label>

      {state === "error" && error && <p className="m-0 mt-3 text-sm font-bold text-red-600" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="mt-4 w-full rounded-xl bg-[#f59e0b] px-6 py-3.5 text-base font-extrabold text-[#0b2545] transition hover:bg-[#fbbf24] disabled:opacity-60"
      >
        {state === "submitting" ? "กำลังส่ง…" : "ขอใบเสนอราคา"}
      </button>
      <a
        href={LINE_OA}
        target="_blank"
        rel="noopener noreferrer"
        data-line-cta="gps_rental_form_alt"
        data-product="yuwell-gps"
        className="mt-2 block rounded-xl bg-[#06C755] px-6 py-3 text-center text-sm font-bold text-white"
      >
        หรือปรึกษาทาง LINE {LINE_DISPLAY_ID}
      </a>
    </form>
  );
}
