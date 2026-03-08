import type { PantryPagination } from "./shared";

export type ApiPantryDonor = {
  id: string;
  name: string;
  type: "PERSON" | "COMPANY";
  contact: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PantryDonorsListResponse = {
  data: ApiPantryDonor[];
  pagination: PantryPagination;
};

export type PantryDonorInput = {
  name: string;
  type?: "PERSON" | "COMPANY";
  contact?: string | null;
  avatarUrl?: string | null;
};
