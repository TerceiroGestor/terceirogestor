"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { SectionDialog } from "@/components/section-dialog";
import { useAuth } from "@/features/auth/auth-context";
import { listPeople, type ApiPerson } from "@/modules/people/api";

type PersonPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onPick: (person: ApiPerson) => void;
};

export function PersonPickerDialog({
  open,
  onOpenChange,
  title = "Selecionar pessoa",
  description = "Escolha uma pessoa para vincular ao projeto.",
  onPick,
}: PersonPickerDialogProps) {
  const { token } = useAuth();

  const [rows, setRows] = React.useState<ApiPerson[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = React.useState("");

  const columns = React.useMemo<ColumnDef<ApiPerson>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Pessoa",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">
              {row.original.fullName}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.status ?? "-"}
            </p>
          </div>
        ),
      },
    ],
    [],
  );

  const load = React.useCallback(async () => {
    if (!token || !open) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listPeople(token, {
        q: search.trim() || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      setRows(response.data);
      setTotalCount(response.pagination.total);
      setPageCount(response.pagination.pages);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar pessoas.";
      setError(message);
      setRows([]);
      setTotalCount(0);
      setPageCount(0);
    } finally {
      setLoading(false);
    }
  }, [token, open, pagination.pageIndex, pagination.pageSize, search]);

  React.useEffect(() => {
    if (!open) return;
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [open, search]);

  React.useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  return (
    <SectionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      contentClassName="max-w-[980px]"
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        manualPagination
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={(next) => setPagination(next)}
        totalCount={totalCount}
        onGlobalFilterChange={setSearch}
        searchPlaceholder="Pesquisar pessoas"
        showExportMenu={false}
        onRowClick={(row) => {
          onPick(row as ApiPerson);
          onOpenChange(false);
        }}
        rowActions={[
          {
            id: "pick",
            label: "Selecionar",
            onSelect: (row: ApiPerson) => {
              onPick(row);
              onOpenChange(false);
            },
          },
        ]}
        summaryCards={{
          totalLabel: "Total",
          filteredLabel: "Filtrados",
        }}
      />

      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : null}
    </SectionDialog>
  );
}

