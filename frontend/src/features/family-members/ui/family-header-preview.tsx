"use client";

import { resolvePersonDisplayNames } from "@/app/[tenant]/(modules)/people/utils";
import {
  FamilyPreview,
  type FamilyPreviewMember,
} from "@/features/family-members/ui/family-preview";
import { useFamilyRelationsContext } from "@/features/family-members/context/family-relations-context";

export function FamilyHeaderPreview() {
  const { data, isLoading } = useFamilyRelationsContext();

  if (isLoading) {
    return (
      <p className="text-xs text-muted-foreground">Carregando familiares...</p>
    );
  }

  const householdMembers = data?.householdMembers ?? [];
  const relationByPerson = new Map(
    (data?.relations ?? []).map((relation) => [
      relation.relatedPersonId,
      relation.type,
    ]),
  );
  const members: FamilyPreviewMember[] = householdMembers.map((member) => ({
    id: member.person.id,
    name: resolvePersonDisplayNames(
      member.person.fullName,
      member.person.socialName,
    ).primary,
    fullName: member.person.fullName,
    socialName: member.person.socialName ?? null,
    birthDate: member.person.birthDate ?? null,
    role: relationByPerson.get(member.personId) ?? member.role ?? "Mora junto",
    avatarUrl: member.person.avatarUrl ?? null,
    hasHealthCondition: member.person.hasHealthCondition ?? null,
    hasMedication: member.person.hasMedication ?? null,
  }));

  return <FamilyPreview members={members} />;
}
