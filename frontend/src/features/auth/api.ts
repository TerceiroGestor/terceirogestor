import { apiRequest, buildQuery } from "@/lib/api";

export type AccessLogAction = "LOGIN" | "REFRESH" | "LOGOUT";

export type AccessLog = {
  id: string;
  action: AccessLogAction;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

export type AccessLogListResponse = {
  data: AccessLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export async function getAccessLogs(
  token: string,
  params?: {
    page?: number;
    limit?: number;
    action?: AccessLogAction;
    search?: string;
  },
) {
  const query = buildQuery(params);
  return apiRequest<AccessLogListResponse>(`/auth/access-logs${query}`, {}, token);
}
