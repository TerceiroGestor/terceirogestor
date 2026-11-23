"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { ApiPantryHistoryMovement } from "@/modules/pantry/api";
import {
  formatOptionalDate,
  resolveExitTypeLabel,
  resolveMovementKindLabel,
} from "@/modules/pantry/features/items/domain/pantry-item-detail.helpers";
import { PANTRY_DEFAULT_SECTOR } from "@/modules/pantry/shared/domain/pantry.constants";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { ListView } from "@/web-client/views/ListView";
import { TruncatedTextCell } from "@/web-client/ui/TruncatedTextCell";
import { matchesDomainRecord } from "@/web-client/domain/evaluate";
import type { Domain } from "@/web-client/domain/types";
import type { SearchFieldDefinition } from "@/web-client/search/types";

const MOVEMENT_KIND_OPTIONS = [
  { value: "ENTRY", label: "Entrada" },
  { value: "EXIT", label: "Saída" },
];

function filterHistoryRows(rows: ApiPantryHistoryMovement[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return rows;
  return rows.filter((row) => {
    const values = [
      resolveMovementKindLabel(row.kind),
      row.sector || PANTRY_DEFAULT_SECTOR,
      row.kind === "ENTRY" ? row.donorName ?? "" : "",
      row.kind === "EXIT" ? row.eventName ?? "" : "",
      row.actor,
      row.notes ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return values.includes(normalized);
  });
}

function historyColumns(): ColumnDef<ApiPantryHistoryMovement>[] {
  return [
    {
      id: "kind",
      header: "Movimento",
      accessorKey: "kind",
      cell: ({ row }) => (
        <Badge
          className={
            row.original.kind === "ENTRY"
              ? "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
              : "border-transparent bg-rose-500/15 text-rose-700 dark:text-rose-200"
          }
        >
          {resolveMovementKindLabel(row.original.kind)}
        </Badge>
      ),
    },
    {
      id: "movementDate",
      header: "Data",
      accessorKey: "movementDate",
      cell: ({ row }) => <div className="text-sm">{formatOptionalDate(row.original.movementDate)}</div>,
    },
    {
      id: "sector",
      header: "Setor",
      accessorKey: "sector",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.sector || PANTRY_DEFAULT_SECTOR}
        </div>
      ),
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
      id: "expiryDate",
      header: "Validade",
      accessorKey: "expiryDate",
      cell: ({ row }) => <div className="text-sm">{formatOptionalDate(row.original.expiryDate)}</div>,
    },
    {
      id: "donorName",
      header: "Doador",
      accessorKey: "donorName",
      cell: ({ row }) => (
        <div className="truncate text-sm">
          {row.original.kind === "ENTRY" ? (row.original.donorName ?? "-") : "-"}
        </div>
      ),
    },
    {
      id: "type",
      header: "Tipo de saída",
      accessorKey: "type",
      cell: ({ row }) => (
        <div className="truncate text-sm">
          {row.original.kind === "EXIT" && row.original.type
            ? resolveExitTypeLabel(row.original.type)
            : "—"}
        </div>
      ),
    },
    {
      id: "eventName",
      header: "Evento",
      accessorKey: "eventName",
      cell: ({ row }) => (
        <div className="truncate text-sm">
          {row.original.kind === "EXIT" ? (row.original.eventName ?? "-") : "-"}
        </div>
      ),
    },
    {
      id: "actor",
      header: "Usuário",
      accessorKey: "actor",
      cell: ({ row }) => <div className="truncate text-sm">{row.original.actor}</div>,
    },
    {
      id: "notes",
      header: "Notas",
      accessorKey: "notes",
      cell: ({ row }) => (
        <TruncatedTextCell text={row.original.notes} className="text-sm text-muted-foreground" />
      ),
    },
  ];
}

export function PantryItemHistorySection({
  rows,
  loading,
  onOpenEntry,
  onOpenExit,
}: {
  rows: ApiPantryHistoryMovement[];
  loading: boolean;
  onOpenEntry: (entryId: string) => void;
  onOpenExit: (exitId: string) => void;
}) {
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);

  const columns = React.useMemo(() => historyColumns(), []);

  const filterFields = React.useMemo<SearchFieldDefinition[]>(
    () => [{ name: "kind", label: "Movimento", type: "select", options: MOVEMENT_KIND_OPTIONS }],
    [],
  );

  const buildSearchRecord = React.useCallback(
    (row: ApiPantryHistoryMovement) => ({ kind: row.kind }),
    [],
  );

  const filteredRows = React.useMemo(() => {
    const matchedByDomain = rows.filter((row) =>
      matchesDomainRecord(buildSearchRecord(row), domain, (record, field) => record[field as keyof typeof record]),
    );
    return filterHistoryRows(matchedByDomain, searchText);
  }, [rows, searchText, domain, buildSearchRecord]);

  return (
    <RelationListHost<ApiPantryHistoryMovement>
      flushToolbar
      data={filteredRows}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      domain={domain}
      onDomainChange={setDomain}
      searchPlaceholder="Pesquisar histórico por movimento, usuário, setor ou notas"
      filteredCount={filteredRows.length}
      filterFields={filterFields}
      buildSearchRecord={buildSearchRecord}
      searchActionId="pantry.item.history"
      columns={columns}
    >
      {loading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Carregando histórico...</p>
      ) : filteredRows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Sem histórico.</p>
      ) : (
        <ListView<ApiPantryHistoryMovement>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          onRowClick={(row) => (row.kind === "ENTRY" ? onOpenEntry(row.id) : onOpenExit(row.id))}
          showColumnVisibilityButton={false}
          bordered={false}
          stickyHeaderOffsetPx={117}
        />
      )}
    </RelationListHost>
  );
}
