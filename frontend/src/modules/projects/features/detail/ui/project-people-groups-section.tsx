"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { ListView } from "@/web-client/views/ListView";
import type { Domain } from "@/web-client/domain/types";

export type ProjectPeopleGroupRow = {
  id: string;
  peopleGroupId: string;
  participationKind: "PARTICIPANT" | "TEAM";
  peopleGroup: {
    id: string;
    name: string;
    category?: string | null;
    description?: string | null;
    ageMin?: number | null;
    ageMax?: number | null;
  };
};

function formatAgeRange(ageMin?: number | null, ageMax?: number | null) {
  if (ageMin == null && ageMax == null) return "Livre";
  return `${ageMin ?? "-"} a ${ageMax ?? "-"}`;
}

function filterPeopleGroupRows(rows: ProjectPeopleGroupRow[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return rows;
  return rows.filter((row) => {
    const values = [
      row.peopleGroup.name,
      row.peopleGroup.category ?? "",
      row.peopleGroup.description ?? "",
      formatAgeRange(row.peopleGroup.ageMin, row.peopleGroup.ageMax),
    ]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return values.includes(normalized);
  });
}

function peopleGroupColumns({
  canManageEnrollments,
  onSyncPeopleGroup,
}: {
  canManageEnrollments: boolean;
  onSyncPeopleGroup: (row: ProjectPeopleGroupRow) => void;
}): ColumnDef<ProjectPeopleGroupRow, unknown>[] {
  return [
    {
      accessorKey: "peopleGroup.name",
      header: "Grupos",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{row.original.peopleGroup.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.peopleGroup.description?.trim() ||
              row.original.peopleGroup.category?.trim() ||
              "Grupos institucional"}
          </div>
        </div>
      ),
    },
    {
      id: "category",
      header: "Categoria",
      cell: ({ row }) => row.original.peopleGroup.category?.trim() || "-",
    },
    {
      id: "ageRange",
      header: "Faixa etaria",
      cell: ({ row }) =>
        formatAgeRange(row.original.peopleGroup.ageMin, row.original.peopleGroup.ageMax),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        canManageEnrollments ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-none border-b border-border/60 px-1"
              onClick={(event) => {
                event.stopPropagation();
                onSyncPeopleGroup(row.original);
              }}
            >
              Matricular/revisar membros
            </Button>
          </div>
        ) : null,
    },
  ];
}

export function ProjectPeopleGroupsSection({
  rows,
  loading,
  canAdd,
  canManageEnrollments,
  onOpenPeopleGroup,
  onAddPeopleGroup,
  onSyncPeopleGroup,
}: {
  rows: ProjectPeopleGroupRow[];
  loading: boolean;
  canAdd: boolean;
  canManageEnrollments: boolean;
  onOpenPeopleGroup: (peopleGroupId: string) => void;
  onAddPeopleGroup: () => void;
  onSyncPeopleGroup: (row: ProjectPeopleGroupRow) => void;
}) {
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);

  const columns = React.useMemo(
    () => peopleGroupColumns({ canManageEnrollments, onSyncPeopleGroup }),
    [canManageEnrollments, onSyncPeopleGroup],
  );

  const filteredRows = React.useMemo(
    () => filterPeopleGroupRows(rows, searchText),
    [rows, searchText],
  );

  return (
    <RelationListHost<ProjectPeopleGroupRow>
      flushToolbar
      data={filteredRows}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      domain={domain}
      onDomainChange={setDomain}
      searchPlaceholder="Pesquisar Grupos"
      filteredCount={filteredRows.length}
      columns={columns}
      onAdd={canAdd ? onAddPeopleGroup : undefined}
    >
      {loading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Carregando Grupos...</p>
      ) : filteredRows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum vínculo.</p>
      ) : (
        <ListView<ProjectPeopleGroupRow>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          onRowClick={(row) => onOpenPeopleGroup(row.peopleGroupId)}
          showColumnVisibilityButton={false}
          bordered={false}
          stickyHeaderOffsetPx={117}
        />
      )}
    </RelationListHost>
  );
}
