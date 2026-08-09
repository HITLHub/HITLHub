"use client";

import type { ApiKeyRecord } from "@/lib/api-keys";
import type { McpScope } from "@/lib/oauth-config";
import { Check, Copy, KeyRound, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const scopeOptions: { value: McpScope; label: string; description: string }[] = [
  { value: "hitl:create", label: "Create sessions", description: "Send questions to your inbox" },
  { value: "hitl:read", label: "Read decisions", description: "Poll status and human answers" },
  { value: "hitl:cancel", label: "Cancel sessions", description: "Stop requests that are waiting" },
];

export function ApiKeysManager({ initial }: { initial: ApiKeyRecord[] }) {
  const [keys, setKeys] = useState(initial);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<McpScope[]>(["hitl:create", "hitl:read", "hitl:cancel"]);
  const [secret, setSecret] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [renameKey, setRenameKey] = useState<ApiKeyRecord | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [revokeKey, setRevokeKey] = useState<ApiKeyRecord | null>(null);

  function toggleScope(scope: McpScope) { setScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]); }

  async function createKey(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, scopes }) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) return setError(result.error ?? "Could not create API key");
    setKeys((current) => [result.apiKey, ...current]); setSecret(result.secret); setName(""); setCreateOpen(false);
  }

  async function rename() {
    if (!renameKey || !renameValue.trim()) return;
    const response = await fetch(`/api/api-keys/${renameKey.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: renameValue }) });
    if (response.ok) { const result = await response.json(); setKeys((current) => current.map((item) => item.id === renameKey.id ? result.apiKey : item)); setRenameKey(null); }
  }

  async function revoke() {
    if (!revokeKey) return;
    const response = await fetch(`/api/api-keys/${revokeKey.id}`, { method: "DELETE" });
    if (response.ok) { const result = await response.json(); setKeys((current) => current.map((item) => item.id === revokeKey.id ? result.apiKey : item)); setRevokeKey(null); }
  }

  async function copySecret() { await navigator.clipboard.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 1500); }

  return <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
    <div className="mb-7 flex items-start justify-between gap-4"><div><p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">Agent access</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">API Keys</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Each key belongs to you. Sessions created with it are delivered only to your inbox.</p></div>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogTrigger asChild><Button><Plus data-icon="inline-start" />New key</Button></DialogTrigger><DialogContent><form onSubmit={createKey}><DialogHeader><DialogTitle>Create API key</DialogTitle><DialogDescription>Use one key per agent or environment so access can be revoked independently.</DialogDescription></DialogHeader><div className="space-y-5 py-5"><div className="space-y-2"><label className="text-sm font-medium" htmlFor="key-name">Key name</label><Input id="key-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Production support agent" maxLength={80} required /></div><div className="space-y-2"><p className="text-sm font-medium">Permissions</p>{scopeOptions.map((scope) => <label key={scope.value} className="flex cursor-pointer gap-3 rounded-xl border p-3"><Checkbox checked={scopes.includes(scope.value)} onCheckedChange={() => toggleScope(scope.value)} /><span><span className="block text-sm font-medium">{scope.label}</span><span className="block text-xs text-muted-foreground">{scope.description}</span></span></label>)}</div>{error && <p className="text-sm text-destructive">{error}</p>}</div><DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button disabled={busy || scopes.length === 0}>{busy ? "Creating…" : "Create key"}</Button></DialogFooter></form></DialogContent></Dialog>
    </div>

    {secret && <Card className="mb-6 border-emerald-200 bg-emerald-50/70 shadow-none"><CardContent className="p-4 sm:p-5"><div className="flex gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><ShieldCheck className="size-5" /></div><div className="min-w-0 flex-1"><h2 className="font-medium text-emerald-950">Copy your key now</h2><p className="mt-1 text-xs text-emerald-800/70">For security, HITLHub will never show it again.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row"><code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-emerald-200 bg-background px-3 py-2.5 text-xs">{secret}</code><Button variant="outline" onClick={copySecret}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy"}</Button><Button variant="ghost" onClick={() => setSecret("")}>Done</Button></div></div></div></CardContent></Card>}

    <Card className="shadow-none"><CardHeader><CardTitle>Your API keys</CardTitle><CardDescription>{keys.filter((key) => key.status === "active").length} active credentials</CardDescription></CardHeader><CardContent className="p-0">{keys.length === 0 ? <div className="px-6 py-14 text-center"><KeyRound className="mx-auto mb-3 size-8 text-muted-foreground" /><p className="font-medium">No API keys yet</p><p className="mt-1 text-sm text-muted-foreground">Create one to connect a headless agent.</p></div> : <div className="divide-y">{keys.map((key) => <article key={key.id} className="p-4 sm:p-5"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{key.name}</h3><Badge variant={key.status === "active" ? "secondary" : "outline"} className={key.status === "active" ? "bg-emerald-50 text-emerald-700" : ""}>{key.status}</Badge></div><code className="mt-1 block truncate text-xs text-muted-foreground">{key.key_prefix}</code><div className="mt-3 flex flex-wrap gap-1.5">{key.scopes.map((scope) => <Badge key={scope} variant="outline">{scope.replace("hitl:", "")}</Badge>)}</div><p className="mt-3 text-xs text-muted-foreground">Created {new Date(key.created_at).toLocaleDateString()} · {key.last_used_at ? `Last used ${new Date(key.last_used_at).toLocaleString()}` : "Never used"}</p></div><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label={`Rename ${key.name}`} onClick={() => { setRenameKey(key); setRenameValue(key.name); }}><Pencil /></Button>{key.status === "active" && <Button variant="ghost" size="icon" className="text-destructive" aria-label={`Revoke ${key.name}`} onClick={() => setRevokeKey(key)}><Trash2 /></Button>}</div></div></article>)}</div>}</CardContent></Card>

    <Dialog open={!!renameKey} onOpenChange={(open) => !open && setRenameKey(null)}><DialogContent><DialogHeader><DialogTitle>Rename API key</DialogTitle><DialogDescription>Choose a recognizable name for this agent or environment.</DialogDescription></DialogHeader><Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} maxLength={80} /><DialogFooter><Button variant="outline" onClick={() => setRenameKey(null)}>Cancel</Button><Button onClick={rename}>Save name</Button></DialogFooter></DialogContent></Dialog>
    <AlertDialog open={!!revokeKey} onOpenChange={(open) => !open && setRevokeKey(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Revoke {revokeKey?.name}?</AlertDialogTitle><AlertDialogDescription>Agents using this key will immediately lose access. Existing decision history remains available.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep key</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={revoke}>Revoke key</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
