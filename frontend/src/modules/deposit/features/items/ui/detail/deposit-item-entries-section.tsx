"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/confirm/use-confirm";
import { deleteDepositEntry, type ApiDepositEntry } from "@/modules/deposit/api";
import { formatOptionalDate } from "@/modules/deposit/features/items/domain/deposit-item-detail.helpers";
import { DEPOSIT_DEFAULT_SECTOR } from "@/modules/deposit/shared/domain/deposit.constants";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { ListView } from "@/web-client/views/ListView";
import { TruncatedTextCell } from "@/web-client/ui/TruncatedTextCell";
import type { Domain } from "@/web-client/domain/types";

function filterEntryRows(rows: ApiDepositEntry[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return rows;
  return rows.filter((row) => {
    const values = [
      row.donor?.name ?? "",
      row.sector || DEPOSIT_DEFAULT_SECTOR,
      row.internalNotes ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return values.includes(normalized);
  });
}

function entryColumns(): ColumnDef<ApiDepositEntry>[] {
  return [
    {
      id: "entryDate",
      header: "Data",
      accessorKey: "entryDate",
      cell: ({ row }) => <div className="text-sm">{formatOptionalDate(row.original.entryDate)}</div>,
    },
    {
      id: "expiryDate",
      header: "Data limite",
      accessorKey: "expiryDate",
      cell: ({ row }) => <div className="text-sm">{formatOptionalDate(row.original.expiryDate)}</div>,
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
      id: "donorName",
      header: "Fonte",
      accessorFn: (row) => row.donor?.name ?? "",
      cell: ({ row }) => (
        <div className="truncate text-sm">{row.original.donor?.name ?? "Sem fonte"}</div>
      ),
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
      id: "remaining",
      header: "Saldo",
      accessorFn: (row) => Number(row.remaining ?? row.quantity),
      cell: ({ row }) => (
        <div className="font-mono text-sm tabular-nums">
          {Number(row.original.remaining ?? row.original.quantity).toLocaleString("pt-BR")}
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

export function DepositItemEntriesSection({
  rows,
  loading,
  token,
  canAdd,
  canDelete,
  onOpenEntry,
  onAddEntry,
  onDeleted,
}: {
  rows: ApiDepositEntry[];
  loading: boolean;
  token: string;
  canAdd: boolean;
  canDelete: boolean;
  onOpenEntry: (entryId: string) => void;
  onAddEntry: () => void;
  onDeleted: () => void;
}) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);
  const [selectedRows, setSelectedRows] = React.useState<ApiDepositEntry[]>([]);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);

  const handleSelectionChange = React.useCallback((next: ApiDepositEntry[]) => {
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

  const columns = React.useMemo(() => entryColumns(), []);

  const filteredRows = React.useMemo(
    () => filterEntryRows(rows, searchText),
    [rows, searchText],
  );

  const handleBulkDelete = React.useCallback(async () => {
    if (!canDelete || selectedRows.length === 0) return;

    const blocked = selectedRows.filter((row) => (row.allocatedTotal ?? 0) > 0);
    if (blocked.length > 0) {
      toast({
        variant: "destructive",
        title: "Exclusão bloqueada",
        description: `${blocked.length} entrada(s) selecionada(s) já têm saída(s) vinculada(s) e não podem ser excluídas. Remova essas entradas da seleção antes de continuar.`,
      });
      return;
    }

    const confirmed = await confirm({
      title: "Excluir entradas selecionadas",
      description: `Excluir ${selectedRows.length} entrada(s) selecionada(s)? Essa ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      confirmVariant: "destructive",
    });
    if (!confirmed) return;

    setBulkDeleting(true);
    let removed = 0;
    let failed = 0;
    try {
      const results = await Promise.allSettled(
        selectedRows.map((row) => deleteDepositEntry(token, row.id)),
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
    <RelationListHost<ApiDepositEntry>
      flushToolbar
      data={filteredRows}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      domain={domain}
      onDomainChange={setDomain}
      searchPlaceholder="Pesquisar entradas por fonte, setor ou notas"
      filteredCount={filteredRows.length}
      searchActionId="deposit.item.entries"
      columns={columns}
      onAdd={canAdd ? onAddEntry : undefined}
    >
      {loading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Carregando entradas...</p>
      ) : filteredRows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Sem entradas.</p>
      ) : (
        <ListView<ApiDepositEntry>
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
          onRowClick={(row) => onOpenEntry(row.id)}
          showColumnVisibilityButton={false}
          bordered={false}
          stickyHeaderOffsetPx={117}
        />
      )}
    </RelationListHost>
  );
}
