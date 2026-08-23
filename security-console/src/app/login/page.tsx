"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError, setTokens } from "@/lib/api";
import { getDeviceFingerprint, getDeviceName } from "@/lib/device";
import { AuthCard, Field, TextInput, Button, Alert } from "@/components/ui";

interface LoginResponse {
  status: "SUCCESS" | "MFA_REQUIRED";
  tokens?: { accessToken: string; refreshToken: string };
  mfaChallengeId?: string;
  mfaMethod?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({
          email,
          password,
          deviceFingerprint: getDeviceFingerprint(),
          deviceName: getDeviceName(),
        }),
      });

      if (res.status === "MFA_REQUIRED" && res.mfaChallengeId) {
        const params = new URLSearchParams({ challengeId: res.mfaChallengeId, method: res.mfaMethod ?? "EMAIL_OTP" });
        router.push(`/mfa-challenge?${params.toString()}`);
        return;
      }

      if (res.tokens) {
        setTokens(res.tokens.accessToken, res.tokens.refreshToken);
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Sign in" subtitle="Zero-Trust Identity & Access Management">
      {error && <Alert>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <Field label="Email">
          <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoFocus />
        </Field>
        <Field label="Password">
          <TextInput type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" />
        </Field>
        <div className="mb-5 flex justify-end">
          <Link href="/forgot-password" className="text-sm text-[var(--accent)] hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[var(--accent)] hover:underline">
          Create one
        </Link>
      </p>
    </AuthCard>
  );
}
