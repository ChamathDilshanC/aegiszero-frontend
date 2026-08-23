"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Card, Button, Alert, Spinner } from "@/components/ui";

interface SessionInfo {
  sessionId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivityAt: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    apiFetch<SessionInfo[]>("/api/security/sessions")
      .then(setSessions)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load sessions"));
  }

  useEffect(load, []);

  async function revoke(sessionId: string) {
    setBusyId(sessionId);
    try {
      await apiFetch(`/api/security/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev?.filter((s) => s.sessionId !== sessionId) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to revoke session");
    } finally {
      setBusyId(null);
    }
  }

  async function revokeAll() {
    setBusyId("all");
    try {
      await apiFetch("/api/security/sessions", { method: "DELETE" });
      setSessions([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to revoke sessions");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Active sessions</h1>
          <p className="text-sm text-[var(--muted)]">Every device currently signed in to your account.</p>
        </div>
        {sessions && sessions.length > 0 && (
          <Button variant="danger" onClick={revokeAll} disabled={busyId === "all"}>
            {busyId === "all" ? "Signing out…" : "Sign out everywhere"}
          </Button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      <Card>
        {!sessions ? (
          <div className="flex items-center gap-2 py-8 justify-center text-[var(--muted)]">
            <Spinner /> Loading sessions…
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--muted)]">No active sessions.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {sessions.map((s) => (
              <div key={s.sessionId} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{s.userAgent || "Unknown client"}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {s.ipAddress} · signed in {new Date(s.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => revoke(s.sessionId)} disabled={busyId === s.sessionId}>
                  {busyId === s.sessionId ? "Revoking…" : "Revoke"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
