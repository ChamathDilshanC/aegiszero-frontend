"use client";

import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <ShieldIcon />
            <span className="text-xl font-semibold tracking-tight text-[var(--foreground)]">AegisZero</span>
          </div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl shadow-black/20">
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
        "w-full rounded-lg border border-[var(--border)] bg-[#0d1526] px-3.5 py-2.5 text-sm text-[var(--foreground)] " +
        "placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] " +
        (props.className ?? "")
      }
    />
  );
}

export function Button({ children, className = "", variant = "primary", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const styles = {
    primary: "bg-[var(--accent)] text-[#04121a] hover:opacity-90",
    secondary: "bg-transparent border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
    danger: "bg-[var(--danger)] text-[#2a0a0a] hover:opacity-90",
  }[variant];

  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]",
    success: "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]",
    info: "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]",
  }[kind];
  return <div className={`mb-4 rounded-lg border px-3.5 py-2.5 text-sm ${styles}`}>{children}</div>;
}

export function Card({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "danger"; children: ReactNode }) {
  const styles = {
    neutral: "bg-white/5 text-[var(--muted)]",
    success: "bg-[var(--success)]/10 text-[var(--success)]",
    warning: "bg-[var(--warning)]/10 text-[var(--warning)]",
    danger: "bg-[var(--danger)]/10 text-[var(--danger)]",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>{children}</span>;
}

export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

export function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
