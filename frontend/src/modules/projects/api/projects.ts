import { apiRequest, buildQuery } from "@/lib/api";
import type { ApiProject, ProjectInput, ProjectsListResponse } from "./types";

export async function listProjects(
  token: string,
  params?: {
    q?: string;
    programId?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
    all?: boolean;
  },
) {
  const query = buildQuery(params);
  return apiRequest<ProjectsListResponse>(`/projects${query}`, {}, token);
}

export async function getProject(token: string, id: string) {
  return apiRequest<ApiProject>(`/projects/${id}`, {}, token);
}

export async function createProject(token: string, payload: ProjectInput) {
  return apiRequest<ApiProject>(
    "/projects",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updateProject(
  token: string,
  id: string,
  payload: Partial<ProjectInput>,
) {
  return apiRequest<ApiProject>(
    `/projects/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteProject(token: string, id: string) {
  return apiRequest<{ ok: true }>(
    `/projects/${id}`,
    { method: "DELETE" },
    token,
  );
}
