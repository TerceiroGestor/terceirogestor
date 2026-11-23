"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { PantryAllocatedExitRow } from "@/modules/pantry/config/pantry-detail-layout-contract";
import {
  formatOptionalDate,
  resolveExitTypeLabel,
} from "@/modules/pantry/features/items/domain/pantry-item-detail.helpers";
import {
  PANTRY_EXIT_TYPE_OPTIONS,
  PANTRY_EXIT_TYPE_LABELS,
} from "@/modules/pantry/shared/domain/pantry.constants";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { ListView } from "@/web-client/views/ListView";
import { TruncatedTextCell } from "@/web-client/ui/TruncatedTextCell";
import { matchesDomainRecord } from "@/web-client/domain/evaluate";
import type { Domain } from "@/web-client/domain/types";
import type { SearchFieldDefinition } from "@/web-client/search/types";

function filterAllocatedExitRows(rows: PantryAllocatedExitRow[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return rows;
  return rows.filter((row) => {
    const values = [row.sector, resolveExitTypeLabel(row.type), row.eventName ?? "", row.internalNotes ?? ""]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return values.includes(normalized);
  });
}

function allocatedExitColumns(): ColumnDef<PantryAllocatedExitRow>[] {
  return [
    {
      id: "exitDate",
      header: "Data",
      accessorKey: "exitDate",
      cell: ({ row }) => <div className="text-sm">{formatOptionalDate(row.original.exitDate)}</div>,
    },
    {
      id: "type",
      header: "Tipo",
      accessorKey: "type",
      cell: ({ row }) => <div className="text-sm">{resolveExitTypeLabel(row.original.type)}</div>,
    },
    {
      id: "sector",
      header: "Setor",
      accessorKey: "sector",
      cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.original.sector}</div>,
    },
    {
      id: "quantity",
      header: "Quantidade",
      accessorFn: (row) => Number(row.quantity),
      cell: ({ row }) => (
        <div className="font-mono text-sm tabular-nums">
          {Number(row.original.quantity).toLocaleString("pt-BR")}{" "}
          <span className="text-muted-foreground">{row.original.unit}</span>
        </div>
      ),
    },
    {
      id: "eventName",
      header: "Evento",
      accessorKey: "eventName",
      cell: ({ row }) => <div className="truncate text-sm">{row.original.eventName ?? "-"}</div>,
    },
    {
      id: "notes",
      header: "Notas",
      accessorKey: "internalNotes",
      cell: ({ row }) => <TruncatedTextCell text={row.original.internalNotes} className="text-sm text-muted-foreground" />,
    },
  ];
}

export function PantryEntryAllocatedExitsSection({
  rows,
  loading,
  canAdd,
  onOpenExit,
  onAddExit,
}: {
  rows: PantryAllocatedExitRow[];
  loading: boolean;
  canAdd: boolean;
  onOpenExit: (exitId: string) => void;
  onAddExit: () => void;
}) {
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);

  const columns = React.useMemo(() => allocatedExitColumns(), []);

  const filterFields = React.useMemo<SearchFieldDefinition[]>(
    () => [
      {
        name: "type",
        label: "Tipo",
        type: "select",
        options: PANTRY_EXIT_TYPE_OPTIONS.map((value) => ({
          value,
          label: PANTRY_EXIT_TYPE_LABELS[value],
        })),
      },
    ],
    [],
  );

  const buildSearchRecord = React.useCallback(
    (row: PantryAllocatedExitRow) => ({ type: row.type }),
    [],
  );

  const filteredRows = React.useMemo(() => {
    const matchedByDomain = rows.filter((row) =>
      matchesDomainRecord(buildSearchRecord(row), domain, (record, field) => record[field as keyof typeof record]),
    );
    return filterAllocatedExitRows(matchedByDomain, searchText);
  }, [rows, searchText, domain, buildSearchRecord]);

  return (
    <RelationListHost<PantryAllocatedExitRow>
      flushToolbar
      data={filteredRows}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      domain={domain}
      onDomainChange={setDomain}
      searchPlaceholder="Pesquisar saídas por tipo, setor, evento ou notas"
      filteredCount={filteredRows.length}
      filterFields={filterFields}
      buildSearchRecord={buildSearchRecord}
      searchActionId="pantry.entry.allocatedExits"
      columns={columns}
      onAdd={canAdd ? onAddExit : undefined}
    >
      {loading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Carregando Saídas...</p>
      ) : filteredRows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Sem Saídas.</p>
      ) : (
        <ListView<PantryAllocatedExitRow>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.exitId}
          onRowClick={(row) => onOpenExit(row.exitId)}
          showColumnVisibilityButton={false}
          bordered={false}
          stickyHeaderOffsetPx={117}
        />
      )}
    </RelationListHost>
  );
}
