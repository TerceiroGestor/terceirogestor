"use client";

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
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => ({})) : null;

  if (!response.ok) {
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
}
