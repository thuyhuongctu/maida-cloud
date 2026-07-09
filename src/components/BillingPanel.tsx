"use client";

import { useState } from "react";
import { useI18n } from "./LanguageProvider";

interface Usage { plan: string; used: number; quota: number; remaining: number; }
interface PlanCard { key: string; name: string; quota: number; }

export function BillingPanel({ usage, plans, orgName }: { usage: Usage; plans: PlanCard[]; orgName: string }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const pct = usage.quota > 0 ? Math.min(100, Math.round((usage.used / usage.quota) * 100)) : 0;

  async function upgrade(plan: string) {
    setBusy(plan); setError("");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not start checkout.");
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setBusy(null);
    }
  }

  return (
    <main className="billing">
      <h1>{t.billing}</h1>
      <p className="muted">{orgName}</p>

      <div className="usage card">
        <div className="usage-head">
          <span>{t.currentPlan}: <b>{usage.plan}</b></span>
          <span className="mono">{usage.used} / {usage.quota} {t.thisMonth}</span>
        </div>
        <div className="meter"><span style={{ width: pct + "%" }} /></div>
      </div>

      {error && <p className="err">{error}</p>}

      <div className="plans">
        {plans.map((p) => (
          <div key={p.key} className={"card plan" + (p.key === usage.plan ? " active" : "")}>
            <h3>{p.name}</h3>
            <p className="mono quota">{p.quota} {t.perMonth}</p>
            {p.key === usage.plan ? (
              <span className="current">{t.currentLabel}</span>
            ) : p.key === "FREE" ? (
              <span className="muted small">{t.freeLabel}</span>
            ) : (
              <button className="btn small" disabled={busy === p.key} onClick={() => upgrade(p.key)}>
                {busy === p.key ? "..." : t.upgrade}
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
