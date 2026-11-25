import { apiRequest, buildQuery } from "@/lib/api";
import type { ApiReferralDestination, ReferralDestinationInput } from "./types";

export async function listReferralDestinations(
  token: string,
  params?: { q?: string; all?: boolean },
) {
  const query = buildQuery(params);
  return apiRequest<{ data: ApiReferralDestination[] }>(
    `/referral-destinations${query}`,
    {},
    token,
  );
}

export async function getReferralDestination(token: string, id: string) {
  return apiRequest<ApiReferralDestination>(`/referral-destinations/${id}`, {}, token);
}

export async function createReferralDestination(
  token: string,
  payload: ReferralDestinationInput,
) {
  return apiRequest<ApiReferralDestination>(
    "/referral-destinations",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updateReferralDestination(
  token: string,
  id: string,
  payload: Partial<ReferralDestinationInput>,
) {
  return apiRequest<ApiReferralDestination>(
    `/referral-destinations/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}
