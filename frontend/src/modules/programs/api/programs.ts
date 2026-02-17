import { apiRequest, buildQuery } from "@/lib/api";
import type { ApiProgram, ProgramInput, ProgramsListResponse } from "./types";

export async function listPrograms(
  token: string,
  params?: {
    q?: string;
    type?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
    all?: boolean;
  },
) {
  const query = buildQuery(params);
  return apiRequest<ProgramsListResponse>(`/programs${query}`, {}, token);
}

export async function createProgram(token: string, payload: ProgramInput) {
  return apiRequest<ApiProgram>(
    "/programs",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updateProgram(
  token: string,
  id: string,
  payload: Partial<ProgramInput>,
) {
  return apiRequest<ApiProgram>(
    `/programs/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteProgram(token: string, id: string) {
  return apiRequest<{ ok: true }>(
    `/programs/${id}`,
    { method: "DELETE" },
    token,
  );
}

