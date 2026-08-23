"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { AuthCard, Field, TextInput, Button, Alert } from "@/components/ui";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ token, newPassword }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Choose a new password">
      {error && <Alert>{error}</Alert>}
      {done ? (
        <>
          <Alert kind="success">Your password has been reset. You can now sign in with it.</Alert>
          <Link href="/login">
            <Button className="w-full">Sign in</Button>
          </Link>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <Field label="New password">
            <TextInput
              type="password"
              required
              minLength={12}
              autoFocus
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 12 characters"
            />
          </Field>
          <Button type="submit" className="w-full" disabled={loading || !token}>
            {loading ? "Saving…" : "Reset password"}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
