"use client";

import * as React from "react";
import type { Person } from "../types";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { PeopleDetail } from "./people-detail";
import { PeopleFormDialog } from "./people-form-dialog";
import { PeopleDetailTabs } from "./people-detail-tabs";

type PeopleDetailClientPageProps = {
  person: Person;
};

export function PeopleDetailClientPage({ person }: PeopleDetailClientPageProps) {
  const [formOpen, setFormOpen] = React.useState(false);
  const [tabValue, setTabValue] = React.useState("geral");

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
        initialValues={person}
        submitLabel="Salvar"
        onSubmit={(values) => console.log(values)}
      />
    </>
  );
}
