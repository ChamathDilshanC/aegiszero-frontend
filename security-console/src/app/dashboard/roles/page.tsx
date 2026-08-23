"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Card, Alert, Badge, Spinner } from "@/components/ui";

interface RoleResponse {
  id: string;
  name: string;
  description: string;
  systemRole: boolean;
  permissions: string[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<RoleResponse[]>("/api/access/roles")
      .then(setRoles)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load roles"));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Roles &amp; permissions</h1>
        <p className="text-sm text-[var(--muted)]">The platform&apos;s access control model.</p>
      </div>

      {error && <Alert>{error}</Alert>}

      {!roles ? (
        <div className="flex items-center gap-2 py-8 justify-center text-[var(--muted)]">
          <Spinner /> Loading roles…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.id}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">{role.name}</h2>
                {role.systemRole && <Badge tone="neutral">System</Badge>}
              </div>
              <p className="mb-3 text-sm text-[var(--muted)]">{role.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((p) => (
                  <Badge key={p} tone="neutral">
                    {p}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
