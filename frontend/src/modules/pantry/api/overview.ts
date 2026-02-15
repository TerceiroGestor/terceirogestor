import { apiRequest, buildQuery } from "@/lib/api";
import type {
  ApiPantrySummary,
  PantryConsumptionResponse,
  PantryDashboardResponse,
  PantryFlowResponse,
  PantryUsageResponse,
} from "./types";

export async function getPantrySummary(token: string) {
  return apiRequest<ApiPantrySummary>("/pantry/summary", {}, token);
}

export async function getPantryDashboard(token: string) {
  return apiRequest<PantryDashboardResponse>("/pantry/dashboard", {}, token);
}

export async function getPantryConsumption(
  token: string,
  params?: {
    from?: string;
    to?: string;
    view?: "item" | "group";
    itemId?: string;
    group?: string;
    type?: "ATTENDED" | "DONATION" | "EVENT" | "PARTY" | "CORRECTION";
    eventName?: string;
  },
) {
  const query = buildQuery(params);
  return apiRequest<PantryConsumptionResponse>(`/pantry/consumption${query}`, {}, token);
}

export async function getPantryFlow(
  token: string,
  params?: {
    from?: string;
    to?: string;
    view?: "item" | "group";
    itemId?: string;
    group?: string;
    type?: "ATTENDED" | "DONATION" | "EVENT" | "PARTY" | "CORRECTION";
    eventName?: string;
  },
) {
  const query = buildQuery(params);
  return apiRequest<PantryFlowResponse>(`/pantry/flow${query}`, {}, token);
}

export async function getPantryUsage(
  token: string,
  params?: {
    from?: string;
    to?: string;
    view?: "item" | "group";
    itemId?: string;
    group?: string;
    type?: "ATTENDED" | "DONATION" | "EVENT" | "PARTY" | "CORRECTION";
    eventName?: string;
  },
) {
  const query = buildQuery(params);
  return apiRequest<PantryUsageResponse>(`/pantry/usage${query}`, {}, token);
}

