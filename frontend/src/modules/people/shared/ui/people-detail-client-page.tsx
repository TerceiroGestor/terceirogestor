"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Person, PersonFormData } from "../domain/types";
import { resolveMediaUrl } from "@/lib/api";
import { resolvePersonDisplayNames, toDateInputValue } from "../domain/utils";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { PeopleDetail } from "./people-detail";
import { PeopleFormDialog } from "./people-form-dialog";
import { Button } from "@/components/ui/button";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { PEOPLE_FORM_TEXT } from "../domain/people.constants";

type PeopleDetailClientPageProps = {
  person: Person;
  onUpdate?: (values: PersonFormData) => Promise<void>;
  onUpdateTags?: (tags: string[]) => Promise<void> | void;
};

export function PeopleDetailClientPage({
  person,
  onUpdate,
  onUpdateTags,
}: PeopleDetailClientPageProps) {
  const [formOpen, setFormOpen] = React.useState(false);
  const [tabValue, setTabValue] = React.useState("resumo");
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const tagSuggestions = React.useMemo(
    () => (person.tags ? Array.from(new Set(person.tags)) : []),
    [person.tags],
  );

  const initialValues = React.useMemo<Partial<PersonFormData>>(
    () => ({
      fullName: person.fullName,
      socialName: person.socialName ?? null,
      birthDate: toDateInputValue(person.birthDate),
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
      avatarUrl: resolveMediaUrl(person.avatarUrl ?? "/avatar.jpg"),
    }),
    [person],
  );
  const displayNames = resolvePersonDisplayNames(
    person.fullName,
    person.socialName,
  );
  const treeHref = withTenantPath(`/people/${person.id}/tree`, tenantSlug);

  return (
    <>
      <PageBreadcrumb
        title="Detalhes da pessoa"
        items={[
          { label: "Pessoas", href: "/people" },
          { label: displayNames.primary },
        ]}
        action={
          onUpdate
            ? {
                label: "Editar cadastro",
                onClick: () => setFormOpen(true),
                variant: "default",
                size: "sm",
              }
            : undefined
        }
        actionSlot={
          <Button variant="outline" size="sm" asChild>
            <Link href={treeHref}>Arvore genealogica</Link>
          </Button>
        }
      />
      <PeopleDetail
        person={person}
        tabValue={tabValue}
        onTabChange={setTabValue}
        tagSuggestions={tagSuggestions}
        onUpdateTags={onUpdateTags}
      />
      {onUpdate ? (
        <PeopleFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          title="Editar cadastro"
          description={PEOPLE_FORM_TEXT.dialogs.editDescription}
          initialValues={initialValues}
          submitLabel="Salvar"
          onSubmit={onUpdate}
          tagSuggestions={tagSuggestions}
        />
      ) : null}
    </>
  );
}
