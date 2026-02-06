"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getPerson, updatePerson, type ApiPerson } from "@/features/people/api";
import { PeopleDetailClientPage } from "../_components/people-detail-client-page";
import type { Person, PersonFormData } from "../types";
import { uploadAvatar } from "@/features/uploads/api";
import { stripApiUrl } from "@/lib/api";

function mapApiPersonToPerson(person: ApiPerson): Person {
  return {
    id: person.id,
    fullName: person.fullName,
    socialName: person.socialName ?? null,
    email: person.email ?? null,
    phone: person.phone ?? null,
    document: person.document ?? null,
    rg: person.rg ?? null,
    nis: person.nis ?? null,
    birthDate: person.birthDate ?? null,
    sex: person.sex ?? null,
    gender: person.gender ?? null,
    raceColor: person.raceColor ?? null,
    maritalStatus: person.maritalStatus ?? null,
    nationality: person.nationality ?? null,
    status: person.status as Person["status"],
    departureReason: person.departureReason ?? null,
    notes: person.notes ?? null,
    tags: person.tags ?? [],
    hasHealthIssue: person.hasHealthIssue ?? false,
    profileSummary: person.profileSummary ?? null,
    avatarUrl: person.avatarUrl ?? null,
    createdAt: person.createdAt ?? null,
    updatedAt: person.updatedAt ?? null,
  };
}

export default function PeopleDetailPage() {
  const params = useParams();
  const { token } = useAuth();
  useRequireAuth();

  const [person, setPerson] = React.useState<Person | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
    if (!id || !token) return;
    setIsLoading(true);
    setError(null);
    getPerson(token, id)
      .then((apiPerson) => setPerson(mapApiPersonToPerson(apiPerson)))
      .catch((err) => {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao carregar pessoa.";
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, [params, token]);

  const handleUpdate = React.useCallback(
    async (values: PersonFormData) => {
      if (!token || !person) return;
      if (values.status === "Desligado" && !values.departureReason?.trim()) {
        throw new Error("Informe o motivo do desligamento.");
      }
      const avatarUrl =
        typeof values.avatarUrl === "string"
          ? stripApiUrl(values.avatarUrl)
          : person.avatarUrl ?? "/avatar.jpg";
      let resolvedAvatarUrl = avatarUrl;
      if (values.avatarUrl instanceof File) {
        resolvedAvatarUrl = (await uploadAvatar(token, values.avatarUrl)).path;
      }
      const payload = {
        fullName: values.fullName,
        socialName: values.socialName || null,
        birthDate: values.birthDate || null,
        sex: values.sex || null,
        gender: values.gender || null,
        raceColor: values.raceColor || null,
        maritalStatus: values.maritalStatus || null,
        nationality: values.nationality || null,
        email: values.email || null,
        phone: values.phone || null,
        document: values.document || null,
        rg: values.rg || null,
        nis: values.nis || null,
        status: values.status || null,
        departureReason: values.departureReason || null,
        tags: values.tags ?? [],
        hasHealthIssue: values.hasHealthIssue ?? false,
        profileSummary: values.profileSummary || null,
        avatarUrl: resolvedAvatarUrl,
      };
      const updated = await updatePerson(token, person.id, payload);
      setPerson(mapApiPersonToPerson(updated));
    },
    [token, person],
  );

  if (isLoading) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Carregando pessoa...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 text-sm text-destructive">{error}</div>
    );
  }

  if (!person) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Pessoa nao encontrada.
      </div>
    );
  }

  return (
    <PeopleDetailClientPage person={person} onUpdate={handleUpdate} />
  );
}
