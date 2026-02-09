"use client";

import { usePathname, useRouter } from "next/navigation";
import { PeopleRelationsForm } from "./people-relations-form";
import type { PersonFormData } from "../types";
import { createPerson } from "@/features/people/api";
import { useAuth } from "@/features/auth/auth-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { uploadAvatar } from "@/features/uploads/api";
import { stripApiUrl } from "@/lib/api";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";

export function PeopleCreateClient() {
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { token } = useAuth();
  useRequireAuth();

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
            : "/avatar.jpg";
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
          avatarUrl,
        });
        router.push(withTenantPath("/people", tenantSlug));
      }}
      onCancel={() => router.push(withTenantPath("/people", tenantSlug))}
      submitLabel="Cadastrar"
      tagSuggestions={[]}
    />
  );
}
