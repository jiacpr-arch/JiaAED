"use client";

// /admin/documents — files shown on the website (manuals, specs, certificates).
// Uploading is 3 steps: เลือกไฟล์ → ตั้งชื่อ & หมวด → ตรวจสอบ & อัปโหลด.

import { useCallback, useEffect, useState } from "react";
import { AdminShell, Card, Empty, Field, Notice, Pill, StepNav, Steps, Summary, btnPrimary, btnSmall, inputCls, useAdmin } from "../ui";

type DocRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  public_url: string;
  storage_path: string;
  mime: string;
  size_bytes: number;
  language: string;
  is_published: boolean;
  created_at: string;
};

const CATEGORIES = [
  { value: "manual", label: "📘 คู่มือ" },
  { value: "specification", label: "📐 สเปค/TOR" },
  { value: "certificate", label: "🏅 ใบรับรอง" },
  { value: "brochure", label: "📰 โบรชัวร์" },
  { value: "other", label: "📄 อื่นๆ" },
];
const LANGUAGES = [
  { value: "th", label: "ไทย" },
  { value: "en", label: "English" },
  { value: "th-en", label: "ไทย-English" },
];
const MAX_BYTES = 4 * 1024 * 1024; // Vercel caps request bodies at 4.5 MB.
const labelOf = (list: { value: string; label: string }[], v: string) => list.find((x) => x.value === v)?.label ?? v;

function fmtSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminDocsPage() {
  return (
    <AdminShell title="เอกสารบนเว็บไซต์" subtitle="คู่มือ สเปค ใบรับรอง ที่ลูกค้าดาวน์โหลดได้">
      <Docs />
    </AdminShell>
  );
}

