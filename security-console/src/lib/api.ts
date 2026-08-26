// ?? here was a trap: it falls back only on null/undefined, so a
// NEXT_PUBLIC_API_BASE_URL that is set but blank survived as "". Every request
// then became a same-origin relative URL, hit this Next app instead of the
// gateway, and came back as Next's own HTML 404 - which looks like a broken API
// rather than a missing setting. || (with a trim) treats blank as unset.
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim() || "http://localhost:8080";

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

/**
 * The actual sign-out call: revokes the refresh token server-side via
 * POST /api/auth/logout, then clears local storage regardless of whether
 * that call succeeded. Best-effort by design - the user is leaving the app
 * either way, and a token that could not be revoked (network blip, already
 * expired) still expires on its own via REFRESH_TOKEN_TTL_DAYS. A failed
 * revoke must never block the button from working.
 */
export async function apiLogout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        skipRefreshRetry: true,
      });
    } catch {
      // see comment above - intentionally swallowed
    }
  }
  clearTokens();
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

const MAX_RAW_ERROR_LENGTH = 300;

/**
 * Turns a failed response into something worth showing someone.
 *
 * The API returns a JSON body with a `message`, so that is what we want. What
 * we must not do is fall back to rendering the raw body: when a request lands
 * somewhere that is not the API - a base URL pointing at this app, or a proxy
 * in front of it - the body is a whole HTML error document, and using it as the
 * message dumped the entire page into the form. Reporting the status and the
 * URL actually attempted says far more, and points straight at the base URL
 * when that is the real problem.
 */
function errorMessageFrom(body: unknown, status: number, url: string): string {
  if (typeof body === "object" && body !== null) {
    const record = body as Record<string, unknown>;

    if (typeof record.message === "string" && record.message.trim()) {
      return record.message.trim();
    }

    // Real JSON, just not our API's shape - the gateway's own unhandled-error
    // body is {timestamp,path,status,error,requestId}, no "message" field.
    // That is not "invalid API JSON"; it is a different, still meaningful,
    // error. Reporting it beats a canned "wasn't JSON" that isn't true.
    if (typeof record.error === "string" && record.error.trim()) {
      return `${record.error} (HTTP ${status} from ${url})`;
    }

    return `HTTP ${status} from ${url}: ${JSON.stringify(body).slice(0, MAX_RAW_ERROR_LENGTH)}`;
  }

  const raw = typeof body === "string" ? body.trim() : "";
  if (raw && !raw.startsWith("<") && raw.length <= MAX_RAW_ERROR_LENGTH) {
    return raw;
  }
  return `HTTP ${status} from ${url} — the response was not valid API JSON.`;
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

  const url = `${API_BASE}${path}`;
  const response = await fetch(url, { ...rest, headers: finalHeaders });

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
    const code = typeof body === "object" && body && "error" in body ? String(body.error) : undefined;
    throw new ApiError(response.status, errorMessageFrom(body, response.status, url), code);
  }

  return body as T;
}
