"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "./LanguageProvider";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload = mode === "login" ? { email, password } : { name, email, password, orgName };
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      router.push(params.get("next") ?? "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <h1>{mode === "login" ? t.signIn : t.signUp}</h1>
      <form onSubmit={submit}>
        {mode === "register" && (
          <>
            <label><span>{t.fldName}</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required /></label>
            <label><span>{t.fldOrg}</span>
              <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} required /></label>
          </>
        )}
        <label><span>{t.fldEmail}</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label><span>{t.fldPassword}</span>
          <input type="password" value={password} minLength={mode === "register" ? 8 : undefined}
            onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="err">{error}</p>}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "..." : mode === "login" ? t.signIn : t.signUp}
        </button>
      </form>
      <p className="alt">
        {mode === "login" ? t.noAccount : t.haveAccount}{" "}
        <a href={mode === "login" ? "/register" : "/login"}>
          {mode === "login" ? t.signUp : t.signIn}
        </a>
      </p>
    </main>
  );
}
