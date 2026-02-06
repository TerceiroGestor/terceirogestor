"use client";

import * as React from "react";
import type { Person, PersonFormData } from "../types";
import { resolveMediaUrl } from "@/lib/api";
import { toDateInputValue } from "../utils";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { PeopleDetail } from "./people-detail";
import { PeopleFormDialog } from "./people-form-dialog";
import { PeopleDetailTabs } from "./people-detail-tabs";

type PeopleDetailClientPageProps = {
  person: Person;
  onUpdate: (values: PersonFormData) => Promise<void>;
};

export function PeopleDetailClientPage({
  person,
  onUpdate,
}: PeopleDetailClientPageProps) {
  const [formOpen, setFormOpen] = React.useState(false);
  const [tabValue, setTabValue] = React.useState("geral");
  const tagSuggestions = React.useMemo(
    () => (person.tags ? Array.from(new Set(person.tags)) : []),
    [person.tags],
  );

  const initialValues = React.useMemo<Partial<PersonFormData>>(
    () => ({
      ...person,
      birthDate: toDateInputValue(person.birthDate),
      avatarUrl: resolveMediaUrl(person.avatarUrl ?? "/avatar.jpg"),
    }),
    [person],
  );

  return (
    <>
      <PageBreadcrumb
        title="Detalhes da pessoa"
        items={[
          { label: "Pessoas", href: "/people" },
          { label: person.fullName },
        ]}
        action={{
          label: "Editar cadastro",
          onClick: () => setFormOpen(true),
          variant: "default",
          size: "sm",
        }}
        actionSlot={
          <PeopleDetailTabs
            value={tabValue}
            onValueChange={setTabValue}
          />
        }
      />
      <PeopleDetail
        person={person}
        tabValue={tabValue}
        onTabChange={setTabValue}
      />
      <PeopleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Editar cadastro"
        description="Atualize os dados da pessoa selecionada."
        initialValues={initialValues}
        submitLabel="Salvar"
        onSubmit={onUpdate}
        tagSuggestions={tagSuggestions}
      />
    </>
  );
}
