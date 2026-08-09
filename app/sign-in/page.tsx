"use client";

import { authClient } from "@/lib/auth-client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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

  return <main className="auth-shell">
    <section className="auth-card">
      <div className="brand-mark">∞</div>
      <p className="eyebrow">HITLHUB</p>
      <h1>Welcome back</h1>
      <p className="muted">The human decision layer for AI agents.</p>
      <form onSubmit={submit}>
        <label>Email<input name="email" type="email" required placeholder="you@company.com" /></label>
        <label>Password<input name="password" type="password" required minLength={8} placeholder="At least 8 characters" /></label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={loading}>{loading ? "Please wait…" : "Sign in"}</button>
      </form>
      <p className="signin-note">Accounts are invitation-only.</p>
    </section>
  </main>;
}
