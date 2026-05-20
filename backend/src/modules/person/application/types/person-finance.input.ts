export type CreatePersonFinancialEntryInput = {
  entryType: string;
  category: string;
  subcategory?: string;
  status?: string;
  amount?: number;
  frequency?: string;
  contractType?: string;
  householdId?: string;
  fromHouseholdId?: string;
  toHouseholdId?: string;
  includeInHouseholdBudget?: boolean;
  startDate?: string;
  endDate?: string;
  notes?: string;
};

export type UpdatePersonFinancialEntryInput = Partial<CreatePersonFinancialEntryInput>;

export type CreatePersonIncomeInput = {
  type: string;
  amount: number;
  frequency?: string;
  contractType?: string;
  householdId?: string;
  isHouseholdContribution?: boolean;
  notes?: string;
};

export type UpdatePersonIncomeInput = Partial<CreatePersonIncomeInput>;

export type CreatePersonExpenseInput = {
  type: string;
  amount: number;
  frequency?: string;
  householdId?: string;
  isHouseholdExpense?: boolean;
  notes?: string;
};

export type UpdatePersonExpenseInput = Partial<CreatePersonExpenseInput>;