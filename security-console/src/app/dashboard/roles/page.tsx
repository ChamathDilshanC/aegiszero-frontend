"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, Button, TextInput, Field, Alert, Badge, Spinner } from "@/components/ui";

// Stagger: the parent fires this on its children in DOM order (60ms apart);
// each child just needs its own from/to. Keying cards by role.id means an
// existing card never replays this on a data refresh - React keeps the same
// DOM node - so only a genuinely new role card (create) plays the entrance.
const CARD_GRID_VARIANTS: Variants = {
  visible: { transition: { staggerChildren: 0.06 } },
};
const CARD_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

interface RoleResponse {
  id: string;
  name: string;
  description: string;
  systemRole: boolean;
  permissions: string[];
}

interface PermissionResponse {
  id: string;
  name: string;
  description: string;
}

/** Checkbox list of permission names, shared by the create and edit role forms. */
function PermissionPicker({
  permissions,
  selected,
  onToggle,
}: {
  permissions: PermissionResponse[];
  selected: string[];
  onToggle: (name: string) => void;
}) {
  if (permissions.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No permissions exist yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
      {permissions.map((p) => (
        <label key={p.id} className="flex items-center gap-2 text-sm text-[var(--foreground)]">
          <input
            type="checkbox"
            checked={selected.includes(p.name)}
            onChange={() => onToggle(p.name)}
            className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
          />
          {p.name}
        </label>
      ))}
    </div>
  );
}

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const canCreateRole = hasPermission("ROLE_CREATE");
  const canUpdateRole = hasPermission("ROLE_UPDATE");
  const canDeleteRole = hasPermission("ROLE_DELETE");

  const [roles, setRoles] = useState<RoleResponse[] | null>(null);
  const [permissions, setPermissions] = useState<PermissionResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [creatingRole, setCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);

  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  const [creatingPermission, setCreatingPermission] = useState(false);
  const [newPermissionName, setNewPermissionName] = useState("");
  const [newPermissionDescription, setNewPermissionDescription] = useState("");

  function loadRoles() {
    apiFetch<RoleResponse[]>("/api/access/roles")
      .then(setRoles)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load roles"));
  }

  function loadPermissions() {
    apiFetch<PermissionResponse[]>("/api/access/permissions")
      .then(setPermissions)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load permissions"));
  }

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  function togglePermission(list: string[], setList: (v: string[]) => void, name: string) {
    setList(list.includes(name) ? list.filter((p) => p !== name) : [...list, name]);
  }

  async function createRole() {
    setError(null);
    setBusy(true);
    try {
      await apiFetch("/api/access/roles", {
        method: "POST",
        body: JSON.stringify({ name: newRoleName, description: newRoleDescription, permissions: newRolePermissions }),
      });
      setInfo(`Role "${newRoleName}" created.`);
      setCreatingRole(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setNewRolePermissions([]);
      loadRoles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create role");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(role: RoleResponse) {
    setEditingRoleId(role.id);
    setEditDescription(role.description ?? "");
    setEditPermissions(role.permissions);
  }

  async function saveEdit(roleId: string) {
    setError(null);
    setBusy(true);
    try {
      await apiFetch(`/api/access/roles/${roleId}`, {
        method: "PUT",
        body: JSON.stringify({ description: editDescription, permissions: editPermissions }),
      });
      setEditingRoleId(null);
      loadRoles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update role");
    } finally {
      setBusy(false);
    }
  }

  async function deleteRole(role: RoleResponse) {
    if (!window.confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    setError(null);
    setBusy(true);
    try {
      await apiFetch(`/api/access/roles/${role.id}`, { method: "DELETE" });
      loadRoles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete role");
    } finally {
      setBusy(false);
    }
  }

  async function createPermission() {
    setError(null);
    setBusy(true);
    try {
      await apiFetch("/api/access/permissions", {
        method: "POST",
        body: JSON.stringify({ name: newPermissionName, description: newPermissionDescription }),
      });
      setInfo(`Permission "${newPermissionName}" created.`);
      setCreatingPermission(false);
      setNewPermissionName("");
      setNewPermissionDescription("");
      loadPermissions();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create permission");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Roles &amp; permissions</h1>
        <p className="text-sm text-[var(--muted)]">The platform&apos;s access control model.</p>
      </div>

      {error && <Alert>{error}</Alert>}
      {info && <Alert kind="info">{info}</Alert>}

      <Card
        title="Roles"
        action={
          canCreateRole &&
          !creatingRole && (
            <Button variant="secondary" onClick={() => setCreatingRole(true)}>
              New role
            </Button>
          )
        }
      >
        {creatingRole && (
          <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-alt)] p-4">
            <Field label="Name">
              <TextInput value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="e.g. AUDITOR" />
            </Field>
            <Field label="Description">
              <TextInput value={newRoleDescription} onChange={(e) => setNewRoleDescription(e.target.value)} />
            </Field>
            <p className="mb-1.5 text-sm font-medium text-[var(--foreground)]">Permissions</p>
            <div className="mb-4">
              <PermissionPicker
                permissions={permissions ?? []}
                selected={newRolePermissions}
                onToggle={(name) => togglePermission(newRolePermissions, setNewRolePermissions, name)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createRole} disabled={busy || !newRoleName.trim()}>
                Create role
              </Button>
              <Button variant="secondary" onClick={() => setCreatingRole(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!roles ? (
          <div className="flex items-center gap-2 py-8 justify-center text-[var(--muted)]">
            <Spinner /> Loading roles…
          </div>
        ) : (
          <motion.div
            className="grid gap-4 md:grid-cols-2"
            initial="hidden"
            animate="visible"
            variants={CARD_GRID_VARIANTS}
          >
            {roles.map((role) => (
              <motion.div
                key={role.id}
                variants={CARD_VARIANTS}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className={
                  "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-alt)] p-4 " +
                  "shadow-[var(--shadow-card)] transition-shadow duration-200 " +
                  "hover:border-[var(--brand-cyan)]/60 hover:shadow-[0_0_0_1px_var(--brand-cyan),0_12px_32px_-10px_rgba(0,202,255,0.35)]"
                }
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="font-semibold">{role.name}</h2>
                  {role.systemRole && <Badge tone="neutral">System</Badge>}
                </div>

                {editingRoleId === role.id ? (
                  <div>
                    <Field label="Description">
                      <TextInput value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                    </Field>
                    <p className="mb-1.5 text-sm font-medium text-[var(--foreground)]">Permissions</p>
                    <div className="mb-4">
                      <PermissionPicker
                        permissions={permissions ?? []}
                        selected={editPermissions}
                        onToggle={(name) => togglePermission(editPermissions, setEditPermissions, name)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => saveEdit(role.id)} disabled={busy}>
                        Save
                      </Button>
                      <Button variant="secondary" onClick={() => setEditingRoleId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mb-3 text-sm text-[var(--muted)]">{role.description}</p>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {role.permissions.length === 0 ? (
                        <span className="text-xs text-[var(--muted-soft)]">No permissions</span>
                      ) : (
                        role.permissions.map((p) => (
                          <Badge key={p} tone="neutral">
                            {p}
                          </Badge>
                        ))
                      )}
                    </div>
                    {(canUpdateRole || (canDeleteRole && !role.systemRole)) && (
                      <div className="flex gap-2">
                        {canUpdateRole && (
                          <Button variant="secondary" onClick={() => startEdit(role)} disabled={busy}>
                            Edit
                          </Button>
                        )}
                        {canDeleteRole && !role.systemRole && (
                          <Button variant="danger" onClick={() => deleteRole(role)} disabled={busy}>
                            Delete
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>

      <Card
        title="Permissions"
        action={
          canCreateRole &&
          !creatingPermission && (
            <Button variant="secondary" onClick={() => setCreatingPermission(true)}>
              New permission
            </Button>
          )
        }
      >
        {creatingPermission && (
          <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-alt)] p-4">
            <Field label="Name">
              <TextInput value={newPermissionName} onChange={(e) => setNewPermissionName(e.target.value)} placeholder="e.g. REPORT_EXPORT" />
            </Field>
            <Field label="Description">
              <TextInput value={newPermissionDescription} onChange={(e) => setNewPermissionDescription(e.target.value)} />
            </Field>
            <div className="flex gap-2">
              <Button onClick={createPermission} disabled={busy || !newPermissionName.trim()}>
                Create permission
              </Button>
              <Button variant="secondary" onClick={() => setCreatingPermission(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!permissions ? (
          <div className="flex items-center gap-2 py-8 justify-center text-[var(--muted)]">
            <Spinner /> Loading permissions…
          </div>
        ) : permissions.length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--muted)]">No permissions defined yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {permissions.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-4 font-mono text-xs">{p.name}</td>
                    <td className="py-2.5 text-[var(--muted)]">{p.description}</td>
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
