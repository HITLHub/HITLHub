"use client";

import type { ApiKeyRecord } from "@/lib/api-keys";
import type { McpScope } from "@/lib/oauth-config";
import { useState } from "react";

const scopeOptions: { value: McpScope; label: string }[] = [
  { value: "hitl:create", label: "Create sessions" },
  { value: "hitl:read", label: "Read decisions" },
  { value: "hitl:cancel", label: "Cancel sessions" },
];

export function ApiKeysManager({ initial }: { initial: ApiKeyRecord[] }) {
  const [keys, setKeys] = useState(initial);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<McpScope[]>(["hitl:create", "hitl:read", "hitl:cancel"]);
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function toggleScope(scope: McpScope) {
    setScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]);
  }

  async function createKey(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, scopes }) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) return setError(result.error ?? "Could not create API key");
    setKeys((current) => [result.apiKey, ...current]); setSecret(result.secret); setName("");
  }

  async function rename(key: ApiKeyRecord) {
    const name = window.prompt("API key name", key.name)?.trim();
    if (!name || name === key.name) return;
    const response = await fetch(`/api/api-keys/${key.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    if (response.ok) { const result = await response.json(); setKeys((current) => current.map((item) => item.id === key.id ? result.apiKey : item)); }
  }

  async function revoke(key: ApiKeyRecord) {
    if (!window.confirm(`Revoke “${key.name}”? Agents using it will immediately lose access.`)) return;
    const response = await fetch(`/api/api-keys/${key.id}`, { method: "DELETE" });
    if (response.ok) { const result = await response.json(); setKeys((current) => current.map((item) => item.id === key.id ? result.apiKey : item)); }
  }

  return <div className="settings-page">
    <header className="page-heading"><div><p className="eyebrow">AGENT ACCESS</p><h1>API Keys</h1><p>Keys route every new human-decision session to your private inbox.</p></div></header>
    {secret && <section className="secret-banner"><div><strong>Copy your API key now</strong><p>For security, HITLHub will never show it again.</p></div><code>{secret}</code><button className="primary" onClick={() => navigator.clipboard.writeText(secret)}>Copy key</button><button className="text-button" onClick={() => setSecret("")}>Done</button></section>}
    <div className="settings-grid">
      <section className="settings-card"><h2>Create an API key</h2><p className="muted">Use one key per agent or environment so access can be revoked independently.</p>
        <form className="key-form" onSubmit={createKey}><label>Key name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Production support agent" maxLength={80} required /></label>
          <fieldset><legend>Permissions</legend>{scopeOptions.map((scope) => <label className="check-row" key={scope.value}><input type="checkbox" checked={scopes.includes(scope.value)} onChange={() => toggleScope(scope.value)} /><span><strong>{scope.label}</strong><small>{scope.value}</small></span></label>)}</fieldset>
          {error && <p className="error">{error}</p>}<button className="primary" disabled={busy || scopes.length === 0}>{busy ? "Creating…" : "Create API key"}</button>
        </form>
      </section>
      <section className="settings-card key-list-card"><div className="card-title"><h2>Your API keys</h2><span>{keys.filter((key) => key.status === "active").length} active</span></div>
        {keys.length === 0 ? <p className="muted">No API keys yet.</p> : <div className="key-list">{keys.map((key) => <article className="key-row" key={key.id}><div className="key-row-top"><div><strong>{key.name}</strong><code>{key.key_prefix}</code></div><span className={`status-pill ${key.status === "active" ? "answered" : "cancelled"}`}>{key.status}</span></div><div className="scope-chips">{key.scopes.map((scope) => <span key={scope}>{scope.replace("hitl:", "")}</span>)}</div><small>Created {new Date(key.created_at).toLocaleDateString()} · {key.last_used_at ? `Last used ${new Date(key.last_used_at).toLocaleString()}` : "Never used"}</small><div className="row-actions"><button onClick={() => rename(key)}>Rename</button>{key.status === "active" && <button className="danger" onClick={() => revoke(key)}>Revoke</button>}</div></article>)}</div>}
      </section>
    </div>
  </div>;
}
