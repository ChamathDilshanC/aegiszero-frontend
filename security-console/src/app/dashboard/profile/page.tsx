"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
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

export default function ProfilePage() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  function load() {
    apiFetch<UserResponse>("/api/users/me")
      .then((u) => {
        setUser(u);
        setFirstName(u.firstName ?? "");
        setLastName(u.lastName ?? "");
        setAvatarUrl(u.avatarUrl ?? "");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load your profile"));
  }

  useEffect(load, []);

  async function save() {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const updated = await apiFetch<UserResponse>("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({ firstName, lastName, avatarUrl: avatarUrl || null }),
      });
      setUser(updated);
      setInfo("Profile updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Your profile</h1>
        <p className="text-sm text-[var(--muted)]">How you appear across the console.</p>
      </div>

      {error && <Alert>{error}</Alert>}
      {info && <Alert kind="info">{info}</Alert>}

      {!user ? (
        <div className="flex items-center gap-2 py-8 justify-center text-[var(--muted)]">
          <Spinner /> Loading…
        </div>
      ) : (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">{user.email}</p>
              <p className="text-xs text-[var(--muted)]">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <Badge tone={user.status === "ACTIVE" ? "success" : "danger"}>{user.status}</Badge>
          </div>

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

          <Button onClick={save} disabled={busy}>
            Save changes
          </Button>
        </Card>
      )}
    </div>
  );
}