function Docs() {
  const { expire } = useAdmin();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/documents");
      if (res.status === 401) return expire();
      const data = await res.json();
      if (!res.ok || !data.ok) return setError("โหลดรายการไม่สำเร็จ");
      setDocs(data.documents);
    } catch {
      setError("เชื่อมต่อไม่ได้");
    } finally {
      setLoading(false);
    }
  }, [expire]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (d: DocRow) => {
    if (!confirm(`ลบเอกสาร "${d.title}"? ลิงก์เดิมจะใช้ไม่ได้`)) return;
    const res = await fetch(`/api/admin/documents?id=${encodeURIComponent(d.id)}`, { method: "DELETE" });
    if (res.ok) {
      setNotice("ลบแล้ว");
      await load();
    } else setError("ลบไม่สำเร็จ");
  };

  if (uploading) {
    return (
      <UploadWizard
        onCancel={() => setUploading(false)}
        onDone={async () => {
          setUploading(false);
          setNotice("อัปโหลดแล้ว — เอกสารขึ้นบนเว็บเรียบร้อย");
          await load();
        }}
      />
    );
  }

  return (
    <>
      <button onClick={() => setUploading(true)} className={`${btnPrimary} w-full sm:w-auto mb-6 text-lg`}>
        ⬆️ อัปโหลดเอกสารใหม่
      </button>
      {error && (
        <div className="mb-4">
          <Notice kind="error" onClose={() => setError(null)}>
            {error}
          </Notice>
        </div>
      )}
      {notice && (
        <div className="mb-4">
          <Notice kind="ok" onClose={() => setNotice(null)}>
            {notice}
          </Notice>
        </div>
      )}

      <h2 className="font-bold mb-3">เอกสารทั้งหมด ({docs.length})</h2>
      {loading && <p className="text-gray-500 text-sm">กำลังโหลด…</p>}
      {!loading && docs.length === 0 && <Empty>ยังไม่มีเอกสาร — กด “อัปโหลดเอกสารใหม่” เพื่อเริ่ม</Empty>}
      <div className="space-y-3">
        {docs.map((d) => (
          <Card key={d.id} className="!p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Pill tone="yellow">{labelOf(CATEGORIES, d.category)}</Pill>
                  <span className="text-xs text-gray-500">
                    {fmtSize(d.size_bytes)} · {labelOf(LANGUAGES, d.language)}
                  </span>
                </div>
                <div className="font-bold truncate">{d.title}</div>
                {d.description && <div className="text-sm text-gray-400 truncate">{d.description}</div>}
                <div className="flex flex-wrap gap-2 mt-3">
                  <a href={d.public_url} target="_blank" rel="noopener noreferrer" className={btnSmall}>
                    👁️ เปิดดู
                  </a>
                  <button
                    className={btnSmall}
                    onClick={() =>
                      navigator.clipboard.writeText(d.public_url).then(() => {
                        setCopiedId(d.id);
                        setTimeout(() => setCopiedId((c) => (c === d.id ? null : c)), 2000);
                      })
                    }
                  >
                    {copiedId === d.id ? "คัดลอกแล้ว ✓" : "🔗 คัดลอกลิงก์"}
                  </button>
                </div>
              </div>
              <button onClick={() => handleDelete(d)} className="shrink-0 text-xs text-red-400 hover:text-red-300 px-2 py-1">
                ลบ
              </button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function UploadWizard({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("manual");
  const [language, setLanguage] = useState("th");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooBig = file ? file.size > MAX_BYTES : false;

  const pickFile = (f: File | null) => {
    setFile(f);
    setError(null);
    // Pre-fill the title from the file name so the next step is mostly done.
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
  };

  const upload = async () => {
    if (!file || !title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("category", category);
      fd.append("language", language);
      const res = await fetch("/api/admin/documents", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) return setError(`อัปโหลดไม่สำเร็จ: ${data.error ?? "unknown"}${data.detail ? ` (${data.detail})` : ""}`);
      onDone();
    } catch {
      setError("อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const chip = (active: boolean) =>
    `px-4 py-2.5 rounded-xl text-sm font-semibold border-2 ${active ? "border-yellow-400 bg-yellow-400 text-gray-950" : "border-gray-700 hover:border-gray-500"}`;

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="text-xl font-bold">⬆️ อัปโหลดเอกสาร</h2>
        <button onClick={onCancel} className="text-sm text-gray-400 hover:text-white">
          ยกเลิก ✕
        </button>
      </div>
      <Steps steps={["เลือกไฟล์", "ตั้งชื่อ & หมวด", "ตรวจสอบ"]} current={step} />
      {error && (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      )}

      {step === 0 && (
        <>
          <label className="block border-2 border-dashed border-gray-700 hover:border-yellow-400 rounded-2xl p-8 text-center cursor-pointer transition-colors">
            <input type="file" accept=".pdf,.docx,.doc,image/png,image/jpeg" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} className="sr-only" />
            <div className="text-4xl mb-2" aria-hidden>
              📄
            </div>
            {file ? (
              <>
                <div className="font-bold break-all">{file.name}</div>
                <div className={`text-sm mt-1 ${tooBig ? "text-red-300" : "text-gray-400"}`}>{fmtSize(file.size)}</div>
                <div className="text-sm text-yellow-400 mt-3 underline">เปลี่ยนไฟล์</div>
              </>
            ) : (
              <>
                <div className="font-bold">กดเพื่อเลือกไฟล์</div>
                <div className="text-sm text-gray-400 mt-1">PDF / DOCX / รูป · ไม่เกิน 4MB</div>
              </>
            )}
          </label>
          <StepNav
            onBack={onCancel}
            backLabel="ยกเลิก"
            onNext={() => setStep(1)}
            nextDisabled={!file || tooBig}
            hint={tooBig ? <span className="text-red-300">ไฟล์ใหญ่เกิน 4MB — บีบอัด PDF ก่อนอัปโหลด</span> : undefined}
          />
        </>
      )}

      {step === 1 && (
        <div className="grid gap-5">
          <Field label="ชื่อเอกสาร (ลูกค้าเห็นชื่อนี้)">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} autoFocus />
          </Field>
          <Field label="คำอธิบายสั้นๆ (ไม่บังคับ)">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
          </Field>
          <div>
            <p className="text-sm font-semibold mb-2">หมวดหมู่</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.value} type="button" onClick={() => setCategory(c.value)} className={chip(category === c.value)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">ภาษา</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button key={l.value} type="button" onClick={() => setLanguage(l.value)} className={chip(language === l.value)}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <StepNav onBack={() => setStep(0)} onNext={() => setStep(2)} nextDisabled={!title.trim()} hint={!title.trim() ? "ใส่ชื่อเอกสารก่อน" : undefined} />
        </div>
      )}

      {step === 2 && file && (
        <>
          <Summary
            rows={[
              ["ไฟล์", `${file.name} (${fmtSize(file.size)})`],
              ["ชื่อเอกสาร", title.trim()],
              ...(description.trim() ? [["คำอธิบาย", description.trim()] as [string, string]] : []),
              ["หมวดหมู่", labelOf(CATEGORIES, category)],
              ["ภาษา", labelOf(LANGUAGES, language)],
            ]}
          />
          <StepNav onBack={() => setStep(1)} onNext={upload} nextDisabled={busy} nextLabel={busy ? "กำลังอัปโหลด…" : "✓ อัปโหลดขึ้นเว็บ"} />
        </>
      )}
    </Card>
  );
}
