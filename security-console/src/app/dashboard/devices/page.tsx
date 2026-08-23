"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Card, Button, Alert, Badge, Spinner } from "@/components/ui";

interface DeviceInfo {
  id: string;
  deviceName: string;
  trusted: boolean;
  blocked: boolean;
  lastIp: string;
  lastSeenAt: string | null;
  createdAt: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    apiFetch<DeviceInfo[]>("/api/security/devices")
      .then(setDevices)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load devices"));
  }

  useEffect(load, []);

  async function act(id: string, action: "trust" | "block" | "forget") {
    setBusyId(id);
    try {
      if (action === "forget") {
        await apiFetch(`/api/security/devices/${id}`, { method: "DELETE" });
        setDevices((prev) => prev?.filter((d) => d.id !== id) ?? null);
      } else {
        await apiFetch(`/api/security/devices/${id}/${action}`, { method: "POST" });
        load();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to ${action} device`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Devices</h1>
        <p className="text-sm text-[var(--muted)]">Devices that have signed in to your account.</p>
      </div>

      {error && <Alert>{error}</Alert>}

      <Card>
        {!devices ? (
          <div className="flex items-center gap-2 py-8 justify-center text-[var(--muted)]">
            <Spinner /> Loading devices…
          </div>
        ) : devices.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--muted)]">No devices on record.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {devices.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{d.deviceName}</p>
                    {d.trusted && <Badge tone="success">Trusted</Badge>}
                    {d.blocked && <Badge tone="danger">Blocked</Badge>}
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {d.lastIp} · last seen {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : "never"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!d.trusted && !d.blocked && (
                    <Button variant="secondary" onClick={() => act(d.id, "trust")} disabled={busyId === d.id}>
                      Trust
                    </Button>
                  )}
                  {!d.blocked && (
                    <Button variant="danger" onClick={() => act(d.id, "block")} disabled={busyId === d.id}>
                      Block
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => act(d.id, "forget")} disabled={busyId === d.id}>
                    Forget
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
