"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent as sharedTrack } from "@/lib/aed/analytics-client";

const LINE_OA = "https://line.me/R/oaMessage/@jiacpr/?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%88+AED+%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A";
const STORAGE_KEY = "jiaaed_web_chat_v1";
const GREETING =
  "สวัสดีครับ 🙏 ผมเจี่ย — AI ผู้ช่วยขาย AED Amoul i7\n\nสนใจสอบถามเรื่องอะไรครับ? ราคา สเปค การติดตั้ง หรือคำแนะนำเลือกรุ่น?";

type Msg = { role: "user" | "assistant"; content: string };

function loadHistory(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Msg[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-30);
  } catch {
    return [];
  }
}

function saveHistory(history: Msg[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-30)));
  } catch {
    /* quota / private mode — ignore */
  }
}

function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === "function") gtag("event", name, params ?? {});
  const sharedProps: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v === null) sharedProps[k] = null;
    else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") sharedProps[k] = v;
  }
  void sharedTrack(name, sharedProps);
}

function renderMessage(text: string): React.ReactNode {
  // Render simple markdown-style links [text](#section) → <a>; otherwise plain
  const parts: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const [, label, href] = match;
    const isLine = href.includes("line.me");
    parts.push(
      <a
        key={`l-${i++}`}
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        data-line-cta={isLine ? "web_chat_link" : undefined}
        className="text-yellow-400 underline hover:text-yellow-300"
      >
        {label}
      </a>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 0 ? text : parts;
}

export function WebChat() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate from localStorage after mount
  useEffect(() => {
    const stored = loadHistory();
    if (stored.length > 0) {
      setHistory(stored);
    } else {
      setHistory([{ role: "assistant", content: GREETING }]);
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) saveHistory(history);
  }, [history]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, open, loading]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      trackEvent("web_chat_open");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Msg = { role: "user", content: text };
    const next = [...history, userMsg];
    setHistory(next);
    setInput("");
    setError(null);
    setLoading(true);
    trackEvent("web_chat_message_sent", {
      turn: next.filter((m) => m.role === "user").length,
      text: text.slice(0, 400),
    });

    try {
      const res = await fetch("/api/aed/web-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m) => !(m.role === "assistant" && m.content === GREETING)),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        reply?: string;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.reply) {
        setError("ขออภัย ระบบขัดข้องชั่วคราว ลองอีกครั้งหรือทักทาง LINE");
        setLoading(false);
        return;
      }
      setHistory((prev) => [...prev, { role: "assistant", content: json.reply! }]);
    } catch {
      setError("เครือข่ายมีปัญหา ลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  function reset() {
    setHistory([{ role: "assistant", content: GREETING }]);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    trackEvent("web_chat_reset");
  }

  return (
    <>
      {/* Floating bubble */}
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? "ปิดแชท" : "เปิดแชท AI"}
        className={`fixed bottom-5 right-5 z-50 rounded-full shadow-2xl transition-all ${
          open
            ? "bg-gray-800 hover:bg-gray-700 w-12 h-12"
            : "bg-yellow-400 hover:bg-yellow-300 px-5 py-3 flex items-center gap-2"
        }`}
      >
        {open ? (
          <span className="text-white text-xl">✕</span>
        ) : (
          <>
            <span className="text-2xl">💬</span>
            <span className="font-bold text-yellow-900 hidden sm:inline">ถาม AI เจี่ย</span>
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-md h-[70vh] max-h-[600px] rounded-2xl bg-gray-950 border border-gray-700 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-900/40 to-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">❤️</span>
              <div>
                <div className="font-bold text-white text-sm">เจี่ย AI</div>
                <div className="text-xs text-gray-400">ผู้ช่วยขาย AED · ออนไลน์</div>
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-gray-500 hover:text-yellow-400"
              title="เริ่มแชทใหม่"
            >
              ↻ ใหม่
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {history.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === "user"
                      ? "bg-yellow-400 text-yellow-900"
                      : "bg-gray-800 text-gray-100 border border-gray-700"
                  }`}
                >
                  {renderMessage(m.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-sm text-gray-500">
                  <span className="inline-block animate-pulse">เจี่ยกำลังพิมพ์...</span>
                </div>
              </div>
            )}
            {error && (
              <div className="text-xs text-red-400 text-center py-2">{error}</div>
            )}
          </div>

          {/* Quick actions */}
          <div className="px-4 py-2 border-t border-gray-800 flex gap-2 overflow-x-auto">
            <a
              href="#contact"
              onClick={() => {
                setOpen(false);
                trackEvent("web_chat_contact_click");
              }}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-yellow-400 px-3 py-1.5 rounded-full whitespace-nowrap border border-yellow-400/30"
            >
              📨 ขอใบเสนอราคา
            </a>
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="web_chat_quick"
              className="text-xs bg-[#06C755] hover:bg-[#05a847] text-white px-3 py-1.5 rounded-full whitespace-nowrap"
            >
              💬 LINE
            </a>
          </div>

          {/* Input */}
          <div className="border-t border-gray-800 p-3 bg-gray-900">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="พิมพ์คำถาม..."
                rows={1}
                disabled={loading}
                className="flex-1 resize-none bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:border-yellow-400 focus:outline-none max-h-32"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={loading || !input.trim()}
                className="bg-yellow-400 text-yellow-900 font-bold rounded-xl px-4 py-2 text-sm hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ส่ง
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-1">AI อาจให้ข้อมูลคลาดเคลื่อน · สำหรับราคาแน่นอน ทัก LINE หรือกรอกฟอร์ม</p>
          </div>
        </div>
      )}
    </>
  );
}
