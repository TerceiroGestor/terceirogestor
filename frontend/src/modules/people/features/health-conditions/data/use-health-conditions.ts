"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  createPersonHealthCondition,
  deletePersonHealthCondition,
  getPersonHealthConditions,
  updatePersonHealthCondition,
} from "@/modules/people/api";
import type { HealthCondition } from "@/modules/people/shared/domain/types";

type UseHealthConditionsResult = {
  conditions: HealthCondition[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (payload: Omit<HealthCondition, "id" | "personId">) => Promise<void>;
  update: (
    conditionId: string,
    payload: Partial<Omit<HealthCondition, "id" | "personId">>,
  ) => Promise<void>;
  remove: (conditionId: string) => Promise<void>;
};

export function useHealthConditions(
  personId: string,
  options?: { enabled?: boolean },
): UseHealthConditionsResult {
  const { token } = useAuth();
  const enabled = options?.enabled ?? true;
  const [conditions, setConditions] = React.useState<HealthCondition[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPersonHealthConditions(token, personId);
      setConditions(data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar condicoes de saude.";
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
    async (payload: Omit<HealthCondition, "id" | "personId">) => {
      if (!token) return;
      await createPersonHealthCondition(token, personId, payload);
      await refresh();
    },
    [token, personId, refresh],
  );

  const update = React.useCallback(
    async (
      conditionId: string,
      payload: Partial<Omit<HealthCondition, "id" | "personId">>,
    ) => {
      if (!token) return;
      await updatePersonHealthCondition(token, personId, conditionId, payload);
      await refresh();
    },
    [token, personId, refresh],
  );

  const remove = React.useCallback(
    async (conditionId: string) => {
      if (!token) return;
      await deletePersonHealthCondition(token, personId, conditionId);
      await refresh();
    },
    [token, personId, refresh],
  );

  return { conditions, isLoading, error, refresh, create, update, remove };
}


