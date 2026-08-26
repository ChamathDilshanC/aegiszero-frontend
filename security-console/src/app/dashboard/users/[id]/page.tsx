"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, Button, TextInput, Field, Alert, Badge, Spinner } from "@/components/ui";

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: string;
  createdAt: string;
}

interface RoleResponse {
  id: string;
  name: string;
  description: string;
  systemRole: boolean;
  permissions: string[];
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission("USER_UPDATE");
  const canDeactivate = hasPermission("USER_DELETE");
  const canAssignRoles = hasPermission("ROLE_ASSIGN");
  const canReadRoles = hasPermission("ROLE_READ");

  const [user, setUser] = useState<UserResponse | null>(null);
  const [allRoles, setAllRoles] = useState<RoleResponse[] | null>(null);
  const [userRoleNames, setUserRoleNames] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [roleToAssign, setRoleToAssign] = useState("");

  function loadUser() {
    apiFetch<UserResponse>(`/api/users/${id}`)
      .then((u) => {
        setUser(u);
        setFirstName(u.firstName ?? "");
        setLastName(u.lastName ?? "");
        setAvatarUrl(u.avatarUrl ?? "");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load user"));
  }

  function loadRoles() {
    if (!canReadRoles) return;
    apiFetch<RoleResponse[]>("/api/access/roles").then(setAllRoles).catch(() => setAllRoles([]));
    apiFetch<string[]>(`/api/access/users/${id}/roles`).then(setUserRoleNames).catch(() => setUserRoleNames([]));
  }

  useEffect(() => {
    loadUser();
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveProfile() {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const updated = await apiFetch<UserResponse>(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({ firstName, lastName, avatarUrl: avatarUrl || null }),
      });
      setUser(updated);
      setInfo("Profile updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update user");
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    if (!window.confirm(`Deactivate ${user?.email}? They will no longer be able to sign in.`)) return;
    setError(null);
    setBusy(true);
    try {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      loadUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to deactivate user");
    } finally {
      setBusy(false);
    }
  }

  async function assignRole() {
    if (!roleToAssign) return;
    setError(null);
    setBusy(true);
    try {
      await apiFetch(`/api/access/users/${id}/roles`, {
        method: "POST",
        body: JSON.stringify({ roleName: roleToAssign }),
      });
      setRoleToAssign("");
      loadRoles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to assign role");
    } finally {
      setBusy(false);
    }
  }

  async function removeRole(roleName: string) {
    // The remove endpoint takes the role's id, but listRoleNamesForUser only
    // returns names - cross-reference against the full role list to find it.
    const role = allRoles?.find((r) => r.name === roleName);
    if (!role) return;
    setError(null);
    setBusy(true);
    try {
      await apiFetch(`/api/access/users/${id}/roles/${role.id}`, { method: "DELETE" });
      loadRoles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove role");
    } finally {
      setBusy(false);
    }
  }

  const assignableRoles = (allRoles ?? []).filter((r) => !(userRoleNames ?? []).includes(r.name));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard/users" className="text-sm text-[var(--accent)] hover:underline">
          &larr; Back to users
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{user ? `${user.firstName} ${user.lastName}` : "User"}</h1>
      </div>

      {error && <Alert>{error}</Alert>}
      {info && <Alert kind="info">{info}</Alert>}

      {!user ? (
        <div className="flex items-center gap-2 py-8 justify-center text-[var(--muted)]">
          <Spinner /> Loading…
        </div>
      ) : (
        <>
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{user.email}</p>
                <p className="text-xs text-[var(--muted)]">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <Badge tone={user.status === "ACTIVE" ? "success" : "danger"}>{user.status}</Badge>
            </div>

            <fieldset disabled={!canUpdate} className="disabled:opacity-60">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First name">
                  <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </Field>
                <Field label="Last name">
                  <TextInput value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </Field>
              </div>
              <Field label="Avatar URL">
                <TextInput value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
              </Field>
            </fieldset>

            <div className="flex gap-2">
              {canUpdate && (
                <Button onClick={saveProfile} disabled={busy}>
                  Save changes
                </Button>
              )}
              {canDeactivate && user.status === "ACTIVE" && (
                <Button variant="danger" onClick={deactivate} disabled={busy}>
                  Deactivate
                </Button>
              )}
            </div>
          </Card>

          {canReadRoles && (
            <Card title="Roles">
              {!userRoleNames ? (
                <div className="flex items-center gap-2 py-4 justify-center text-[var(--muted)]">
                  <Spinner /> Loading roles…
                </div>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {userRoleNames.length === 0 ? (
                      <span className="text-sm text-[var(--muted)]">No roles assigned.</span>
                    ) : (
                      userRoleNames.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] py-0.5 pl-2.5 pr-1.5 text-xs font-medium text-[var(--muted)] ring-1 ring-inset ring-white/[0.06]"
                        >
                          {name}
                          {canAssignRoles && (
                            <button
                              onClick={() => removeRole(name)}
                              disabled={busy}
                              aria-label={`Remove ${name}`}
                              className="rounded-full p-0.5 text-[var(--muted-soft)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                              </svg>
                            </button>
                          )}
                        </span>
                      ))
                    )}
                  </div>

                  {canAssignRoles && assignableRoles.length > 0 && (
                    <div className="flex gap-2">
                      <select
                        value={roleToAssign}
                        onChange={(e) => setRoleToAssign(e.target.value)}
                        className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-alt)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]/60"
                      >
                        <option value="">Select a role…</option>
                        {assignableRoles.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <Button variant="secondary" onClick={assignRole} disabled={busy || !roleToAssign}>
                        Assign
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
