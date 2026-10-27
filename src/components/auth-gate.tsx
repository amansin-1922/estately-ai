"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Building2, LockKeyhole } from "lucide-react";
import { useLeads } from "./lead-provider";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, authLoading, signIn } = useLeads();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) return <div className="login-screen"><div className="login-card">Checking your session…</div></div>;
  if (user) return <>{children}</>;

  return <div className="login-screen"><form onSubmit={submit} className="login-card">
    <div className="login-brand"><Building2 size={28}/><strong>estately.ai</strong></div>
    <span className="eyebrow">SECURE TECHNORICH WORKSPACE</span>
    <h1>Welcome back</h1>
    <p>Sign in with the account created for you in Supabase Authentication.</p>
    <label htmlFor="login-email">Email address</label>
    <input className="field" id="login-email" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/>
    <label htmlFor="login-password">Password</label>
    <input className="field" id="login-password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/>
    {message && <p role="alert" className="login-error">{message}</p>}
    <button className="btn btn-dark btn-large" type="submit" disabled={busy}><LockKeyhole size={16}/>{busy ? "Signing in…" : "Sign in"}</button>
    <small>Only authorized users can access their own leads. No public sign-up is enabled.</small>
  </form></div>;
}
