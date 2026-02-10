"use client";

import { isTokenExpired } from "@/lib/auth-utils";
import { getTenantSlug, withTenantApiPath } from "@/lib/tenant-path";

const DEFAULT_API_URL = "http://localhost:3001";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;

export function resolveMediaUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/uploads/")) return `${API_URL}${url}`;
  return url;
}

export function stripApiUrl(url: string) {
  if (url.startsWith(API_URL)) {
    return url.slice(API_URL.length);
  }
  return url;
}

export type ApiError = {
  message: string;
  status: number;
  details?: unknown;
};

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken() {
  const slug = getTenantSlug();
  const path = withTenantApiPath("/auth/refresh", slug);
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  const accessToken = payload?.accessToken;
  if (typeof accessToken !== "string" || !accessToken) {
    return null;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("auth:token", { detail: { token: accessToken } }),
    );
  }

  return accessToken;
}

async function getRefreshedToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function buildQuery(
  params?: Record<string, string | number | boolean | undefined>,
) {
  if (!params) return "";
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const execute = async (
    accessToken: string | null,
    allowRefresh: boolean,
  ): Promise<T> => {
    let nextToken = accessToken;
    if (nextToken && isTokenExpired(nextToken) && allowRefresh) {
      nextToken = await getRefreshedToken();
    }

    if (nextToken && isTokenExpired(nextToken)) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
      const error: ApiError = {
        message: "Sessao expirada. Faca login novamente.",
        status: 401,
      };
      throw error;
    }

    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }
    if (!headers.has("Cache-Control")) {
      headers.set("Cache-Control", "no-store");
    }
    if (!headers.has("Pragma")) {
      headers.set("Pragma", "no-cache");
    }
    if (nextToken) {
      headers.set("Authorization", `Bearer ${nextToken}`);
    }

    const tenantSlug = getTenantSlug();
    const resolvedPath = withTenantApiPath(path, tenantSlug);
    const response = await fetch(`${API_URL}${resolvedPath}`, {
      ...options,
      headers,
      cache: "no-store",
      credentials: "include",
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json().catch(() => ({})) : null;

    if (!response.ok) {
      if (response.status === 401 && allowRefresh) {
        const refreshed = await getRefreshedToken();
        if (refreshed) {
          return execute(refreshed, false);
        }
      }
      if (response.status === 401 && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
      const message =
        (payload && typeof payload.message === "string" && payload.message) ||
        `Request failed (${response.status})`;
      const error: ApiError = {
        message,
        status: response.status,
        details: payload,
      };
      throw error;
    }

    return payload as T;
  };

  return execute(token ?? null, true);
}
