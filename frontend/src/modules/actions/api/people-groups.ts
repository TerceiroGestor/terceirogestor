"use client";

import { apiRequest, buildQuery } from "@/lib/api";
import type { ApiActivityPeopleGroup } from "./types";

export async function listActivityPeopleGroups(
  token: string,
  projectId: string,
  actionId: string,
  params?: {
    participationKind?: "PARTICIPANT" | "TEAM";
  },
) {
  const query = buildQuery(params);
  return apiRequest<ApiActivityPeopleGroup[]>(
    `/projects/${projectId}/actions/${actionId}/people-groups${query}`,
    {},
    token,
  );
}
