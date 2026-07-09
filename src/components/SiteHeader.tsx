"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "./LanguageProvider";
import { LANGS } from "@/lib/i18n";

export function SiteHeader() {
  const { lang, setLang, t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setEmail(d.user?.email ?? null)).catch(() => {});
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setEmail(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="site-header">
      <a className="wordmark" href="/">
        <span className="mark" aria-hidden="true" />
        {t.brand}
      </a>
      <div className="header-right">
        {email ? (
          <>
            <a className="link" href="/billing">{t.billing}</a>
            <span className="who">{email}</span>
            <button className="link" onClick={signOut}>{t.signOut}</button>
          </>
        ) : (
          <a className="link" href="/login">{t.signIn}</a>
        )}
        <div className="lang" role="group" aria-label={t.langLabel}>
          {LANGS.map((l) => (
            <button key={l} type="button" className={l === lang ? "on" : ""}
              aria-pressed={l === lang} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
