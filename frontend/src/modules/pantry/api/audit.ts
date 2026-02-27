"use client";

import { apiRequest, buildQuery } from "@/lib/api";
import type { PantryAuditLogListResponse } from "./types";

export async function listPantryItemAuditLogs(
  token: string,
  itemId: string,
  params?: { page?: number; limit?: number },
) {
  const query = buildQuery(params);
  return apiRequest<PantryAuditLogListResponse>(
    `/pantry/items/${itemId}/audit${query}`,
    {},
    token,
  );
}

