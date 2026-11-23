"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/confirm/use-confirm";
import { deletePantryEntry, type ApiPantryEntry } from "@/modules/pantry/api";
import { formatOptionalDate } from "@/modules/pantry/features/items/domain/pantry-item-detail.helpers";
import { PANTRY_DEFAULT_SECTOR } from "@/modules/pantry/shared/domain/pantry.constants";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { ListView } from "@/web-client/views/ListView";
import { TruncatedTextCell } from "@/web-client/ui/TruncatedTextCell";
import type { Domain } from "@/web-client/domain/types";

function filterEntryRows(rows: ApiPantryEntry[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return rows;
  return rows.filter((row) => {
    const values = [
      row.donor?.name ?? "",
      row.sector || PANTRY_DEFAULT_SECTOR,
      row.internalNotes ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return values.includes(normalized);
  });
}

function entryColumns(): ColumnDef<ApiPantryEntry>[] {
  return [
    {
      id: "entryDate",
      header: "Data",
      accessorKey: "entryDate",
      cell: ({ row }) => <div className="text-sm">{formatOptionalDate(row.original.entryDate)}</div>,
    },
    {
      id: "expiryDate",
      header: "Validade",
      accessorKey: "expiryDate",
      cell: ({ row }) => <div className="text-sm">{formatOptionalDate(row.original.expiryDate)}</div>,
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
      id: "donorName",
      header: "Doador",
      accessorFn: (row) => row.donor?.name ?? "",
      cell: ({ row }) => (
        <div className="truncate text-sm">{row.original.donor?.name ?? "Sem doador"}</div>
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

export function PantryItemEntriesSection({
  rows,
  loading,
  token,
  canAdd,
  canDelete,
  onOpenEntry,
  onAddEntry,
  onDeleted,
}: {
  rows: ApiPantryEntry[];
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
  const [selectedRows, setSelectedRows] = React.useState<ApiPantryEntry[]>([]);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);

  // Updater funcional evita setState com uma nova referencia de array
  // quando o conteudo nao mudou - sem isso, o ListView renotifica a cada
  // render do pai e entra em loop (mesma lição do bulk-delete de
  // Encontros/Atividades).
  const handleSelectionChange = React.useCallback((next: ApiPantryEntry[]) => {
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
        selectedRows.map((row) => deletePantryEntry(token, row.id)),
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
    <RelationListHost<ApiPantryEntry>
      flushToolbar
      data={filteredRows}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      domain={domain}
      onDomainChange={setDomain}
      searchPlaceholder="Pesquisar entradas por doador, setor ou notas"
      filteredCount={filteredRows.length}
      searchActionId="pantry.item.entries"
      columns={columns}
      onAdd={canAdd ? onAddEntry : undefined}
    >
      {loading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Carregando entradas...</p>
      ) : filteredRows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Sem entradas.</p>
      ) : (
        <ListView<ApiPantryEntry>
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
