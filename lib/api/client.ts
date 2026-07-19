export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

const TOKEN_KEY = 'helpdesk_access_token';
const REFRESH_KEY = 'helpdesk_refresh_token';
export const SESSION_EXPIRED_EVENT = 'helpdesk:session-expired';

let refreshInFlight: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function notifySessionExpired(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

function isAuthFailureStatus(status: number): boolean {
  return status === 401 || status === 403;
}

function isRateLimitMessage(message: string): boolean {
  const value = message.toLowerCase();
  return (
    value.includes('throttlerexception') ||
    value.includes('too many requests') ||
    value.includes('too many attempts') ||
    value.includes('rate limit')
  );
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        clearTokens();
        notifySessionExpired();
        return null;
      }

      const data = (await res.json()) as {
        access_token: string;
        refresh_token: string;
      };
      setTokens(data.access_token, data.refresh_token);
      return data.access_token;
    } catch {
      clearTokens();
      notifySessionExpired();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export type ApiFetchOptions = RequestInit & {
  headers?: Record<string, string>;
};

export async function apiFetch<T = any>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T | null> {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const headers: Record<string, string> = {
    'x-api-key': API_KEY,
    ...(options.headers as Record<string, string> | undefined),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  if (isAuthFailureStatus(res.status) && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
    }
  }

  if (!res.ok) {
    let message: string = `Request failed (${res.status})`;
    try {
      const err = (await res.json()) as { message?: string | string[] };
      message = Array.isArray(err.message)
        ? err.message.join(', ')
        : err.message || message;
    } catch {
      /* ignore */
    }

    if (res.status === 429 || isRateLimitMessage(message)) {
      const alreadyFriendly = /please wait/i.test(message);
      if (!alreadyFriendly) {
        message =
          'You have made too many attempts. Please wait about a minute, then try again.';
      }
    }

    if (
      isAuthFailureStatus(res.status) &&
      message.toLowerCase().includes('session expired')
    ) {
      clearTokens();
      notifySessionExpired();
    }

    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : null;
}

export const api = {
  get: <T = any>(path: string) => apiFetch<T>(path),
  post: <T = any>(path: string, body: unknown) =>
    apiFetch<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T = any>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = any>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' }),
};
