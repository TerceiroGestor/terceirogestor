import type { PantryPagination } from "./shared";

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

