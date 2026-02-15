import type { ApiHouseholdProfile } from "./household";

export type ApiPersonIncome = {
  id: string;
  personId: string;
  householdId?: string | null;
  type: string;
  amount: number;
  frequency: string;
  contractType?: string | null;
  isHouseholdContribution: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiPersonExpense = {
  id: string;
  personId: string;
  householdId?: string | null;
  type: string;
  amount: number;
  frequency: string;
  isHouseholdExpense: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiHouseholdTransfer = {
  id: string;
  personId: string;
  fromHouseholdId: string;
  toHouseholdId: string;
  type: string;
  amount: number;
  frequency: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiFamilyIncomeSummary = {
  totalIncome: number;
  perCapitaIncome: number;
  totalExpenses: number;
  perCapitaExpenses: number;
  benefitsTotal: number;
  pensionTotal: number;
  householdSize: number;
  contributors: string[];
  contributions?: {
    personId: string;
    amount: number;
  }[];
};

export type ApiFamilySummary = {
  relations: {
    livingCount: number;
    externalCount: number;
    guardiansCount: number;
    providersCount: number;
    dependentsCount: number;
    totalRelations: number;
  };
  assets: {
    sharedCount: number;
    individualCount: number;
  };
  incomeSummary: ApiFamilyIncomeSummary;
  householdProfile: ApiHouseholdProfile | null;
};

