"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/confirm/use-confirm";
import { deleteDepositExit, type ApiDepositExit } from "@/modules/deposit/api";
import {
  formatOptionalDate,
  resolveExitTypeLabel,
} from "@/modules/deposit/features/items/domain/deposit-item-detail.helpers";
import {
  DEPOSIT_DEFAULT_SECTOR,
  DEPOSIT_EXIT_TYPE_OPTIONS,
  DEPOSIT_EXIT_TYPE_LABELS,
} from "@/modules/deposit/shared/domain/deposit.constants";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { ListView } from "@/web-client/views/ListView";
import { TruncatedTextCell } from "@/web-client/ui/TruncatedTextCell";
import { matchesDomainRecord } from "@/web-client/domain/evaluate";
import type { Domain } from "@/web-client/domain/types";
import type { SearchFieldDefinition } from "@/web-client/search/types";

function filterExitRows(rows: ApiDepositExit[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return rows;
  return rows.filter((row) => {
    const values = [
      row.sector || DEPOSIT_DEFAULT_SECTOR,
      resolveExitTypeLabel(row.type),
      row.destinationName ?? "",
      row.internalNotes ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return values.includes(normalized);
  });
}

function exitColumns(): ColumnDef<ApiDepositExit>[] {
  return [
    {
      id: "exitDate",
      header: "Data",
      accessorKey: "exitDate",
      cell: ({ row }) => <div className="text-sm">{formatOptionalDate(row.original.exitDate)}</div>,
    },
    {
      id: "sector",
      header: "Setor",
      accessorKey: "sector",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.sector || DEPOSIT_DEFAULT_SECTOR}
        </div>
      ),
    },
    {
      id: "type",
      header: "Tipo",
      accessorKey: "type",
      cell: ({ row }) => <div className="text-sm">{resolveExitTypeLabel(row.original.type)}</div>,
    },
    {
      id: "destinationName",
      header: "Destino",
      accessorKey: "destinationName",
      cell: ({ row }) => <div className="truncate text-sm">{row.original.destinationName ?? "-"}</div>,
    },
    {
      id: "allocations",
      header: "Lotes",
      accessorFn: (row) => row.allocations?.length ?? 0,
      cell: ({ row }) => {
        const count = row.original.allocations?.length ?? 0;
        return (
          <div className="text-sm text-muted-foreground">
            {count ? `${count} lote${count > 1 ? "s" : ""}` : "Automático"}
          </div>
        );
      },
    },
    {
      id: "quantity",
      header: "Quantidade",
      accessorFn: (row) => Number(row.quantity),
      cell: ({ row }) => (
        <div className="font-mono text-sm tabular-nums">
          {Number(row.original.quantity).toLocaleString("pt-BR")}
        </div>
      ),
    },
    {
      id: "unit",
      header: "Unid.",
      accessorKey: "unit",
      cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.original.unit}</div>,
    },
    {
      id: "notes",
      header: "Notas",
      accessorKey: "internalNotes",
      cell: ({ row }) => (
        <TruncatedTextCell text={row.original.internalNotes} className="text-sm text-muted-foreground" />
      ),
    },
  ];
}

export function DepositItemExitsSection({
  rows,
  loading,
  token,
  canAdd,
  canDelete,
  onOpenExit,
  onAddExit,
  onDeleted,
}: {
  rows: ApiDepositExit[];
  loading: boolean;
  token: string;
  canAdd: boolean;
  canDelete: boolean;
  onOpenExit: (exitId: string) => void;
  onAddExit: () => void;
  onDeleted: () => void;
}) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);
  const [selectedRows, setSelectedRows] = React.useState<ApiDepositExit[]>([]);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);

  const handleSelectionChange = React.useCallback((next: ApiDepositExit[]) => {
    setSelectedRows((previous) => {
      if (
        previous.length === next.length &&
        previous.every((row, index) => row.id === next[index]?.id)
      ) {
        return previous;
      }
      return next;
    });
  }, []);

  const columns = React.useMemo(() => exitColumns(), []);

  const filterFields = React.useMemo<SearchFieldDefinition[]>(
    () => [
      {
        name: "type",
        label: "Tipo",
        type: "select",
        options: DEPOSIT_EXIT_TYPE_OPTIONS.map((value) => ({
          value,
          label: DEPOSIT_EXIT_TYPE_LABELS[value],
        })),
      },
    ],
    [],
  );

  const buildSearchRecord = React.useCallback((row: ApiDepositExit) => ({ type: row.type }), []);

  const filteredRows = React.useMemo(() => {
    const matchedByDomain = rows.filter((row) =>
      matchesDomainRecord(buildSearchRecord(row), domain, (record, field) => record[field as keyof typeof record]),
    );
    return filterExitRows(matchedByDomain, searchText);
  }, [rows, searchText, domain, buildSearchRecord]);

  const handleBulkDelete = React.useCallback(async () => {
    if (!canDelete || selectedRows.length === 0) return;

    const confirmed = await confirm({
      title: "Excluir saídas selecionadas",
      description: `Excluir ${selectedRows.length} saída(s) selecionada(s)? Essa ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      confirmVariant: "destructive",
    });
    if (!confirmed) return;

    setBulkDeleting(true);
    let removed = 0;
    let failed = 0;
    try {
      const results = await Promise.allSettled(
        selectedRows.map((row) => deleteDepositExit(token, row.id)),
      );
      results.forEach((result) => {
        if (result.status === "fulfilled") removed += 1;
        else failed += 1;
      });
      toast({
        title: "Exclusão em massa concluída",
        description: `Excluídas: ${removed}${failed ? ` — Falharam: ${failed}` : ""}`,
        variant: failed > 0 ? "destructive" : "default",
      });
      setSelectedRows([]);
      onDeleted();
    } finally {
      setBulkDeleting(false);
    }
  }, [canDelete, confirm, onDeleted, selectedRows, toast, token]);

  return (
    <RelationListHost<ApiDepositExit>
      flushToolbar
      data={filteredRows}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      domain={domain}
      onDomainChange={setDomain}
      searchPlaceholder="Pesquisar saídas por tipo, setor, destino ou notas"
      filteredCount={filteredRows.length}
      filterFields={filterFields}
      buildSearchRecord={buildSearchRecord}
      searchActionId="deposit.item.exits"
      columns={columns}
      onAdd={canAdd ? onAddExit : undefined}
    >
      {loading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Carregando saídas...</p>
      ) : filteredRows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Sem saídas.</p>
      ) : (
        <ListView<ApiDepositExit>
          data={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          enableRowSelection={canDelete}
          onSelectionChange={handleSelectionChange}
          bulkActions={
            canDelete
              ? () => (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={bulkDeleting}
                    onClick={() => void handleBulkDelete()}
                  >
                    {bulkDeleting ? "Excluindo..." : "Excluir selecionados"}
                  </Button>
                )
              : undefined
          }
          onRowClick={(row) => onOpenExit(row.id)}
          showColumnVisibilityButton={false}
          bordered={false}
          stickyHeaderOffsetPx={117}
        />
      )}
    </RelationListHost>
  );
}
