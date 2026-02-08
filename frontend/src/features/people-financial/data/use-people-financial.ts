"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  createPersonExpense,
  createPersonIncome,
  deletePersonExpense,
  deletePersonIncome,
  getPersonExpenses,
  getPersonIncomes,
  updatePersonExpense,
  updatePersonIncome,
} from "@/features/people/api";
import type { PersonExpense, PersonIncome } from "@/app/(modules)/people/types";

type UsePeopleFinancialResult = {
  incomes: PersonIncome[];
  expenses: PersonExpense[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createIncome: (payload: Omit<PersonIncome, "id" | "personId">) => Promise<void>;
  updateIncome: (
    incomeId: string,
    payload: Partial<Omit<PersonIncome, "id" | "personId">>,
  ) => Promise<void>;
  deleteIncome: (incomeId: string) => Promise<void>;
  createExpense: (payload: Omit<PersonExpense, "id" | "personId">) => Promise<void>;
  updateExpense: (
    expenseId: string,
    payload: Partial<Omit<PersonExpense, "id" | "personId">>,
  ) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
};

export function usePeopleFinancial(personId: string): UsePeopleFinancialResult {
  const { token } = useAuth();
  const [incomes, setIncomes] = React.useState<PersonIncome[]>([]);
  const [expenses, setExpenses] = React.useState<PersonExpense[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [incomeData, expenseData] = await Promise.all([
        getPersonIncomes(token, personId),
        getPersonExpenses(token, personId),
      ]);
      setIncomes(incomeData);
      setExpenses(expenseData);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar rendas e gastos.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token, personId]);

  React.useEffect(() => {
    if (!token) return;
    refresh();
  }, [token, refresh]);

  const createIncome = React.useCallback(
    async (payload: Omit<PersonIncome, "id" | "personId">) => {
      if (!token) return;
      await createPersonIncome(token, personId, payload);
      await refresh();
    },
    [token, personId, refresh],
  );

  const updateIncome = React.useCallback(
    async (
      incomeId: string,
      payload: Partial<Omit<PersonIncome, "id" | "personId">>,
    ) => {
      if (!token) return;
      await updatePersonIncome(token, personId, incomeId, payload);
      await refresh();
    },
    [token, personId, refresh],
  );

  const deleteIncome = React.useCallback(
    async (incomeId: string) => {
      if (!token) return;
      await deletePersonIncome(token, personId, incomeId);
      await refresh();
    },
    [token, personId, refresh],
  );

  const createExpense = React.useCallback(
    async (payload: Omit<PersonExpense, "id" | "personId">) => {
      if (!token) return;
      await createPersonExpense(token, personId, payload);
      await refresh();
    },
    [token, personId, refresh],
  );

  const updateExpense = React.useCallback(
    async (
      expenseId: string,
      payload: Partial<Omit<PersonExpense, "id" | "personId">>,
    ) => {
      if (!token) return;
      await updatePersonExpense(token, personId, expenseId, payload);
      await refresh();
    },
    [token, personId, refresh],
  );

  const deleteExpense = React.useCallback(
    async (expenseId: string) => {
      if (!token) return;
      await deletePersonExpense(token, personId, expenseId);
      await refresh();
    },
    [token, personId, refresh],
  );

  return {
    incomes,
    expenses,
    isLoading,
    error,
    refresh,
    createIncome,
    updateIncome,
    deleteIncome,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
