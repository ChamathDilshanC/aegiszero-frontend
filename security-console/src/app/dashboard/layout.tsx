"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { clearTokens } from "@/lib/api";
import { ShieldIcon } from "@/components/ui";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/dashboard/sessions", label: "Sessions", icon: "clock" },
  { href: "/dashboard/devices", label: "Devices", icon: "device" },
  { href: "/dashboard/security", label: "Security (MFA)", icon: "lock" },
  { href: "/dashboard/users", label: "Users", icon: "users", permission: "USER_READ" },
  { href: "/dashboard/roles", label: "Roles & Permissions", icon: "key", permission: "ROLE_READ" },
  { href: "/dashboard/audit-logs", label: "Audit Logs", icon: "list", permission: "AUDIT_READ" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  useRequireAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { user, hasPermission, loading } = useAuth();

  function handleLogout() {
    clearTokens();
    router.push("/login");
  }

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex">
        <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] px-4 py-6 md:block">
          <div className="mb-8 flex items-center gap-2 px-2">
            <ShieldIcon />
            <span className="font-semibold tracking-tight">AegisZero</span>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.filter((item) => !item.permission || hasPermission(item.permission)).map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
            <div>
              <p className="text-xs text-[var(--muted)]">Signed in as</p>
              <p className="text-sm font-medium">{user?.roles.join(", ") || "User"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            >
              Sign out
            </button>
          </header>
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
