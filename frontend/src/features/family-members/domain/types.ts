import type { RangeValue } from "@/features/shared/domain/types";

export type FamilyMember = {
  id: string;
  name: string;
  relationship: string;
  livesTogether: boolean;
  contributesIncome: boolean;
  income?: number;
  notes?: string;
};

export type FamilySummary = {
  householdMembers: number;
  dependents: number;
  dependentAgeRange: RangeValue;
};

export type FamilyMemberFormData = Omit<FamilyMember, "id">;
