"use client";

import { apiRequest, buildQuery } from "@/lib/api";
import type { ApiActionPeopleGroup } from "./types";

export async function listActionPeopleGroups(
  token: string,
  projectId: string,
  actionId: string,
  params?: {
    participationKind?: "PARTICIPANT" | "TEAM";
  },
) {
  const query = buildQuery(params);
  return apiRequest<ApiActionPeopleGroup[]>(
    `/projects/${projectId}/actions/${actionId}/people-groups${query}`,
    {},
    token,
  );
}
