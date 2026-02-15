import { apiRequest, buildQuery } from "@/lib/api";
import type {
  ApiPantryEntry,
  ApiPantryExit,
  PantryExitInput,
  PantryExitsListResponse,
} from "./types";

export async function reversePantryExit(
  token: string,
  exitId: string,
  payload?: { date?: string; notes?: string },
) {
  return apiRequest<{ ok: true; exitId: string; createdEntries: ApiPantryEntry[] }>(
    `/pantry/exits/${exitId}/reverse`,
    { method: "POST", body: JSON.stringify(payload ?? {}) },
    token,
  );
}

export async function listPantryExits(
  token: string,
  params?: {
    q?: string;
    search?: string;
    page?: number;
    limit?: number;
    itemId?: string;
    type?: string;
    from?: string;
    to?: string;
  },
) {
  const query = buildQuery(params);
  return apiRequest<PantryExitsListResponse>(`/pantry/exits${query}`, {}, token);
}

export async function getPantryExit(token: string, id: string) {
  return apiRequest<ApiPantryExit>(`/pantry/exits/${id}`, {}, token);
}

export async function createPantryExit(token: string, payload: PantryExitInput) {
  return apiRequest<ApiPantryExit>(
    "/pantry/exits",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updatePantryExit(
  token: string,
  id: string,
  payload: Partial<PantryExitInput>,
) {
  return apiRequest<ApiPantryExit>(
    `/pantry/exits/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deletePantryExit(token: string, id: string) {
  return apiRequest<{ ok: true }>(
    `/pantry/exits/${id}`,
    { method: "DELETE" },
    token,
  );
}

