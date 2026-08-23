"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Card, TextInput, Alert, Badge, Spinner } from "@/components/ui";

interface AuditLogResponse {
  id: string;
  eventType: string;
  actorId: string;
  targetId: string;
  ipAddress: string;
  occurredAt: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
}

const EVENT_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  LOGIN_SUCCESS: "success",
  LOGIN_FAILED: "warning",
  DEVICE_BLOCKED: "danger",
  SESSION_TERMINATED: "warning",
};

export default function AuditLogsPage() {
  const [eventType, setEventType] = useState("");
  const [data, setData] = useState<PageResponse<AuditLogResponse> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams({ size: "50", sort: "occurredAt,desc" });
      if (eventType) params.set("eventType", eventType);
      apiFetch<PageResponse<AuditLogResponse>>(`/api/audit/logs?${params.toString()}`)
        .then(setData)
        .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load audit logs"));
    }, 250);
    return () => clearTimeout(handle);
  }, [eventType]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Audit logs</h1>
        <p className="text-sm text-[var(--muted)]">{data ? `${data.totalElements} events recorded` : "Loading…"}</p>
      </div>

      <TextInput
        placeholder="Filter by event type (e.g. LOGIN_SUCCESS)…"
        value={eventType}
        onChange={(e) => setEventType(e.target.value.toUpperCase())}
        className="max-w-sm"
      />

      {error && <Alert>{error}</Alert>}

      <Card>
        {!data ? (
          <div className="flex items-center gap-2 py-8 justify-center text-[var(--muted)]">
            <Spinner /> Loading events…
          </div>
        ) : data.content.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--muted)]">No matching events.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                  <th className="pb-2 pr-4 font-medium">Event</th>
                  <th className="pb-2 pr-4 font-medium">Actor</th>
                  <th className="pb-2 pr-4 font-medium">Target</th>
                  <th className="pb-2 pr-4 font-medium">IP</th>
                  <th className="pb-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.content.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2.5 pr-4">
                      <Badge tone={EVENT_TONE[e.eventType] ?? "neutral"}>{e.eventType}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-[var(--muted)]">{e.actorId?.slice(0, 8) ?? "—"}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-[var(--muted)]">{e.targetId?.slice(0, 8) ?? "—"}</td>
                    <td className="py-2.5 pr-4 text-[var(--muted)]">{e.ipAddress ?? "—"}</td>
                    <td className="py-2.5 text-[var(--muted)]">{new Date(e.occurredAt).toLocaleString()}</td>
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
