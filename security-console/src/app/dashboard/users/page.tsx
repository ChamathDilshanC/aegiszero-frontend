"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Card, TextInput, Alert, Badge, Spinner } from "@/components/ui";

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  createdAt: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  totalPages: number;
  totalElements: number;
}

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<PageResponse<UserResponse> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams({ size: "25" });
      if (query) params.set("q", query);
      apiFetch<PageResponse<UserResponse>>(`/api/users?${params.toString()}`)
        .then(setData)
        .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load users"));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="text-sm text-[var(--muted)]">{data ? `${data.totalElements} accounts` : "Loading…"}</p>
      </div>

      <TextInput placeholder="Search by name or email…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />

      {error && <Alert>{error}</Alert>}

      <Card>
        {!data ? (
          <div className="flex items-center gap-2 py-8 justify-center text-[var(--muted)]">
            <Spinner /> Loading users…
          </div>
        ) : data.content.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--muted)]">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.content.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2.5 pr-4">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="py-2.5 pr-4 text-[var(--muted)]">{u.email}</td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={u.status === "ACTIVE" ? "success" : "danger"}>{u.status}</Badge>
                    </td>
                    <td className="py-2.5 text-[var(--muted)]">{new Date(u.createdAt).toLocaleDateString()}</td>
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
