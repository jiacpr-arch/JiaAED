"use client";

import { useEffect, useRef, useState } from "react";

import { LINE_OA, LINE_OA_ID } from "@/lib/aed/line";

const LINE_ID = LINE_OA_ID;

// Shown on desktop when a LINE CTA is clicked. line.me add-friend links only
// work inside the LINE mobile app, so on a desktop browser the click would
// otherwise land on a dead page — the #1 reason clicks never become real adds.
// Here we give desktop users three real paths: scan a QR with their phone,
// copy the LINE ID to search, or fall back to the lead form (which converts
// without LINE at all and is already wired to Google Ads).
export function LineFallbackModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [hasQr, setHasQr] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Keyboard a11y: focus moves into the dialog on open and back to whatever
  // had it (usually the LINE button) on close; Escape closes; Tab cycles
  // inside the dialog instead of wandering into the page behind the overlay.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusables = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>("button, a[href], [tabindex]:not([tabindex='-1'])") ?? [],
      );
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && (document.activeElement === lastItem || !dialog?.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, []);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(LINE_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the ID is shown on screen anyway */
    }
  };

  const goToForm = () => {
    onClose();
    const form = document.querySelector("form");
    if (form) {
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = form.querySelector<HTMLInputElement>('input:not([type="hidden"])');
      setTimeout(() => input?.focus(), 400);
    } else {
      window.location.href = "/#contact";
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="line-fallback-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-gray-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="absolute right-3 top-3 text-2xl leading-none text-gray-400 hover:text-gray-700"
        >
          ×
        </button>

        <h2 id="line-fallback-title" className="mb-1 text-center text-lg font-bold">📱 เพิ่มเพื่อนทาง LINE</h2>
        <p className="mb-4 text-center text-sm text-gray-500">
          {hasQr
            ? "สแกน QR ด้วยมือถือ หรือค้นหา ID ในแอป LINE"
            : "เปิดแอป LINE บนมือถือ แล้วค้นหา ID ด้านล่าง"}
        </p>

        {hasQr && (
          // Owner: export the official QR from LINE OA Manager and save it as
          // public/images/line-qr.png. Until then this hides itself gracefully.
          <div className="mb-4 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/line-qr.png"
              alt="LINE QR code"
              width={180}
              height={180}
              className="rounded-lg border border-gray-200"
              onError={() => setHasQr(false)}
            />
          </div>
        )}

        <button
          type="button"
          onClick={copyId}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
        >
          {copied ? "✓ คัดลอกแล้ว" : `คัดลอก LINE ID: ${LINE_ID}`}
        </button>

        <a
          href={LINE_OA}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 block w-full rounded-full bg-[#06C755] px-4 py-3 text-center text-sm font-bold text-white hover:bg-[#05a847]"
        >
          เปิด LINE (ถ้ามีแอปบนเครื่อง)
        </a>

        <button
          type="button"
          onClick={goToForm}
          className="block w-full text-center text-sm font-semibold text-gray-500 underline hover:text-gray-800"
        >
          ไม่สะดวกใช้ LINE? ฝากเบอร์ให้เราโทรกลับ →
        </button>
      </div>
    </div>
  );
}
