"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { ShieldIcon, NavIcon, IdentityChip } from "@/components/ui";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/dashboard/profile", label: "Profile", icon: "user" },
  { href: "/dashboard/sessions", label: "Sessions", icon: "clock" },
  { href: "/dashboard/devices", label: "Devices", icon: "device" },
  { href: "/dashboard/security", label: "Security (MFA)", icon: "lock" },
  { href: "/dashboard/blocked-ips", label: "Blocked IPs", icon: "block", permission: "SECURITY_MANAGE" },
  { href: "/dashboard/users", label: "Users", icon: "users", permission: "USER_READ" },
  { href: "/dashboard/roles", label: "Roles & Permissions", icon: "key", permission: "ROLE_READ" },
  { href: "/dashboard/audit-logs", label: "Audit Logs", icon: "list", permission: "AUDIT_READ" },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
        <ShieldIcon className="h-4.5 w-4.5" />
      </span>
      <span className="font-semibold tracking-tight">AegisZero</span>
    </div>
  );
}

function NavLinks({ pathname, hasPermission, onNavigate }: {
  pathname: string;
  hasPermission: (p: string) => boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.filter((item) => !item.permission || hasPermission(item.permission)).map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
              active
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            }`}
          >
            <span
              className={`absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[var(--accent)] transition-opacity duration-150 ${
                active ? "opacity-100" : "opacity-0"
              }`}
            />
            <NavIcon name={item.icon} className={`h-4.5 w-4.5 shrink-0 ${active ? "" : "opacity-70 group-hover:opacity-100"}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  useRequireAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { user, hasPermission, loading, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (loading) return null;

  const identityLabel = user?.roles.length ? user.roles.join(", ") : "Standard access";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] px-4 py-6 md:flex md:flex-col">
          <div className="mb-8">
            <Brand />
          </div>
          <NavLinks pathname={pathname} hasPermission={hasPermission} />
        </aside>

        {/* Mobile slide-over nav */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-72 border-r border-[var(--border)] bg-[var(--surface)] px-4 py-6 shadow-[var(--shadow-pop)]">
              <div className="mb-8 flex items-center justify-between">
                <Brand />
                <button
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close menu"
                  className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <NavLinks pathname={pathname} hasPermission={hasPermission} onNavigate={() => setMobileNavOpen(false)} />
            </aside>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface)]/90 px-4 py-3.5 backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open menu"
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] md:hidden"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                </svg>
              </button>
              <IdentityChip label={identityLabel} sublabel="Signed in as" />
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] transition-colors duration-150 hover:border-[var(--danger)]/30 hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </header>
          <main className="animate-fade-in p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
