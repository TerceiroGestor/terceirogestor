import { apiRequest, buildQuery } from "@/lib/api";
import type {
  ApiReferral,
  ReferralAttachmentInput,
  ReferralInput,
  ReferralsDashboard,
  ReferralsListResponse,
  ReferralStatus,
  ReferralType,
} from "./types";

export async function listReferrals(
  token: string,
  params?: {
    q?: string;
    status?: ReferralStatus;
    type?: ReferralType;
    attendanceId?: string;
    page?: number;
    limit?: number;
    all?: boolean;
  },
) {
  const query = buildQuery(params);
  return apiRequest<ReferralsListResponse>(`/referrals${query}`, {}, token);
}

export async function getReferralsDashboard(token: string) {
  return apiRequest<ReferralsDashboard>("/referrals/dashboard", {}, token);
}

export async function getReferral(token: string, id: string) {
  return apiRequest<ApiReferral>(`/referrals/${id}`, {}, token);
}

export async function createReferral(token: string, payload: ReferralInput) {
  return apiRequest<ApiReferral>(
    "/referrals",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updateReferral(
  token: string,
  id: string,
  payload: Partial<ReferralInput>,
) {
  return apiRequest<ApiReferral>(
    `/referrals/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteReferral(token: string, id: string) {
  return apiRequest<{ success: true }>(`/referrals/${id}`, { method: "DELETE" }, token);
}

export async function addReferralAttachment(
  token: string,
  id: string,
  payload: ReferralAttachmentInput,
) {
  return apiRequest<ApiReferral>(
    `/referrals/${id}/attachments`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteReferralAttachment(
  token: string,
  id: string,
  attachmentId: string,
) {
  return apiRequest<ApiReferral>(
    `/referrals/${id}/attachments/${attachmentId}`,
    { method: "DELETE" },
    token,
  );
}
