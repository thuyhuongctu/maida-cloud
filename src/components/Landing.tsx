"use client";

import { useI18n } from "./LanguageProvider";

// Worked example. Inputs are illustrative; the outputs follow the
// conversions in src/lib/effect-size.ts (Cohen 1988; Peterson and Brown 2005).
const EXAMPLE_T = { t: 2.41, df: 118, r: 0.217 };
const EXAMPLE_BETA = { beta: 0.23, r: 0.225 };

export function Landing() {
  const { t } = useI18n();
  return (
    <main className="landing">
      <section className="landing-hero">
        <span className="eyebrow">{t.tagline}</span>
        <h1>{t.heroTitle}</h1>
        <p className="lede">{t.heroBody}</p>
        <div className="cta">
          <a className="btn" href="/dashboard">{t.ctaDashboard}</a>
          <a className="btn ghost" href="https://doi.org/10.5281/zenodo.21282516">
            {t.ctaSource}
          </a>
        </div>
      </section>

      <ol className="stages" aria-label={t.stagesLabel}>
        <li className="stage">
          <div className="stage-text">
            <span className="stage-num">01</span>
            <h2>{t.s1Title}</h2>
            <p>{t.s1Body}</p>
          </div>
          <figure className="stage-proof">
            <dl className="calc">
              <div><dt>t</dt><dd>{EXAMPLE_T.t.toFixed(2)}</dd></div>
              <div><dt>df</dt><dd>{EXAMPLE_T.df}</dd></div>
              <div className="calc-out"><dt>r</dt><dd>{EXAMPLE_T.r.toFixed(3)}</dd></div>
            </dl>
            <p className="formula">r = √(t² / (t² + df))</p>
            <figcaption>{t.s1Rule}</figcaption>
          </figure>
        </li>

        <li className="stage">
          <div className="stage-text">
            <span className="stage-num">02</span>
            <h2>{t.s2Title}</h2>
            <p>{t.s2Body}</p>
          </div>
          <figure className="stage-proof">
            <table className="mini">
              <thead>
                <tr><th>{t.colR}</th><th>{t.colConf}</th><th>{t.colStatus}</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="num">{EXAMPLE_T.r.toFixed(3)}</td>
                  <td className="num">0.8</td>
                  <td><span className="chip approved">{t.statusApproved}</span></td>
                </tr>
                <tr>
                  <td className="num">{EXAMPLE_BETA.r.toFixed(3)}</td>
                  <td className="num">0.6</td>
                  <td><span className="chip review">{t.statusReview}</span></td>
                </tr>
              </tbody>
            </table>
            <figcaption>{t.s2Rule} · β = {EXAMPLE_BETA.beta.toFixed(2)}</figcaption>
          </figure>
        </li>

        <li className="stage">
          <div className="stage-text">
            <span className="stage-num">03</span>
            <h2>{t.s3Title}</h2>
            <p>{t.s3Body}</p>
          </div>
          <figure className="stage-proof">
            <p className="locked-line">
              <span className="chip locked">{t.statusLocked}</span>
              <span className="num">r = {EXAMPLE_T.r.toFixed(3)}</span>
            </p>
            <figcaption>{t.s3Note}</figcaption>
          </figure>
        </li>
      </ol>

      <p className="example-note">{t.exampleNote}</p>

      <footer className="landing-foot">
        <a className="btn" href="/register">{t.footCta}</a>
        <p className="affil">
          {t.affiliation} ·{" "}
          <a href="https://doi.org/10.5281/zenodo.21282516">{t.citeLabel}</a>
        </p>
      </footer>
    </main>
  );
}
