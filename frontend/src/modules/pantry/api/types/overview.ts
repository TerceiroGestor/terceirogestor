import type { ApiPantryEntry } from "./entries";
import type { ApiPantryExit } from "./exits";
import type { PantryValidityStatus } from "./shared";

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
    validityStatus: PantryValidityStatus;
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
    validityStatus: PantryValidityStatus;
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

export type ReversePantryEntryResponse = ApiPantryExit;

export type ReversePantryExitResponse = {
  ok: true;
  exitId: string;
  createdEntries: ApiPantryEntry[];
};

