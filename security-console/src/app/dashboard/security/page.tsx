"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, Button, Alert, Badge, Field, TextInput } from "@/components/ui";

interface MfaMethods {
  enabled: boolean;
  methods: string[];
}

interface TotpEnroll {
  secret: string;
  otpauthUrl: string;
}

export default function SecurityPage() {
  const { user } = useAuth();
  const [methods, setMethods] = useState<MfaMethods | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [enrolling, setEnrolling] = useState<TotpEnroll | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    apiFetch<MfaMethods>("/api/security/mfa")
      .then(setMethods)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load MFA status"));
  }

  useEffect(load, []);

  async function startTotpEnrollment() {
    setError(null);
    setBusy(true);
    try {
      const email = user ? `${user.userId}` : "";
      const res = await apiFetch<TotpEnroll>(`/api/security/mfa/enroll/totp?email=${encodeURIComponent(email)}`, {
        method: "POST",
      });
      setEnrolling(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start enrollment");
    } finally {
      setBusy(false);
    }
  }

  async function confirmTotp() {
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch<{ codes: string[] }>("/api/security/mfa/enroll/totp/confirm", {
        method: "POST",
        body: JSON.stringify({ code: confirmCode }),
      });
      setRecoveryCodes(res.codes);
      setEnrolling(null);
      setConfirmCode("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function enableEmailOtp() {
    setError(null);
    setBusy(true);
    try {
      await apiFetch("/api/security/mfa/enroll/email-otp", { method: "POST" });
      setInfo("Email OTP enabled.");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to enable email OTP");
    } finally {
      setBusy(false);
    }
  }

  async function disable(method: string) {
    setBusy(true);
    try {
      await apiFetch(`/api/security/mfa/${method}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to disable method");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Multi-factor authentication</h1>
        <p className="text-sm text-[var(--muted)]">Add a second factor so a leaked password isn&apos;t enough to sign in.</p>
      </div>

      {error && <Alert>{error}</Alert>}
      {info && <Alert kind="info">{info}</Alert>}

      {recoveryCodes && (
        <Card title="Save your recovery codes">
          <p className="mb-3 text-sm text-[var(--muted)]">
            Each code can be used once if you lose access to your authenticator app. Store them somewhere safe — they
            won&apos;t be shown again.
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#0d1526] p-4 font-mono text-sm">
            {recoveryCodes.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <Button className="mt-4" onClick={() => setRecoveryCodes(null)}>
            Done
          </Button>
        </Card>
      )}

      <Card title="Authenticator app (TOTP)">
        {methods?.methods.includes("TOTP") ? (
          <div className="flex items-center justify-between">
            <Badge tone="success">Enabled</Badge>
            <Button variant="danger" onClick={() => disable("totp")} disabled={busy}>
              Disable
            </Button>
          </div>
        ) : enrolling ? (
          <div>
            <p className="mb-2 text-sm text-[var(--muted)]">
              Add this account to your authenticator app (Google Authenticator, 1Password, Authy…) by entering the
              code manually:
            </p>
            <p className="mb-4 break-all rounded-lg bg-[#0d1526] p-3 font-mono text-sm text-[var(--accent)]">
              {enrolling.secret}
            </p>
            <Field label="Enter the 6-digit code from your app to confirm">
              <TextInput
                inputMode="numeric"
                maxLength={6}
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder="123456"
              />
            </Field>
            <div className="flex gap-2">
              <Button onClick={confirmTotp} disabled={busy || confirmCode.length < 6}>
                Confirm
              </Button>
              <Button variant="secondary" onClick={() => setEnrolling(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={startTotpEnrollment} disabled={busy}>
            Set up authenticator app
          </Button>
        )}
      </Card>

      <Card title="Email one-time code">
        {methods?.methods.includes("EMAIL_OTP") ? (
          <div className="flex items-center justify-between">
            <Badge tone="success">Enabled</Badge>
            <Button variant="danger" onClick={() => disable("email_otp")} disabled={busy}>
              Disable
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={enableEmailOtp} disabled={busy}>
            Enable email codes
          </Button>
        )}
      </Card>
    </div>
  );
}
