"use client";

import { authClient } from "@/lib/auth-client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    const result = mode === "signin"
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({ email, password, name: String(data.get("name")) || email.split("@")[0] });
    setLoading(false);
    if (result.error) return setError(result.error.message || "Authentication failed");
    router.push("/"); router.refresh();
  }

  return <main className="auth-shell">
    <section className="auth-card">
      <div className="brand-mark">∞</div>
      <p className="eyebrow">HITLHUB</p>
      <h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
      <p className="muted">The human decision layer for AI agents.</p>
      <form onSubmit={submit}>
        {mode === "signup" && <label>Name<input name="name" required placeholder="Carlos" /></label>}
        <label>Email<input name="email" type="email" required placeholder="you@company.com" /></label>
        <label>Password<input name="password" type="password" required minLength={8} placeholder="At least 8 characters" /></label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={loading}>{loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
      </form>
      <button className="text-button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
        {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </section>
  </main>;
}
