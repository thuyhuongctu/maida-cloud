"use client";

import { useI18n } from "./LanguageProvider";

export function Landing() {
  const { t } = useI18n();
  return (
    <main className="landing">
      <span className="eyebrow">{t.tagline}</span>
      <h1>{t.heroTitle}</h1>
      <p className="lede">{t.heroBody}</p>
      <div className="cta">
        <a className="btn" href="/dashboard">{t.ctaDashboard}</a>
        <a className="btn ghost" href="https://doi.org/10.5281/zenodo.21282516">
          {t.ctaSource}
        </a>
      </div>
      <p className="affil">{t.affiliation}</p>
    </main>
  );
}
