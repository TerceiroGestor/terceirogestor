"use client";

import { apiRequest, buildQuery } from "@/lib/api";

export type ApiPantryItem = {
  id: string;
  tenantId: string;
  name: string;
  group: string | null;
  unit: string;
  minStock: number;
  stock: number;
  entriesTotal: number;
  exitsTotal: number;
  lastEntryDate: string | null;
  lastExitDate: string | null;
  lastMovementDate: string | null;
  nextExpiryDate: string | null;
  validityStatus:
    | "Normal"
    | "Atencao"
    | "Alerta"
    | "Urgente"
    | "Vencido"
    | "Sem validade";
  daysToExpire: number | null;
  isBelowMin: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PantryPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type PantryItemsListResponse = {
  data: ApiPantryItem[];
  pagination: PantryPagination;
};

export type ApiPantryDonor = {
  id: string;
  name: string;
  type: "PERSON" | "COMPANY";
  contact: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PantryDonorsListResponse = {
  data: ApiPantryDonor[];
  pagination: PantryPagination;
};

export type ApiPantryEntry = {
  id: string;
  itemId: string;
  donorId: string | null;
  sector: string;
  createdBy?: string;
  quantity: number;
  unit: string;
  entryDate: string;
  expiryDate: string | null;
  notes: string | null;
  allocatedTotal?: number;
  remaining?: number;
  isClosed?: boolean;
  createdAt: string;
  updatedAt: string;
  item: { id: string; name: string; unit: string };
  donor: { id: string; name: string; type: "PERSON" | "COMPANY"; contact: string | null } | null;
};

export type PantryEntriesListResponse = {
  data: ApiPantryEntry[];
  pagination: PantryPagination;
};

export type ApiPantryExit = {
  id: string;
  itemId: string;
  entryIds?: string[];
  allocations?: Array<{
    entryId: string;
    quantity: number;
    expiryDate: string | null;
    sector: string;
  }>;
  sector: string;
  removedBy?: string;
  quantity: number;
  unit: string;
  exitDate: string;
  type: "ATTENDED" | "DONATION" | "EVENT" | "PARTY" | "CORRECTION";
  eventName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  item: { id: string; name: string; unit: string };
};

export type PantryExitsListResponse = {
  data: ApiPantryExit[];
  pagination: PantryPagination;
};

export type ApiPantrySummary = {
  totals: {
    items: number;
    donors: number;
    entries: number;
    exits: number;
    stock: number;
    lowStock: number;
  };
  validity: {
    normal: number;
    attention: number;
    alert: number;
    urgent: number;
    expired: number;
    noExpiry: number;
  };
  monthly: { month: string; label: string; entries: number; exits: number }[];
  consumptionByType: { type: string; total: number }[];
  consumptionByItem: { itemId: string; name: string; unit: string; total: number }[];
  entriesByDonor: { donorId: string; name: string; total: number }[];
};

export type PantryItemInput = {
  name: string;
  group?: string | null;
  unit: string;
  minStock: number;
};

export type PantryDonorInput = {
  name: string;
  type?: "PERSON" | "COMPANY";
  contact?: string | null;
};

export type PantryEntryInput = {
  itemId: string;
  donorId?: string | null;
  sector: string;
  quantity: number;
  unit: string;
  entryDate?: string;
  expiryDate?: string | null;
  notes?: string | null;
};

export type PantryExitInput = {
  itemId: string;
  entryId?: string;
  sector: string;
  quantity: number;
  unit: string;
  exitDate?: string;
  type?: "ATTENDED" | "DONATION" | "EVENT" | "PARTY" | "CORRECTION";
  eventName?: string | null;
  notes?: string | null;
};

export type ApiPantrySectorBalance = {
  sector: string;
  stock: number;
  entriesTotal: number;
  exitsTotal: number;
  nextExpiryDate: string | null;
  nextExpiryEntryId?: string | null;
  validityStatus:
    | "Normal"
    | "Atencao"
    | "Alerta"
    | "Urgente"
    | "Vencido"
    | "Sem validade";
  daysToExpire: number | null;
};

export type PantryItemSectorsResponse = {
  itemId: string;
  sectors: ApiPantrySectorBalance[];
};

export type PantryDashboardResponse = {
  totals: { items: number; stock: number; lowStock: number };
  stockRows: Array<{
    itemId: string;
    name: string;
    group: string | null;
    unit: string;
    sector: string;
    sectorStock: number;
    itemStock: number;
    minStock: number;
    isBelowMin: boolean;
    nextExpiryDate: string | null;
    validityStatus:
      | "Normal"
      | "Atencao"
      | "Alerta"
      | "Urgente"
      | "Vencido"
      | "Sem validade";
    daysToExpire: number | null;
  }>;
  recentEntries: Array<{
    id: string;
    itemId: string;
    item: { id: string; name: string; unit: string; group: string | null };
    donor: { id: string; name: string } | null;
    sector: string;
    quantity: number;
    unit: string;
    entryDate: string;
    expiryDate: string | null;
    notes: string | null;
    createdBy: string;
  }>;
  recentExits: Array<{
    id: string;
    itemId: string;
    item: { id: string; name: string; unit: string; group: string | null };
    sector: string;
    quantity: number;
    unit: string;
    exitDate: string;
    type: string;
    eventName: string | null;
    notes: string | null;
    removedBy: string;
  }>;
  expiring: Array<{
    itemId: string;
    name: string;
    unit: string;
    group: string | null;
    sector: string;
    stock: number;
    nextExpiryDate: string | null;
    validityStatus:
      | "Normal"
      | "Atencao"
      | "Alerta"
      | "Urgente"
      | "Vencido"
      | "Sem validade";
    daysToExpire: number | null;
  }>;
};

export type PantryConsumptionResponse = {
  view: "item" | "group";
  from: string;
  to: string;
  months: { key: string; label: string }[];
  series: { key: string; label: string; totals: number[] }[];
};

export type PantryFlowResponse = {
  view: "item" | "group";
  from: string;
  to: string;
  months: { key: string; label: string }[];
  entries: number[];
  exits: number[];
};

export type PantryUsageResponse = {
  view: "item" | "group";
  from: string;
  to: string;
  totals: { type: string; label: string; total: number }[];
};

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
  return apiRequest<PantryConsumptionResponse>(
    `/pantry/consumption${query}`,
    {},
    token,
  );
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

export async function reversePantryEntry(
  token: string,
  entryId: string,
  payload?: { date?: string; notes?: string },
) {
  return apiRequest<ApiPantryExit>(
    `/pantry/entries/${entryId}/reverse`,
    { method: "POST", body: JSON.stringify(payload ?? {}) },
    token,
  );
}

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

export async function getPantryItemSectors(token: string, itemId: string) {
  return apiRequest<PantryItemSectorsResponse>(
    `/pantry/items/${itemId}/sectors`,
    {},
    token,
  );
}

export async function listPantryItems(
  token: string,
  params?: { q?: string; page?: number; limit?: number; all?: boolean },
) {
  const query = buildQuery(params);
  return apiRequest<PantryItemsListResponse>(`/pantry/items${query}`, {}, token);
}

export async function createPantryItem(token: string, payload: PantryItemInput) {
  return apiRequest<ApiPantryItem>(
    "/pantry/items",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updatePantryItem(
  token: string,
  id: string,
  payload: Partial<PantryItemInput>,
) {
  return apiRequest<ApiPantryItem>(
    `/pantry/items/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deletePantryItem(token: string, id: string) {
  return apiRequest<{ ok: true }>(
    `/pantry/items/${id}`,
    { method: "DELETE" },
    token,
  );
}

export async function listPantryDonors(
  token: string,
  params?: { q?: string; search?: string; page?: number; limit?: number; all?: boolean },
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

export async function updatePantryDonor(
  token: string,
  id: string,
  payload: Partial<PantryDonorInput>,
) {
  return apiRequest<ApiPantryDonor>(
    `/pantry/donors/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deletePantryDonor(token: string, id: string) {
  return apiRequest<{ ok: true }>(
    `/pantry/donors/${id}`,
    { method: "DELETE" },
    token,
  );
}

export async function listPantryEntries(
  token: string,
  params?: {
    q?: string;
    search?: string;
    page?: number;
    limit?: number;
    itemId?: string;
    donorId?: string;
    from?: string;
    to?: string;
  },
) {
  const query = buildQuery(params);
  return apiRequest<PantryEntriesListResponse>(`/pantry/entries${query}`, {}, token);
}

export async function getPantryEntry(token: string, id: string) {
  return apiRequest<ApiPantryEntry>(`/pantry/entries/${id}`, {}, token);
}

export async function createPantryEntry(token: string, payload: PantryEntryInput) {
  return apiRequest<ApiPantryEntry>(
    "/pantry/entries",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updatePantryEntry(
  token: string,
  id: string,
  payload: Partial<PantryEntryInput>,
) {
  return apiRequest<ApiPantryEntry>(
    `/pantry/entries/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deletePantryEntry(token: string, id: string) {
  return apiRequest<{ ok: true }>(
    `/pantry/entries/${id}`,
    { method: "DELETE" },
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
