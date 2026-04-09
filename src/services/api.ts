type ApiError = {
  message: string;
  status: number;
  details?: unknown;
};

const DEFAULT_BASE_URL = "https://system.spokebynishitsoni.com";



export const apiBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;

export const tokenStorageKey = "tm_token";

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
};

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

  if (options?.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options?.auth !== false) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options?.signal,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
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
