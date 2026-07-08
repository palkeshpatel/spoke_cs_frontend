type ApiError = {
  message: string;
  status: number;
  details?: unknown;
};

const DEFAULT_BASE_URL = "https://system.spokebynishitsoni.com";



export const apiBaseUrl = () => {
  // @ts-ignore
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    // @ts-ignore
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  return DEFAULT_BASE_URL;
};

export const tokenStorageKey = "tm_token";
export const branchStorageKey = "tm_branch";

export const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(tokenStorageKey) ?? window.sessionStorage.getItem(tokenStorageKey);
};

export const setAuthToken = (token: string, remember = true) => {
  if (remember) {
    window.localStorage.setItem(tokenStorageKey, token);
    window.sessionStorage.removeItem(tokenStorageKey);
    return;
  }

  window.sessionStorage.setItem(tokenStorageKey, token);
  window.localStorage.removeItem(tokenStorageKey);
};

export const clearAuthToken = () => {
  window.localStorage.removeItem(tokenStorageKey);
  window.sessionStorage.removeItem(tokenStorageKey);
  window.localStorage.removeItem(branchStorageKey);
  window.sessionStorage.removeItem(branchStorageKey);
};

export type SessionBranch = {
  id: number;
  name: string;
  code: string;
};

export const setSessionBranch = (branch: SessionBranch | null, remember = true) => {
  if (branch === null) {
    window.localStorage.removeItem(branchStorageKey);
    window.sessionStorage.removeItem(branchStorageKey);
    return;
  }
  const raw = JSON.stringify(branch);
  if (remember) {
    window.localStorage.setItem(branchStorageKey, raw);
    window.sessionStorage.removeItem(branchStorageKey);
    return;
  }
  window.sessionStorage.setItem(branchStorageKey, raw);
  window.localStorage.removeItem(branchStorageKey);
};

export const getSessionBranch = (): SessionBranch | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(branchStorageKey) ?? window.sessionStorage.getItem(branchStorageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionBranch;
    if (!parsed || typeof parsed.id !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
};

/** Full URL for public paths returned by the API (e.g. `/uploads/...`) or absolute URLs. */
export function resolvePublicUrl(path: string | null | undefined): string | null {
  if (path == null || path === "") return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = apiBaseUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiRequest<TResponse>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    auth?: boolean;
    signal?: AbortSignal;
  },
): Promise<TResponse> {
  const url = `${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const method = options?.method ?? "GET";
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options?.body !== undefined && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (options?.auth !== false) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const sessionBranch = getSessionBranch();
    if (sessionBranch) {
      headers["X-Branch-ID"] = String(sessionBranch.id);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options?.body !== undefined
      ? (options.body instanceof FormData ? options.body : JSON.stringify(options.body))
      : undefined,
    signal: options?.signal,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && options?.auth !== false && getAuthToken()) {
      clearAuthToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    const errorMessage =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message?: unknown }).message ?? "Request failed")
        : "Request failed";
    const err: ApiError = {
      message: errorMessage,
      status: res.status,
      details: data,
    };
    throw err;
  }

  return data as TResponse;
}
