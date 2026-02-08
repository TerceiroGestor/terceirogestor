"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  createPersonMedication,
  deletePersonMedication,
  getPersonMedications,
  updatePersonMedication,
} from "@/features/people/api";
import type { Medication } from "@/app/(modules)/people/types";

type UseMedicationsResult = {
  medications: Medication[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (payload: Omit<Medication, "id" | "personId">) => Promise<void>;
  update: (
    medicationId: string,
    payload: Partial<Omit<Medication, "id" | "personId">>,
  ) => Promise<void>;
  remove: (medicationId: string) => Promise<void>;
};

export function useMedications(
  personId: string,
  options?: { enabled?: boolean },
): UseMedicationsResult {
  const { token } = useAuth();
  const enabled = options?.enabled ?? true;
  const [medications, setMedications] = React.useState<Medication[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPersonMedications(token, personId);
      setMedications(data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar medicacoes.";
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
    async (payload: Omit<Medication, "id" | "personId">) => {
      if (!token) return;
      await createPersonMedication(token, personId, payload);
      await refresh();
    },
    [token, personId, refresh],
  );

  const update = React.useCallback(
    async (
      medicationId: string,
      payload: Partial<Omit<Medication, "id" | "personId">>,
    ) => {
      if (!token) return;
      await updatePersonMedication(token, personId, medicationId, payload);
      await refresh();
    },
    [token, personId, refresh],
  );

  const remove = React.useCallback(
    async (medicationId: string) => {
      if (!token) return;
      await deletePersonMedication(token, personId, medicationId);
      await refresh();
    },
    [token, personId, refresh],
  );

  return { medications, isLoading, error, refresh, create, update, remove };
}
