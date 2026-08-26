"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { AuthCard, Field, TextInput, Button, Alert } from "@/components/ui";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestAdminAccess, setRequestAdminAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ firstName, lastName, email, password, requestAdminAccess }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthCard title="Check your email">
        <Alert kind="success">
          We sent a verification link to <strong>{email}</strong>. Open it to activate your account, then sign in.
          {requestAdminAccess && " Your admin access request has also been sent for review."}
        </Alert>
        <Link href="/login">
          <Button className="w-full" variant="secondary">
            Back to sign in
          </Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your account" subtitle="Zero-Trust Identity & Access Management">
      {error && <Alert>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <TextInput required value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
          </Field>
          <Field label="Last name">
            <TextInput required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
        </div>
        <Field label="Email">
          <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </Field>
        <Field label="Password">
          <TextInput
            type="password"
            required
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 12 characters"
          />
        </Field>
        <label className="mt-3 flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-alt)] p-3 text-sm">
          <input
            type="checkbox"
            checked={requestAdminAccess}
            onChange={(e) => setRequestAdminAccess(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
          />
          <span>
            <span className="font-medium text-[var(--foreground)]">Request admin access</span>
            <span className="block text-[var(--muted)]">
              An administrator will review and approve this by email before it takes effect.
            </span>
          </span>
        </label>
        <Button type="submit" className="w-full mt-3" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
