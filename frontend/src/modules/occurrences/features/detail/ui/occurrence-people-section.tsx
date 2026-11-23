"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ApiOccurrencePerson } from "@/modules/occurrences/api";
import { OCCURRENCE_PERSON_ROLE_LABELS } from "@/modules/occurrences/shared/domain/occurrences.constants";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { ListView } from "@/web-client/views/ListView";
import { matchesDomainRecord } from "@/web-client/domain/evaluate";
import type { Domain } from "@/web-client/domain/types";
import type { SearchFieldDefinition } from "@/web-client/search/types";

const ROLE_FILTER_OPTIONS = Object.entries(OCCURRENCE_PERSON_ROLE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function filterPeopleRows(rows: ApiOccurrencePerson[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return rows;
  return rows.filter((row) => {
    const values = [row.person.fullName, OCCURRENCE_PERSON_ROLE_LABELS[row.role] ?? row.role]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return values.includes(normalized);
  });
}

function peopleColumns({
  canEdit,
  onRemovePerson,
}: {
  canEdit: boolean;
  onRemovePerson: (link: ApiOccurrencePerson) => void;
}): ColumnDef<ApiOccurrencePerson>[] {
  return [
    {
      id: "person",
      header: "Pessoa",
      accessorKey: "person.fullName",
      cell: ({ row }) => <div className="font-medium text-foreground">{row.original.person.fullName}</div>,
    },
    {
      id: "role",
      header: "Papel",
      accessorKey: "role",
      cell: ({ row }) => (
        <Badge variant="outline">{OCCURRENCE_PERSON_ROLE_LABELS[row.original.role] ?? row.original.role}</Badge>
      ),
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

export function OccurrencePeopleSection({
  rows,
  loading,
  canEdit,
  canAdd,
  onOpenPerson,
  onAddPerson,
  onRemovePerson,
}: {
  rows: ApiOccurrencePerson[];
  loading: boolean;
  canEdit: boolean;
  canAdd: boolean;
  onOpenPerson: (personId: string) => void;
  onAddPerson: () => void;
  onRemovePerson: (link: ApiOccurrencePerson) => void;
}) {
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);

  const columns = React.useMemo(() => peopleColumns({ canEdit, onRemovePerson }), [canEdit, onRemovePerson]);

  const filterFields = React.useMemo<SearchFieldDefinition[]>(
    () => [{ name: "role", label: "Papel", type: "select", options: ROLE_FILTER_OPTIONS }],
    [],
  );

  const buildSearchRecord = React.useCallback(
    (row: ApiOccurrencePerson) => ({ role: OCCURRENCE_PERSON_ROLE_LABELS[row.role] ?? row.role }),
    [],
  );

  const filteredRows = React.useMemo(() => {
    const matchedByDomain = rows.filter((row) =>
      matchesDomainRecord(buildSearchRecord(row), domain, (record, field) => record[field as keyof typeof record]),
    );
    return filterPeopleRows(matchedByDomain, searchText);
  }, [rows, searchText, domain, buildSearchRecord]);

  return (
    <RelationListHost<ApiOccurrencePerson>
      flushToolbar
      data={filteredRows}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      domain={domain}
      onDomainChange={setDomain}
      searchPlaceholder="Pesquisar por pessoa ou papel"
      filteredCount={filteredRows.length}
      filterFields={filterFields}
      buildSearchRecord={buildSearchRecord}
      searchActionId="occurrences.people"
      columns={columns}
      onAdd={canAdd ? onAddPerson : undefined}
    >
      {loading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Carregando envolvidos...</p>
      ) : filteredRows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Nenhuma pessoa vinculada.</p>
      ) : (
        <ListView<ApiOccurrencePerson>
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
