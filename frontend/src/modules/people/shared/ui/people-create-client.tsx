"use client";

import { usePathname, useRouter } from "next/navigation";
import { PeopleRelationsForm } from "./people-relations-form";
import type { PersonFormData } from "../domain/types";
import { createPerson } from "@/modules/people/api";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { uploadAvatar } from "@/features/uploads/api";
import { stripApiUrl } from "@/lib/api";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";

export function PeopleCreateClient() {
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isLoading: authLoading } = useRequireAuth();

  const canCreate = permissions.includes("people.create");

  if (authLoading) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Voc\u00ea n\u00e3o tem permiss\u00e3o para criar pessoas.
      </div>
    );
  }

  return (
    <PeopleRelationsForm
      onSubmit={async (values: PersonFormData) => {
        if (!token) return;
        if (values.status === "Desligado" && !values.departureReason?.trim()) {
          throw new Error("Informe o motivo do desligamento.");
        }
        let avatarUrl =
          typeof values.avatarUrl === "string"
            ? stripApiUrl(values.avatarUrl)
            : null;
        if (values.avatarUrl instanceof File) {
          const upload = await uploadAvatar(token, values.avatarUrl);
          avatarUrl = upload.path;
        }
        await createPerson(token, {
          fullName: values.fullName,
          socialName: values.socialName || null,
          birthDate: values.birthDate || null,
          sex: values.sex || null,
          gender: values.gender || null,
          raceColor: values.raceColor || null,
          maritalStatus: values.maritalStatus || null,
          nationality: values.nationality || null,
          status: values.status || null,
          personType: values.personType || null,
          departureReason: values.departureReason || null,
          tags: values.tags ?? [],
          profileSummary: values.profileSummary || null,
          avatarUrl,
        });
        router.push(withTenantPath("/person", tenantSlug));
      }}
      onCancel={() => router.push(withTenantPath("/person", tenantSlug))}
      submitLabel="Cadastrar"
      tagSuggestions={[]}
    />
  );
}
