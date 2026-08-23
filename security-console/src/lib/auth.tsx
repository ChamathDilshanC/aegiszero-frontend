"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { clearTokens, decodeToken, getAccessToken, isAuthenticated as hasToken } from "@/lib/api";

interface AuthUser {
  userId: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshFromToken: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readUserFromToken(): AuthUser | null {
  const token = getAccessToken();
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload) return null;
  return {
    userId: String(payload.sub ?? ""),
    roles: Array.isArray(payload.roles) ? (payload.roles as string[]) : [],
    permissions: Array.isArray(payload.permissions) ? (payload.permissions as string[]) : [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(readUserFromToken());
    setLoading(false);
  }, []);

  const refreshFromToken = () => setUser(readUserFromToken());

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasPermission: (permission) => user?.permissions.includes(permission) ?? false,
        hasRole: (role) => user?.roles.includes(role) ?? false,
        refreshFromToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Redirects to /login if there is no access token. Use inside client pages under /dashboard. */
export function useRequireAuth() {
  const router = useRouter();
  useEffect(() => {
    if (!hasToken()) {
      router.replace("/login");
    }
  }, [router]);
}
