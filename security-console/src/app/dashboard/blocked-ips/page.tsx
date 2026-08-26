"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Card, Button, TextInput, Field, Alert, Spinner } from "@/components/ui";

interface BlockedIpResponse {
  id: string;
  ipAddress: string;
  reason: string | null;
  createdAt: string;
}

export default function BlockedIpsPage() {
  const [entries, setEntries] = useState<BlockedIpResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [ipAddress, setIpAddress] = useState("");
  const [reason, setReason] = useState("");

  function load() {
    apiFetch<BlockedIpResponse[]>("/api/security/blocked-ips")
      .then(setEntries)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load blocked IPs"));
  }

  useEffect(load, []);

  async function block() {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await apiFetch("/api/security/blocked-ips", {
        method: "POST",
        body: JSON.stringify({ ipAddress, reason: reason || null }),
      });
      setInfo(`${ipAddress} is now blocked.`);
      setIpAddress("");
      setReason("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to block IP address");
    } finally {
      setBusy(false);
    }
  }

  async function unblock(entry: BlockedIpResponse) {
    if (!window.confirm(`Unblock ${entry.ipAddress}?`)) return;
    setError(null);
    setBusy(true);
    try {
      await apiFetch(`/api/security/blocked-ips/${entry.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to unblock IP address");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Blocked IPs</h1>
        <p className="text-sm text-[var(--muted)]">
          Requests from these addresses are refused before they reach the risk engine.
        </p>
      </div>

      {error && <Alert>{error}</Alert>}
      {info && <Alert kind="info">{info}</Alert>}

      <Card title="Block an address">
        <div className="grid grid-cols-2 gap-4">
          <Field label="IP address">
            <TextInput value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} placeholder="203.0.113.7" />
          </Field>
          <Field label="Reason (optional)">
            <TextInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Repeated failed logins" />
          </Field>
        </div>
        <Button onClick={block} disabled={busy || !ipAddress.trim()}>
          Block
        </Button>
      </Card>

      <Card title="Currently blocked">
        {!entries ? (
          <div className="flex items-center gap-2 py-8 justify-center text-[var(--muted)]">
            <Spinner /> Loading…
          </div>
        ) : entries.length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--muted)]">No IP addresses are blocked.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                  <th className="pb-2 pr-4 font-medium">Address</th>
                  <th className="pb-2 pr-4 font-medium">Reason</th>
                  <th className="pb-2 pr-4 font-medium">Blocked</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2.5 pr-4 font-mono text-xs">{entry.ipAddress}</td>
                    <td className="py-2.5 pr-4 text-[var(--muted)]">{entry.reason || "—"}</td>
                    <td className="py-2.5 pr-4 text-[var(--muted)]">{new Date(entry.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 text-right">
                      <Button variant="danger" onClick={() => unblock(entry)} disabled={busy}>
                        Unblock
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
