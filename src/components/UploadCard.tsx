"use client";

import { useState } from "react";
import { useI18n } from "./LanguageProvider";
import type { StudyRow } from "./StudiesTable";

export function UploadCard({ onCreated }: { onCreated: (row: StudyRow) => void }) {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);
      fd.append("year", year || "0");
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Extraction failed.");
      onCreated(json.data as StudyRow);
      setFile(null); setTitle(""); setYear("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="upload" onSubmit={submit}>
      <h2>{t.upload}</h2>
      <p className="muted">{t.dropHint}</p>
      <div className="row">
        <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
      </div>
      <div className="row two">
        <input type="text" placeholder={t.fldTitle} value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="number" placeholder={t.fldYear} value={year} onChange={(e) => setYear(e.target.value)} />
      </div>
      {error && <p className="err">{error}</p>}
      <button className="btn" type="submit" disabled={busy || !file}>
        {busy ? t.extracting + "..." : t.extract}
      </button>
    </form>
  );
}
