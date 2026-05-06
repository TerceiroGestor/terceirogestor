"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  createPersonContact,
  deletePersonContact,
  listPersonContacts,
  updatePersonContact,
  type ApiPersonContact,
  type PersonContactInput,
} from "@/modules/people/api";

type UseContactsResult = {
  contacts: ApiPersonContact[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (payload: PersonContactInput) => Promise<ApiPersonContact | null>;
  update: (id: string, payload: Partial<PersonContactInput>) => Promise<ApiPersonContact | null>;
  remove: (id: string) => Promise<void>;
};

export function useContacts(personId: string): UseContactsResult {
  const { token } = useAuth();
  const [contacts, setContacts] = React.useState<ApiPersonContact[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listPersonContacts(token, personId);
      setContacts(data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar contatos.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token, personId]);

  React.useEffect(() => {
    if (!token) return;
    void refresh();
  }, [token, refresh]);

  const create = React.useCallback(
    async (payload: PersonContactInput) => {
      if (!token) return null;
      const created = await createPersonContact(token, personId, payload);
      setContacts((prev) => [created, ...prev]);
      return created;
    },
    [token, personId],
  );

  const update = React.useCallback(
    async (id: string, payload: Partial<PersonContactInput>) => {
      if (!token) return null;
      const updated = await updatePersonContact(token, personId, id, payload);
      setContacts((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    },
    [token, personId],
  );

  const remove = React.useCallback(
    async (id: string) => {
      if (!token) return;
      await deletePersonContact(token, personId, id);
      setContacts((prev) => prev.filter((item) => item.id !== id));
    },
    [token, personId],
  );

  return { contacts, isLoading, error, refresh, create, update, remove };
}
