"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { AuthCard, Field, TextInput, Button, Alert } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/forgot-password", { method: "POST", skipAuth: true, body: JSON.stringify({ email }) });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Reset your password">
      {error && <Alert>{error}</Alert>}
      {sent ? (
        <Alert kind="success">If that email is registered, we&apos;ve sent a reset link to it.</Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          <Field label="Email">
            <TextInput type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        <Link href="/login" className="text-[var(--accent)] hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
