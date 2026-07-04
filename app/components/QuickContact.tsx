"use client";

import { useState } from "react";
import { MiniLeadForm } from "./MiniLeadForm";

import { LINE_OA } from "@/lib/aed/line";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/aed/contact";

/**
 * Prime "quick contact" slot under the hero. Real visitor behaviour shows people
 * prefer tapping LINE over filling the callback form by a wide margin, so LINE is
 * the primary action here and the phone form is a secondary, opt-in fallback for
 * the minority who'd rather get a call back.
 */
export function QuickContact() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="rounded-2xl border border-[#06C755]/30 bg-gradient-to-br from-[#06C755]/10 to-transparent p-5 md:p-6">
      <div className="text-center mb-4">
        <p className="font-bold text-white text-lg">💬 ถามราคา / ขอใบเสนอราคา ทาง LINE</p>
        <p className="text-xs text-gray-400 mt-1">
          แอดมินตอบไว ส่งสเปกและใบเสนอราคาให้ในแชทได้ทันที · 24 ชั่วโมง
        </p>
      </div>

      <a
        href={LINE_OA}
        target="_blank"
        rel="noopener noreferrer"
        data-line-cta="quick_contact"
        className="block text-center bg-[#06C755] text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-[#05a847] transition-all hover:scale-[1.01] shadow-2xl shadow-[#06C755]/30"
      >
        💬 ทักไลน์ตอบทันที
      </a>

      <a
        href={PHONE_HREF}
        data-cta="tel_quick_contact"
        className="mt-3 block text-center border border-gray-600 hover:border-yellow-400 text-white font-bold text-base px-8 py-3 rounded-full transition-colors"
      >
        📞 โทร {PHONE_DISPLAY}
      </a>

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-3 w-full text-center text-sm text-gray-400 hover:text-yellow-400 transition-colors underline underline-offset-4"
        >
          ไม่สะดวกใช้ LINE? ฝากเบอร์ให้โทรกลับ →
        </button>
      ) : (
        <div className="mt-4">
          <MiniLeadForm />
        </div>
      )}
    </div>
  );
}
