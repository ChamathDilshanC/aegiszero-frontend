"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiError, setTokens } from "@/lib/api";
import { AuthCard, Field, TextInput, Button, Alert } from "@/components/ui";

interface VerifyResponse {
  status: "SUCCESS";
  tokens: { accessToken: string; refreshToken: string };
}

function MfaChallengeForm() {
  const router = useRouter();
  const params = useSearchParams();
  const challengeId = params.get("challengeId") ?? "";
  const method = params.get("method") ?? "EMAIL_OTP";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<VerifyResponse>("/api/auth/mfa/verify", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ challengeId, code }),
      });
      setTokens(res.tokens.accessToken, res.tokens.refreshToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Verify it's you"
      subtitle={method === "TOTP" ? "Enter the code from your authenticator app" : "Enter the code we emailed you"}
    >
      {error && <Alert>{error}</Alert>}
      {!challengeId && <Alert kind="info">This verification link is invalid. Please sign in again.</Alert>}
      <form onSubmit={handleSubmit}>
        <Field label="Verification code">
          <TextInput
            required
            inputMode="numeric"
            autoFocus
            maxLength={10}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={loading || !challengeId}>
          {loading ? "Verifying…" : "Verify"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function MfaChallengePage() {
  return (
    <Suspense fallback={null}>
      <MfaChallengeForm />
    </Suspense>
  );
}
