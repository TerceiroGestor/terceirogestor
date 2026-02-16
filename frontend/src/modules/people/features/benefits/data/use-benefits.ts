"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  createPersonBenefit,
  deletePersonBenefit,
  getPersonBenefits,
  updatePersonBenefit,
} from "@/modules/people/api";
import type { PersonBenefit } from "@/modules/people/shared/domain/types";

type UseBenefitsResult = {
  benefits: PersonBenefit[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (payload: Omit<PersonBenefit, "id" | "personId">) => Promise<void>;
  update: (
    benefitId: string,
    payload: Partial<Omit<PersonBenefit, "id" | "personId">>,
  ) => Promise<void>;
  remove: (benefitId: string) => Promise<void>;
};

export function useBenefits(
  personId: string,
  options?: { enabled?: boolean },
): UseBenefitsResult {
  const { token } = useAuth();
  const enabled = options?.enabled ?? true;
  const [benefits, setBenefits] = React.useState<PersonBenefit[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPersonBenefits(token, personId);
      setBenefits(data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar benefícios.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token, personId]);

  React.useEffect(() => {
    if (!token || !enabled) return;
    refresh();
  }, [token, enabled, refresh]);

  const create = React.useCallback(
    async (payload: Omit<PersonBenefit, "id" | "personId">) => {
      if (!token) return;
      await createPersonBenefit(token, personId, payload);
      await refresh();
    },
    [token, personId, refresh],
  );

  const update = React.useCallback(
    async (
      benefitId: string,
      payload: Partial<Omit<PersonBenefit, "id" | "personId">>,
    ) => {
      if (!token) return;
      await updatePersonBenefit(token, personId, benefitId, payload);
      await refresh();
    },
    [token, personId, refresh],
  );

  const remove = React.useCallback(
    async (benefitId: string) => {
      if (!token) return;
      await deletePersonBenefit(token, personId, benefitId);
      await refresh();
    },
    [token, personId, refresh],
  );

  return { benefits, isLoading, error, refresh, create, update, remove };
}

