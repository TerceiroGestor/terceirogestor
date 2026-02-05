"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import { useBreadcrumb } from "@/components/layout/BreadcrumbContext";
import type { Person } from "./types";
import { people } from "./data";
import { usePeopleColumns } from "./columns";
import { PeopleFormDialog } from "./_components/people-form-dialog";

export default function PeoplePage() {
  const router = useRouter();
  const { setPageBreadcrumb } = useBreadcrumb();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);

  useEffect(() => {
    setPageBreadcrumb(
      "Pessoas",
      [{ label: "Pessoas" }],
      {
        label: "Novo cadastro",
        onClick: () => {
          setEditing(null);
          setFormOpen(true);
        },
      },
    );
  }, [setPageBreadcrumb, setFormOpen, setEditing]);

  const openEdit = useCallback(
    (person: Person) => {
      setEditing(person);
      setFormOpen(true);
    },
    [router],
  );

  const openView = useCallback(
    (person: Person) => {
      router.push(`/people/${person.id}`);
    },
    [router],
  );

  const columns = usePeopleColumns();

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <DataTable
        columns={columns}
        data={people}
        searchPlaceholder="Pesquisar pessoas"
        summaryCards={{
          totalLabel: "Total",
          filteredLabel: "Filtrados",
          groupedLabel: "Grupos",
        }}
        showExportMenu
        rowActions={[
          {
            id: "view",
            label: "Visualizar",
            onSelect: openView,
          },
          {
            id: "edit",
            label: "Editar",
            onSelect: openEdit,
          },
        ]}
      />

      <PeopleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Editar cadastro" : "Novo cadastro de pessoa"}
        description={
          editing
            ? "Atualize os dados da pessoa selecionada."
            : "Preencha o formulario completo de perfil socioeconomico."
        }
        initialValues={editing ?? undefined}
        submitLabel={editing ? "Salvar" : "Cadastrar"}
        onSubmit={(values) => console.log(values)}
      />
    </div>
  );
}
