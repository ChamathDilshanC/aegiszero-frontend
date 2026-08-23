"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, StatTile, Badge } from "@/components/ui";

interface SessionInfo {
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

interface DeviceInfo {
  id: string;
  deviceName: string;
  trusted: boolean;
  blocked: boolean;
}

interface MfaMethods {
  enabled: boolean;
  methods: string[];
}

export default function OverviewPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [mfa, setMfa] = useState<MfaMethods | null>(null);

  useEffect(() => {
    apiFetch<SessionInfo[]>("/api/security/sessions").then(setSessions).catch(() => setSessions([]));
    apiFetch<DeviceInfo[]>("/api/security/devices").then(setDevices).catch(() => setDevices([]));
    apiFetch<MfaMethods>("/api/security/mfa").then(setMfa).catch(() => setMfa(null));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-[var(--muted)]">Your account&apos;s security posture at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Active sessions" value={sessions.length} />
        <StatTile label="Known devices" value={devices.length} />
        <StatTile label="MFA methods enabled" value={mfa?.methods.length ?? 0} />
        <StatTile label="Your roles" value={user?.roles.length ?? 0} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Multi-factor authentication">
          {mfa?.enabled ? (
            <div className="flex flex-wrap gap-2">
              {mfa.methods.map((m) => (
                <Badge key={m} tone="success">
                  {m.replace("_", " ")}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              MFA is not enabled yet. Head to the Security page to add an extra layer of protection.
            </p>
          )}
        </Card>

        <Card title="Your roles &amp; permissions">
          <div className="flex flex-wrap gap-2">
            {user?.roles.map((r) => (
              <Badge key={r} tone="neutral">
                {r}
              </Badge>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
