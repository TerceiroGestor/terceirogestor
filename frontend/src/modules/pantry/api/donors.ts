"use client";

import { apiRequest, buildQuery } from "@/lib/api";
import type { ApiPantryDonor, PantryDonorInput, PantryDonorsListResponse } from "./types";

export async function listPantryDonors(
  token: string,
  params?: { page?: number; limit?: number; q?: string; search?: string },
) {
  const query = buildQuery(params);
  return apiRequest<PantryDonorsListResponse>(`/pantry/donors${query}`, {}, token);
}

export async function createPantryDonor(token: string, payload: PantryDonorInput) {
  return apiRequest<ApiPantryDonor>(
    "/pantry/donors",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}
