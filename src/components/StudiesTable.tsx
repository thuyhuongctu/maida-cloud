"use client";

import { useI18n } from "./LanguageProvider";

export interface StudyRow {
  id: string;
  paperTitle: string;
  year: number;
  effectR: number | null;
  effectT: number | null;
  effectDf: number | null;
  effectBeta: number | null;
  extractionConfidence: number;
  piLocked: boolean;
  requiresVerification: boolean;
}

export function StudiesTable({ rows }: { rows: StudyRow[] }) {
  const { t } = useI18n();
  return (
    <section className="dash">
      <h1>{t.dashTitle}</h1>
      <p className="muted">{rows.length} {t.recent}.</p>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>{t.colPaper}</th>
              <th>{t.colYear}</th>
              <th>{t.colR}</th>
              <th>{t.colConf}</th>
              <th>{t.colStatus}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>{s.paperTitle || t.untitled}</td>
                <td className="num">{s.year || ""}</td>
                <td className="num">{s.effectR !== null ? s.effectR.toFixed(3) : ""}</td>
                <td className="num">{s.extractionConfidence.toFixed(1)}</td>
                <td>
                  <span
                    className={
                      "chip " +
                      (s.piLocked ? "locked" : s.requiresVerification ? "review" : "approved")
                    }
                  >
                    {s.piLocked ? t.statusLocked : s.requiresVerification ? t.statusReview : t.statusApproved}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
