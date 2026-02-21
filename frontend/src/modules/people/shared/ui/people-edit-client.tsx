"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Person } from "../domain/types";
import { PeopleRelationsForm } from "./people-relations-form";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";

export function PeopleEditClient({ person }: { person: Person }) {
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { permissions } = useCurrentUser();
  const { isLoading: authLoading } = useRequireAuth();

  const canUpdate = permissions.includes("people.update");

  if (authLoading) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!canUpdate) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Voc\u00ea n\u00e3o tem permiss\u00e3o para editar pessoas.
      </div>
    );
  }

  return (
    <PeopleRelationsForm
      initialValues={{
        fullName: person.fullName,
        socialName: person.socialName ?? null,
        birthDate: person.birthDate ?? null,
        sex: person.sex ?? null,
        personType: person.personType ?? null,
        gender: person.gender ?? null,
        raceColor: person.raceColor ?? null,
        maritalStatus: person.maritalStatus ?? null,
        nationality: person.nationality ?? null,
        tags: person.tags ?? [],
        profileSummary: person.profileSummary ?? null,
        status: person.status ?? null,
        departureReason: person.departureReason ?? null,
        avatarUrl: person.avatarUrl ?? null,
      }}
      onSubmit={(values) => console.log(values)}
      onCancel={() =>
        router.push(withTenantPath(`/person/${person.id}`, tenantSlug))
      }
    />
  );
}
