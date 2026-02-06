"use client";

import { API_URL, type ApiError } from "@/lib/api";

export type UploadResponse = {
  path: string;
};

export async function uploadAvatar(
  token: string,
  file: File,
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}/files/avatars`, {
    method: "POST",
    headers,
    body: formData,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => ({})) : {};

  if (!response.ok) {
    const message =
      (payload && typeof payload.message === "string" && payload.message) ||
      `Upload failed (${response.status})`;
    const error: ApiError = {
      message,
      status: response.status,
      details: payload,
    };
    throw error;
  }

  return payload as UploadResponse;
}
