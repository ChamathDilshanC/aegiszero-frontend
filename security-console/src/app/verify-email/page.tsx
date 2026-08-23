"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { AuthCard, Button, Alert, Spinner } from "@/components/ui";

function VerifyEmailBody() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("This verification link is missing its token.");
      return;
    }
    apiFetch("/api/auth/verify-email", { method: "POST", skipAuth: true, body: JSON.stringify({ token }) })
      .then(() => setState("success"))
      .catch((err) => {
        setState("error");
        setMessage(err instanceof ApiError ? err.message : "Verification failed.");
      });
  }, [token]);

  return (
    <AuthCard title="Email verification">
      {state === "pending" && (
        <div className="flex items-center justify-center gap-2 py-6 text-[var(--muted)]">
          <Spinner /> Verifying your email…
        </div>
      )}
      {state === "success" && (
        <>
          <Alert kind="success">Your email has been verified. You can now sign in.</Alert>
          <Link href="/login">
            <Button className="w-full">Sign in</Button>
          </Link>
        </>
      )}
      {state === "error" && (
        <>
          <Alert>{message}</Alert>
          <Link href="/login">
            <Button className="w-full" variant="secondary">
              Back to sign in
            </Button>
          </Link>
        </>
      )}
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailBody />
    </Suspense>
  );
}
