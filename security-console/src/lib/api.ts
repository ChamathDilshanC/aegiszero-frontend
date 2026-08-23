const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const ACCESS_TOKEN_KEY = "aegiszero.accessToken";
const REFRESH_TOKEN_KEY = "aegiszero.refreshToken";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

/** Decodes the JWT payload without verifying the signature (display use only; the API is the source of truth). */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = await res.json();
        setTokens(data.accessToken, data.refreshToken);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefreshRetry?: boolean;
}

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipAuth, skipRefreshRetry, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, { ...rest, headers: finalHeaders });

  if (response.status === 401 && !skipAuth && !skipRefreshRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, skipRefreshRetry: true });
    }
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Session expired");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof body === "object" && body && "message" in body ? String(body.message) : String(body);
    const code = typeof body === "object" && body && "error" in body ? String(body.error) : undefined;
    throw new ApiError(response.status, message || "Request failed", code);
  }

  return body as T;
}
