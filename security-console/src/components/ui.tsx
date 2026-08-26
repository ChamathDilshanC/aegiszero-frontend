"use client";

import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[var(--accent)]/10 blur-[120px]"
      />
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
              <ShieldIcon className="h-5 w-5" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-[var(--foreground)]">AegisZero</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-[var(--muted)]">{subtitle}</p>}
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]/90 p-6 shadow-[var(--shadow-pop)] backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ShieldIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`h-7 w-7 text-[var(--accent)] ${className}`}>
      <path
        d="M12 2 4 5v6c0 5.25 3.4 9.74 8 11 4.6-1.26 8-5.75 8-11V5l-8-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-alt)] px-3.5 py-2.5 text-sm text-[var(--foreground)] " +
        "placeholder:text-[var(--muted-soft)] outline-none transition-all duration-150 " +
        "focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--accent-ring)] hover:border-[var(--muted-soft)]/60 " +
        (props.className ?? "")
      }
    />
  );
}

export function Button({
  children,
  className = "",
  variant = "primary",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const styles = {
    // Fixed brand gradient regardless of theme - a primary action should stay
    // recognizable in both, unlike the sidebar's active-state accent (which
    // deliberately swaps per theme). Hover shifts the angle rather than just
    // brightening, plus a slight scale - both called for explicitly.
    primary:
      "bg-[linear-gradient(135deg,var(--brand-deep-blue),var(--brand-vibrant-blue))] text-white " +
      "shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_8px_20px_-8px_rgba(67,0,255,0.5)] " +
      "hover:bg-[linear-gradient(135deg,var(--brand-vibrant-blue),var(--brand-cyan))] hover:scale-105 active:scale-100",
    secondary:
      "bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] hover:border-[var(--muted-soft)]/50",
    danger:
      "bg-gradient-to-b from-[var(--danger)] to-[#e2445f] text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_8px_20px_-8px_rgba(251,113,133,0.5)] hover:brightness-105 active:brightness-95",
    ghost: "bg-transparent text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]",
  }[variant];

  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:brightness-100 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-[var(--danger)]/25 bg-[var(--danger-soft)] text-[var(--danger)]",
    success: "border-[var(--success)]/25 bg-[var(--success-soft)] text-[var(--success)]",
    info: "border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--accent)]",
  }[kind];
  const dot = { error: "bg-[var(--danger)]", success: "bg-[var(--success)]", info: "bg-[var(--accent)]" }[kind];
  return (
    <div className={`mb-4 flex items-start gap-2.5 rounded-[var(--radius-md)] border px-3.5 py-2.5 text-sm animate-fade-in ${styles}`}>
      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      <span>{children}</span>
    </div>
  );
}

export function Card({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition-colors duration-150 hover:border-[var(--muted-soft)]/40">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  dot = false,
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger";
  dot?: boolean;
  children: ReactNode;
}) {
  const styles = {
    // 10%-opacity brand-color background, per the design spec - dark mode
    // pairs it with vibrant (accent-colored) text, light mode with plain
    // dark text, since a light tint under light text would have no contrast.
    neutral: "bg-[var(--accent-soft)] text-[var(--foreground)] dark:text-[var(--accent)] ring-1 ring-inset ring-[var(--accent)]/15",
    success: "bg-[var(--success-soft)] text-[var(--success)] ring-1 ring-inset ring-[var(--success)]/20",
    warning: "bg-[var(--warning-soft)] text-[var(--warning)] ring-1 ring-inset ring-[var(--warning)]/20",
    danger: "bg-[var(--danger-soft)] text-[var(--danger)] ring-1 ring-inset ring-[var(--danger)]/20",
  }[tone];
  const dotColor = {
    neutral: "bg-[var(--muted)]",
    success: "bg-[var(--success)]",
    warning: "bg-[var(--warning)]",
    danger: "bg-[var(--danger)]",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
      {children}
    </span>
  );
}

export function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] transition-colors duration-150 hover:border-[var(--muted-soft)]/40">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--muted)]">{label}</p>
        {icon && <span className="text-[var(--muted-soft)]">{icon}</span>}
      </div>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{value}</p>
    </div>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/** Simple identity chip: initials avatar + label/sublabel. Used in the dashboard header. */
export function IdentityChip({ label, sublabel }: { label: string; sublabel?: string }) {
  const initial = label.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)]/25 to-[var(--accent-2)]/25 text-sm font-semibold text-[var(--accent)] ring-1 ring-inset ring-[var(--border)]">
        {initial}
      </span>
      <div className="min-w-0">
        {sublabel && <p className="text-xs text-[var(--muted)]">{sublabel}</p>}
        <p className="truncate text-sm font-medium text-[var(--foreground)]">{label}</p>
      </div>
    </div>
  );
}

const NAV_ICON_PATHS: Record<string, ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" />
    </>
  ),
  device: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2.5" />
      <path d="M11 18h2" strokeLinecap="round" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c.7-3.6 3.3-5.5 6.5-5.5s5.8 1.9 6.5 5.5" strokeLinecap="round" />
      <path d="M15.5 5.2a3.2 3.2 0 0 1 0 6.1" strokeLinecap="round" />
      <path d="M16 14.6c2.6.5 4.5 2.2 5 5.4" strokeLinecap="round" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1-4.2 4-6.5 7.5-6.5s6.5 2.3 7.5 6.5" strokeLinecap="round" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15.5" r="4" />
      <path d="M11 12.5 19.5 4M16.5 7 19 4.5M14 9.5 16.5 7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" strokeLinecap="round" />
      <circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  block: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" strokeLinecap="round" />
    </>
  ),
};

export function NavIcon({ name, className = "h-4.5 w-4.5" }: { name: string; className?: string }) {
  const path = NAV_ICON_PATHS[name];
  if (!path) return null;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
      {path}
    </svg>
  );
}
