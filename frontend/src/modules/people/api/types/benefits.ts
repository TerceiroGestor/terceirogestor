export type ApiPersonBenefit = {
  id: string;
  personId: string;
  householdId?: string | null;
  type: string;
  status?: string | null;
  amount?: number | null;
  frequency: string;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

