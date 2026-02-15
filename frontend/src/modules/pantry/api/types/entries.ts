import type { PantryPagination } from "./shared";

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
  donor:
    | { id: string; name: string; type: "PERSON" | "COMPANY"; contact: string | null }
    | null;
};

export type PantryEntriesListResponse = {
  data: ApiPantryEntry[];
  pagination: PantryPagination;
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

