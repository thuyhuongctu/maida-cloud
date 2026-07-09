"use client";

import { useState } from "react";
import { useI18n } from "./LanguageProvider";
import { UploadCard } from "./UploadCard";
import type { StudyRow } from "./StudiesTable";

const FIELDS: { key: keyof StudyRow; label: string }[] = [
  { key: "effectR", label: "r" },
  { key: "effectT", label: "t" },
  { key: "effectDf", label: "df" },
  { key: "effectBeta", label: "beta" },
];

export function ReviewPanel({ initial }: { initial: StudyRow[] }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<StudyRow[]>(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, number | null>>({});

  function upsert(row: StudyRow) {
    setRows((prev) => {
      const i = prev.findIndex((r) => r.id === row.id);
      if (i === -1) return [row, ...prev];
      const next = [...prev]; next[i] = row; return next;
    });
  }

  function startReview(row: StudyRow) {
    setOpenId(row.id);
    setDraft({
      effectR: row.effectR, effectT: row.effectT ?? null,
      effectDf: row.effectDf ?? null, effectBeta: row.effectBeta ?? null,
    });
  }

  async function save(id: string, approved: boolean) {
    const overrides: Record<string, number | null> = {};
    for (const f of FIELDS) {
      const v = draft[f.key as string];
      if (v !== undefined) overrides[f.key as string] = v;
    }
    const res = await fetch(`/api/studies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldOverrides: overrides, approved, notes: "" }),
    });
    const json = await res.json();
    if (res.ok) { upsert(json.data as StudyRow); if (approved) setOpenId(null); }
  }

  async function lock(id: string) {
    if (!window.confirm(t.lockConfirm)) return;
    const res = await fetch(`/api/studies/${id}/lock`, { method: "POST" });
    const json = await res.json();
    if (res.ok) { upsert(json.data as StudyRow); setOpenId(null); }
  }

  return (
    <div className="panel">
      <UploadCard onCreated={upsert} />

      <section className="dash">
        <h1>{t.dashTitle}</h1>
        <p className="muted">{rows.length} {t.recent}.</p>
        {rows.length === 0 ? (
          <p className="empty">{t.empty}</p>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.colPaper}</th><th>{t.colYear}</th><th>{t.colR}</th>
                  <th>{t.colConf}</th><th>{t.colStatus}</th><th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <FragmentRow
                    key={s.id}
                    s={s} t={t} open={openId === s.id} draft={draft} setDraft={setDraft}
                    onReview={() => startReview(s)} onClose={() => setOpenId(null)}
                    onSave={() => save(s.id, false)} onApprove={() => save(s.id, true)} onLock={() => lock(s.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function FragmentRow(props: {
  s: StudyRow; t: Record<string, string>; open: boolean;
  draft: Record<string, number | null>; setDraft: (d: Record<string, number | null>) => void;
  onReview: () => void; onClose: () => void; onSave: () => void; onApprove: () => void; onLock: () => void;
}) {
  const { s, t, open, draft, setDraft } = props;
  const status = s.piLocked ? "locked" : s.requiresVerification ? "review" : "approved";
  const statusLabel = s.piLocked ? t.statusLocked : s.requiresVerification ? t.statusReview : t.statusApproved;
  return (
    <>
      <tr>
        <td>{s.paperTitle || t.untitled}</td>
        <td className="num">{s.year || ""}</td>
        <td className="num">{s.effectR !== null ? s.effectR.toFixed(3) : ""}</td>
        <td className="num">{s.extractionConfidence.toFixed(1)}</td>
        <td><span className={"chip " + status}>{statusLabel}</span></td>
        <td className="act">
          {!s.piLocked && (
            <button className="link" onClick={open ? props.onClose : props.onReview}>
              {open ? t.close : t.review}
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr className="editor">
          <td colSpan={6}>
            <div className="fields">
              {FIELDS.map((f) => (
                <label key={f.key}>
                  <span>{f.label}</span>
                  <input
                    type="number" step="any"
                    value={draft[f.key] ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, [f.key]: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="actions">
              <button className="btn small" onClick={props.onSave}>{t.save}</button>
              <button className="btn small ghost" onClick={props.onApprove}>{t.approve}</button>
              <button className="btn small lock" onClick={props.onLock} disabled={s.requiresVerification}>{t.lock}</button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

const FIELDS_TYPED = FIELDS;
export { FIELDS_TYPED };
