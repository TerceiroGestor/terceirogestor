import { apiRequest, buildQuery } from "@/lib/api";
import type { ApiCycle, CycleInput, CyclesListResponse } from "./types";

export async function listCycles(
  token: string,
  params?: {
    q?: string;
    audienceType?: string;
    isActive?: boolean;
    ageMin?: number;
    ageMax?: number;
    page?: number;
    limit?: number;
    all?: boolean;
  },
) {
  const query = buildQuery(params);
  return apiRequest<CyclesListResponse>(`/cycles${query}`, {}, token);
}

export async function getCycle(token: string, id: string) {
  return apiRequest<ApiCycle>(`/cycles/${id}`, {}, token);
}

export async function createCycle(token: string, payload: CycleInput) {
  return apiRequest<ApiCycle>(
    "/cycles",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updateCycle(token: string, id: string, payload: Partial<CycleInput>) {
  return apiRequest<ApiCycle>(
    `/cycles/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteCycle(token: string, id: string) {
  return apiRequest<{ ok: true }>(
    `/cycles/${id}`,
    { method: "DELETE" },
    token,
  );
}
