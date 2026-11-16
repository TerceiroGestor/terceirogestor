"use client";

import { apiRequest, buildQuery } from "@/lib/api";
import type { ApiActivityType } from "./types";

export async function listActivityTypes(
  token: string,
  params?: { q?: string; isActive?: boolean },
) {
  const query = buildQuery({
    q: params?.q,
    isActive:
      params?.isActive === undefined ? undefined : String(params.isActive),
  });
  return apiRequest<ApiActivityType[]>(`/action-types${query}`, {}, token);
}

export async function createActivityType(
  token: string,
  payload: {
    name: string;
    description?: string | null;
    target?: "PROJECT" | "PEOPLE_GROUP" | "ENROLLMENT";
    isActive?: boolean;
  },
) {
  return apiRequest<ApiActivityType>(
    "/action-types",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updateActivityType(
  token: string,
  id: string,
  payload: Partial<{
    name: string;
    description: string | null;
    target: "PROJECT" | "PEOPLE_GROUP" | "ENROLLMENT";
    isActive: boolean;
  }>,
) {
  return apiRequest<ApiActivityType>(
    `/action-types/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteActivityType(token: string, id: string) {
  return apiRequest<{ ok: true }>(
    `/action-types/${id}`,
    { method: "DELETE" },
    token,
  );
}
