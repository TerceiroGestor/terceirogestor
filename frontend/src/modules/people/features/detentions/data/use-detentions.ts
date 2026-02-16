"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  createPersonDetention,
  deletePersonDetention,
  getPersonDetentions,
  updatePersonDetention,
} from "@/modules/people/api";
import type { PersonDetention } from "@/modules/people/shared/domain/types";

type UseDetentionsResult = {
  detentions: PersonDetention[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (payload: Omit<PersonDetention, "id" | "personId">) => Promise<void>;
  update: (
    detentionId: string,
    payload: Partial<Omit<PersonDetention, "id" | "personId">>,
  ) => Promise<void>;
  remove: (detentionId: string) => Promise<void>;
};

export function useDetentions(
  personId: string,
  options?: { enabled?: boolean },
): UseDetentionsResult {
  const { token } = useAuth();
  const enabled = options?.enabled ?? true;
  const [detentions, setDetentions] = React.useState<PersonDetention[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPersonDetentions(token, personId);
      setDetentions(data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar reclusão.";
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
    async (payload: Omit<PersonDetention, "id" | "personId">) => {
      if (!token) return;
      await createPersonDetention(token, personId, payload);
      await refresh();
    },
    [token, personId, refresh],
  );

  const update = React.useCallback(
    async (
      detentionId: string,
      payload: Partial<Omit<PersonDetention, "id" | "personId">>,
    ) => {
      if (!token) return;
      await updatePersonDetention(token, personId, detentionId, payload);
      await refresh();
    },
    [token, personId, refresh],
  );

  const remove = React.useCallback(
    async (detentionId: string) => {
      if (!token) return;
      await deletePersonDetention(token, personId, detentionId);
      await refresh();
    },
    [token, personId, refresh],
  );

  return { detentions, isLoading, error, refresh, create, update, remove };
}

