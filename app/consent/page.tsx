"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { Check, Infinity as InfinityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  return <main className="grid min-h-svh place-items-center bg-muted/30 px-4 py-8">
    <Card className="w-full max-w-md shadow-xl shadow-foreground/5"><CardHeader><div className="mb-4 grid size-11 place-items-center rounded-xl bg-foreground text-background"><InfinityIcon /></div><p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">OAuth authorization</p><CardTitle className="text-2xl">Connect to HITLHub?</CardTitle><CardDescription><code className="break-all text-foreground">{clientId}</code> is requesting permission to use HITLHub on your behalf.</CardDescription></CardHeader><CardContent>
      <div className="mb-5 divide-y rounded-xl border">{scopes.map((scope) => <div className="flex gap-3 p-3" key={scope}><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="size-3" /></span><div><p className="text-sm font-medium">{scope}</p><p className="mt-0.5 text-xs text-muted-foreground">{scopeDescription(scope)}</p></div></div>)}</div>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-2 gap-2"><Button variant="outline" disabled={loading} onClick={() => decide(false)}>Deny</Button><Button disabled={loading} onClick={() => decide(true)}>{loading ? "Connecting…" : "Allow access"}</Button></div>
    </CardContent></Card>
  </main>;
}

function scopeDescription(scope: string) {
  if (scope === "hitl:create") return "Create questions for human decision.";
  if (scope === "hitl:read") return "Read the status and answer of its sessions.";
  if (scope === "hitl:cancel") return "Cancel its sessions while they are waiting.";
  if (scope === "offline_access") return "Stay connected using renewable tokens.";
  return "Access this capability.";
}
