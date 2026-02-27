import type { PantryPagination, PantryValidityStatus } from "./shared";

export type ApiPantryItem = {
  id: string;
  tenantId: string;
  name: string;
  group: string | null;
  defaultSector: string;
  unit: string;
  minStock: number;
  notes: string | null;
  stock: number;
  entriesTotal: number;
  exitsTotal: number;
  lastEntryDate: string | null;
  lastExitDate: string | null;
  lastMovementDate: string | null;
  nextExpiryDate: string | null;
  validityStatus: PantryValidityStatus;
  daysToExpire: number | null;
  isBelowMin: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PantryItemsListResponse = {
  data: ApiPantryItem[];
  pagination: PantryPagination;
};

export type PantryItemInput = {
  name: string;
  group?: string | null;
  defaultSector?: string;
  unit: string;
  minStock: number;
  notes?: string | null;
};

export type ApiPantrySectorBalance = {
  sector: string;
  stock: number;
  entriesTotal: number;
  exitsTotal: number;
  nextExpiryDate: string | null;
  nextExpiryEntryId?: string | null;
  validityStatus: PantryValidityStatus;
  daysToExpire: number | null;
};

export type PantryItemSectorsResponse = {
  itemId: string;
  sectors: ApiPantrySectorBalance[];
};
