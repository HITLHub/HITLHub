"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function ConsentPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const query = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const scopes = (query.get("scope") || "").split(" ").filter(Boolean);
  const clientId = query.get("client_id") || "ChatGPT";

  async function decide(accept: boolean) {
    setLoading(true); setError("");
    const result = await authClient.oauth2.consent({
      accept,
      oauth_query: window.location.search.slice(1),
    });
    setLoading(false);
    if (result.error) return setError(result.error.message || "Unable to save consent");
    if (result.data?.url) window.location.href = result.data.url;
  }

  return <main className="auth-shell">
    <section className="auth-card consent-card">
      <div className="brand-mark">∞</div>
      <p className="eyebrow">OAUTH AUTHORIZATION</p>
      <h1>Connect to HITLHub?</h1>
      <p className="muted"><code>{clientId}</code> is requesting permission to use HITLHub on your behalf.</p>
      <div className="scope-list">
        {scopes.map((scope) => <div key={scope}><span>✓</span><div><strong>{scope}</strong><small>{scopeDescription(scope)}</small></div></div>)}
      </div>
      {error && <p className="error">{error}</p>}
      <div className="consent-actions">
        <button className="secondary" disabled={loading} onClick={() => decide(false)}>Deny</button>
        <button className="primary" disabled={loading} onClick={() => decide(true)}>{loading ? "Connecting…" : "Allow access"}</button>
      </div>
    </section>
  </main>;
}

function scopeDescription(scope: string) {
  if (scope === "hitl:create") return "Create questions for human decision.";
  if (scope === "hitl:read") return "Read the status and answer of its sessions.";
  if (scope === "hitl:cancel") return "Cancel its sessions while they are waiting.";
  if (scope === "offline_access") return "Stay connected using renewable tokens.";
  return "Access this capability.";
}
