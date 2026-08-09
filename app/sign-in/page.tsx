"use client";

import { authClient } from "@/lib/auth-client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    const result = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (result.error) return setError(result.error.message || "Authentication failed");
    if (window.location.search) {
      window.location.href = `/api/auth/oauth2/authorize${window.location.search}`;
      return;
    }
    router.push("/"); router.refresh();
  }

  return <main className="grid min-h-svh place-items-center bg-muted/30 px-4 py-8">
    <Card className="w-full max-w-md shadow-xl shadow-foreground/5">
      <CardHeader><div className="mb-4 grid size-11 place-items-center rounded-xl bg-foreground text-2xl text-background">∞</div><p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">HITLHub</p><CardTitle className="text-2xl">Welcome back</CardTitle><CardDescription>The human decision layer for AI agents.</CardDescription></CardHeader>
      <CardContent><form className="space-y-4" onSubmit={submit}>
        <div className="space-y-2"><label className="text-sm font-medium" htmlFor="email">Email</label><Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" /></div>
        <div className="space-y-2"><label className="text-sm font-medium" htmlFor="password">Password</label><Input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} placeholder="At least 8 characters" /></div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" size="lg" disabled={loading}>{loading ? "Please wait…" : "Sign in"}</Button>
      </form><p className="mt-5 text-center text-xs text-muted-foreground">Accounts are invitation-only.</p></CardContent>
    </Card>
  </main>;
}
