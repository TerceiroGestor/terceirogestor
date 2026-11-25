"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import type { ApiCasePerson } from "@/modules/cases/api";
import type { Domain } from "@/web-client/domain/types";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { ListView } from "@/web-client/views/ListView";

function peopleColumns({
  canEdit,
  onRemovePerson,
}: {
  canEdit: boolean;
  onRemovePerson: (link: ApiCasePerson) => void;
}): ColumnDef<ApiCasePerson>[] {
  return [
    {
      id: "person",
      header: "Pessoa",
      accessorKey: "person.fullName",
      cell: ({ row }) => <div className="font-medium text-foreground">{row.original.person.fullName}</div>,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        canEdit ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-none border-b border-border/60 px-1"
              onClick={(event) => {
                event.stopPropagation();
                onRemovePerson(row.original);
              }}
            >
              Remover
            </Button>
          </div>
        ) : null,
    },
  ];
}

export function CasePeopleSection({
  rows,
  canEdit,
  canAdd,
  onOpenPerson,
  onAddPerson,
  onRemovePerson,
}: {
  rows: ApiCasePerson[];
  canEdit: boolean;
  canAdd: boolean;
  onOpenPerson: (personId: string) => void;
  onAddPerson: () => void;
  onRemovePerson: (link: ApiCasePerson) => void;
}) {
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);
  const columns = React.useMemo(() => peopleColumns({ canEdit, onRemovePerson }), [canEdit, onRemovePerson]);

  const filteredRows = React.useMemo(() => {
    const normalized = searchText.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return rows;
    return rows.filter((row) => row.person.fullName.toLocaleLowerCase("pt-BR").includes(normalized));
  }, [rows, searchText]);

  return (
    <RelationListHost<ApiCasePerson>
      flushToolbar
      data={filteredRows}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      domain={domain}
      onDomainChange={setDomain}
      searchPlaceholder="Pesquisar pessoa"
      filteredCount={filteredRows.length}
      columns={columns}
      onAdd={canAdd ? onAddPerson : undefined}
    >
      {filteredRows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Nenhuma pessoa vinculada.</p>
      ) : (
        <ListView<ApiCasePerson>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          onRowClick={(row) => onOpenPerson(row.person.id)}
          showColumnVisibilityButton={false}
          bordered={false}
          stickyHeaderOffsetPx={117}
        />
      )}
    </RelationListHost>
  );
}
